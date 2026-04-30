import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "../../services/api";

const SYSTEM_PROMPT = `You are SankatBot, an emergency response AI assistant for disaster situations in India.
Rules:
- Always respond in the SAME language the user spoke
- Keep responses SHORT — max 2 sentences
- Always be CALM and reassuring
- If user seems panicked, calm them first
- If user asks for help/rescue → tell them help is coming
- Give practical immediate advice
- Never say you are an AI — act like a real helper
- If user says bachao/help/emergency → say SOS is being sent`;

const LANGUAGES = {
  "hi-IN": "हिंदी",
  "en-IN": "English",
  "or-IN": "ଓଡ଼ିଆ",
  "bn-IN": "বাংলা",
};

const EMERGENCY_WORDS = [
  "bachao", "बचाओ", "bachao mujhe", "मुझे बचाओ",
  "madad", "मदद", "madad karo", "मदद करो",
  "help", "help me", "please help",
  "emergency", "rescue",
  "dub", "डूब", "doob", "pani mein", "पानी में",
  "trapped", "फंसा", "fansi", "fansa",
  "hurt", "injured", "chot", "चोट",
  "aag", "आग", "fire",
  "accident", "दुर्घटना",
  "hospital", "ambulance",
  "mar raha", "मर रहा", "death",
  "khatra", "खतरा", "danger",
  "gir gaya", "गिर गया", "fell",
  "breathe nahi", "saans nahi", "सांस नहीं",
  "sahayya kara", "ରକ୍ଷା କର",
  "সাহায্য করো", "help koro",
];

const PANIC_WORDS = [
  "dar", "डर", "dara", "scared", "afraid",
  "ghabra", "घबरा", "panic", "nervous",
  "rona", "रोना", "cry", "crying",
  "akela", "अकेला", "alone",
  "please", "koi nahi", "कोई नहीं",
];

const GREETINGS = {
  "hi-IN": "नमस्ते, मैं SankatBot हूं। मैं आपकी मदद के लिए यहां हूं। बताइए, क्या हुआ?",
  "en-IN": "Hello, I am SankatBot. I am here to help you. Tell me what happened.",
  "or-IN": "ନମସ୍କାର। ମୁଁ SankatBot। ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିବାକୁ ଏଠାରେ ଅଛି।",
  "bn-IN": "নমস্কার, আমি SankatBot। আমি আপনাকে সাহায্য করতে এখানে আছি।",
};

const THINKING_LABEL  = { "hi-IN": "SankatBot सोच रहा है…", "en-IN": "SankatBot is thinking…", "or-IN": "SankatBot ଭାବୁଛି…", "bn-IN": "SankatBot ভাবছে…" };
const LISTENING_LABEL = { "hi-IN": "सुन रहा है… बोलिए",     "en-IN": "Listening… speak now",   "or-IN": "ଶୁଣୁଛି… ବୋଲନ୍ତୁ",   "bn-IN": "শুনছি… বলুন" };
const SPEAKING_LABEL  = { "hi-IN": "SankatBot बोल रहा है…", "en-IN": "SankatBot is speaking…", "or-IN": "SankatBot କହୁଛି…", "bn-IN": "SankatBot বলছে…" };

function speak(text, lang, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.88; u.pitch = 1.1; u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const langCode = lang.split("-")[0];
  const preferred = voices.find((v) => v.lang.startsWith(langCode) && (v.name.includes("Female") || v.name.includes("female") || v.name.includes("Heera") || v.name.includes("Priya"))) || voices.find((v) => v.lang.startsWith(langCode));
  if (preferred) u.voice = preferred;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

export default function VoiceAI({ onSOSTrigger, onPanicDetected }) {
  const [isOpen,       setIsOpen]       = useState(false);
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [isThinking,   setIsThinking]   = useState(false);
  const [transcript,   setTranscript]   = useState("");
  const [aiResponse,   setAiResponse]   = useState("");
  const [conversation, setConversation] = useState([]);
  const [selectedLang, setSelectedLang] = useState("hi-IN");
  const [callActive,   setCallActive]   = useState(false);

  const recognitionRef  = useRef(null);
  const conversationRef = useRef([]);
  const callActiveRef   = useRef(false);

  useEffect(() => { callActiveRef.current = callActive; }, [callActive]);

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return;
    try { recognitionRef.current?.stop(); } catch (e) {}

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = selectedLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscriptTimeout = null;

    recognition.onstart = () => { setIsListening(true); console.log("Mic ON, lang:", selectedLang); };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }
      if (interimTranscript) setTranscript(interimTranscript);
      if (finalTranscript.trim()) {
        setTranscript(finalTranscript);
        clearTimeout(finalTranscriptTimeout);
        finalTranscriptTimeout = setTimeout(() => {
          setTranscript("");
          sendToAI(finalTranscript.trim());
        }, 500);
      }
    };

    recognition.onerror = (e) => {
      console.log("Recognition error:", e.error);
      if (e.error === "no-speech" || e.error === "aborted") return;
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log("Recognition ended, callActive:", callActiveRef.current);
      setIsListening(false);
      if (callActiveRef.current && !window.speechSynthesis.speaking) {
        setTimeout(() => { if (callActiveRef.current) startListening(); }, 300);
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { console.log("Start error:", e); }
  }, [selectedLang]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendToAI = useCallback(async (userMessage) => {
    setIsThinking(true);
    setIsListening(false);
    console.log("Sending to AI:", userMessage);

    const isEmergency = EMERGENCY_WORDS.some((w) => userMessage.toLowerCase().includes(w.toLowerCase()));
    const isPanic     = PANIC_WORDS.some((w) => userMessage.toLowerCase().includes(w.toLowerCase()));

    if (isEmergency) {
      onSOSTrigger?.();
      const emergencyReply = selectedLang.startsWith("hi")
        ? "आपका SOS भेज दिया गया है। मदद आ रही है। घबराइए नहीं, शांत रहें। हम आपके पास आ रहे हैं।"
        : "Your SOS has been sent. Help is coming. Stay calm. We are on our way.";
      setAiResponse(emergencyReply);
      setIsThinking(false);
      setIsSpeaking(true);
      speak(emergencyReply, selectedLang, () => {
        setIsSpeaking(false);
        if (callActiveRef.current) setTimeout(() => startListening(), 300);
      });
      return;
    }

    if (isPanic) {
      onPanicDetected?.();
      const panicReply = selectedLang.startsWith("hi")
        ? "घबराइए नहीं। आप सुरक्षित हैं। गहरी सांस लें। मैं आपके साथ हूं।"
        : "Do not panic. You are safe. Take a deep breath. I am with you.";
      setAiResponse(panicReply);
      setIsThinking(false);
      setIsSpeaking(true);
      speak(panicReply, selectedLang, () => {
        setIsSpeaking(false);
        if (callActiveRef.current) setTimeout(() => startListening(), 300);
      });
      return;
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationRef.current.slice(-6),
      { role: "user", content: userMessage },
    ];
    console.log("Messages count:", messages.length);

    try {
      const data = await api.voiceChat({ messages, language: selectedLang, userMessage }, selectedLang);
      console.log("AI response:", data.response);

      const aiText = data.response || (selectedLang.startsWith("hi") ? "मैं सुन रहा हूं। आप सुरक्षित हैं।" : "I hear you. You are safe.");

      const updated = [
        ...conversationRef.current,
        { role: "user",      content: userMessage },
        { role: "assistant", content: aiText },
      ];
      conversationRef.current = updated;
      setConversation(updated);
      setAiResponse(aiText);

      if (aiText.toLowerCase().includes("panic") || aiText.toLowerCase().includes("calm")) onPanicDetected?.();

      setIsThinking(false);
      setIsSpeaking(true);
      speak(aiText, selectedLang, () => {
        setIsSpeaking(false);
        if (callActiveRef.current) setTimeout(() => startListening(), 300);
      });
    } catch (err) {
      console.error("VoiceAI fetch error:", err.name, err.message);
      const fallbackPool = selectedLang.startsWith("hi")
        ? ["मैं समझ गया। आप सुरक्षित हैं। बताइए और क्या चाहिए।", "ठीक है। मदद रास्ते में है। शांत रहें।", "आपकी बात सुन रहा हूं। घबराइए नहीं।", "सब ठीक होगा। हम आपके साथ हैं।"]
        : ["I understand. You are safe. Tell me what else you need.", "Okay. Help is on the way. Stay calm.", "I hear you. Do not panic.", "Everything will be okay. We are with you."];
      const aiText = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
      setAiResponse(aiText);
      setIsThinking(false);
      setIsSpeaking(true);
      speak(aiText, selectedLang, () => {
        setIsSpeaking(false);
        if (callActiveRef.current) setTimeout(() => startListening(), 300);
      });
    }
  }, [selectedLang, onSOSTrigger, onPanicDetected, startListening]);

  const startCall = useCallback(async () => {
    await window.speechSynthesis?.resume?.();
    callActiveRef.current = true;
    setCallActive(true);
    setIsOpen(true);
    conversationRef.current = [];
    setConversation([]);

    const greeting = GREETINGS[selectedLang] || GREETINGS["en-IN"];
    setAiResponse(greeting);
    setIsSpeaking(true);
    speak(greeting, selectedLang, () => {
      setIsSpeaking(false);
      startListening();
    });
  }, [selectedLang, startListening]);

  const endCall = useCallback(() => {
    callActiveRef.current = false;
    setCallActive(false);
    setIsOpen(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsThinking(false);
    setTranscript("");
    setAiResponse("");
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    conversationRef.current = [];
    setConversation([]);
  }, []);

  const statusLabel = isThinking ? (THINKING_LABEL[selectedLang] || "Thinking…") : isSpeaking ? (SPEAKING_LABEL[selectedLang] || "Speaking…") : isListening ? (LISTENING_LABEL[selectedLang] || "Listening…") : "SankatBot";
  const avatarBorder = isSpeaking ? "#10B981" : isListening ? "#3B82F6" : "#6366F1";
  const avatarBg = isSpeaking ? "rgba(16,185,129,0.25)" : isListening ? "rgba(59,130,246,0.25)" : "rgba(99,102,241,0.25)";

  if (!isOpen) {
    return (
      <div style={{ position: "fixed", bottom: "100px", left: "24px", zIndex: 9997, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        {Object.entries(LANGUAGES).map(([code, name]) => (
          <button key={code} onClick={() => setSelectedLang(code)} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", cursor: "pointer", border: selectedLang === code ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.2)", background: selectedLang === code ? "rgba(16,185,129,0.2)" : "rgba(0,0,0,0.6)", color: "white" }}>
            {name}
          </button>
        ))}
        <button onClick={startCall} style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#10B981", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 4px rgba(16,185,129,0.3)", marginTop: "4px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        </button>
        <p style={{ color: "#9CA3AF", fontSize: "10px", textAlign: "center" }}>AI से बात करें</p>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.95)", zIndex: 9998, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: avatarBg, border: `3px solid ${avatarBorder}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", animation: (isSpeaking || isListening) ? "pulse 1.5s infinite" : "none", transition: "border-color 0.3s, background 0.3s" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
          <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
        </svg>
      </div>
      <p style={{ color: "#10B981", fontSize: "14px", marginBottom: "12px", fontWeight: 500 }}>{statusLabel}</p>
      {aiResponse && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "16px", padding: "14px 18px", maxWidth: "320px", marginBottom: "12px", textAlign: "center" }}>
          <p style={{ color: "#F9FAFB", fontSize: "16px", lineHeight: "1.6", margin: 0 }}>{aiResponse}</p>
        </div>
      )}
      {transcript && (
        <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "10px 16px", maxWidth: "320px", marginBottom: "12px" }}>
          <p style={{ color: "#93C5FD", fontSize: "14px", margin: 0 }}>आप: {transcript}</p>
        </div>
      )}
      {conversation.length > 0 && (
        <div style={{ maxHeight: "140px", overflowY: "auto", width: "100%", maxWidth: "320px", marginBottom: "20px" }}>
          {conversation.slice(-4).map((msg, i) => (
            <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left", marginBottom: "6px" }}>
              <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: "12px", fontSize: "12px", background: msg.role === "user" ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)", color: "#F9FAFB", maxWidth: "80%" }}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
      )}
      {!isListening && !isSpeaking && !isThinking && (
        <button onClick={() => startListening()} style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#3B82F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 0 0 4px rgba(59,130,246,0.25)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 2a3 3 0 013 3v7a3 3 0 01-6 0V5a3 3 0 013-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" />
          </svg>
        </button>
      )}
      <button onClick={endCall} style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EF4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 4px rgba(239,68,68,0.25)" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6L3.07 9.8A19.79 19.79 0 012 2.18C2 1.94 2.94 2 3 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.73 9.9" />
          <line x1="23" y1="1" x2="1" y2="23" />
        </svg>
      </button>
      <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "8px" }}>Call समाप्त करें</p>
      <style>{`@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 ${avatarBorder}44; } 50% { box-shadow: 0 0 0 12px ${avatarBorder}00; } }`}</style>
    </div>
  );
}
