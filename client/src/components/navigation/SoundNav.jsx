/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import PanicReversal from "../ai/PanicReversal";

const BASE_URL = import.meta.env.VITE_API_URL;

// ── Geo helpers ───────────────────────────────────────────────────────────────
function toRad(v) { return (v * Math.PI) / 180; }

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const p1 = toRad(lat1), p2 = toRad(lat2);
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getBearing(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function getCardinalDirection(bearing) {
  const b = ((bearing % 360) + 360) % 360;
  if (b < 30 || b >= 330) return "N";
  if (b < 60)  return "NE";
  if (b < 120) return "E";
  if (b < 150) return "SE";
  if (b < 210) return "S";
  if (b < 240) return "SW";
  if (b < 300) return "W";
  return "NW";
}

function formatDistance(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} metres`;
}

function getDirectionMessage(bearing, dist, lang) {
  const dir = getCardinalDirection(bearing);
  const distStr = formatDistance(dist);
  const isHi = lang.startsWith("hi");
  const dirMap = isHi
    ? { N: "सीधे आगे बढ़ें", NE: "उत्तर-पूर्व की ओर बढ़ें", E: "दाएं मुड़ें", SE: "दक्षिण-पूर्व की ओर बढ़ें", S: "पीछे मुड़ें", SW: "दक्षिण-पश्चिम की ओर बढ़ें", W: "बाएं मुड़ें", NW: "उत्तर-पश्चिम की ओर बढ़ें" }
    : { N: "straight ahead", NE: "north-east", E: "right", SE: "south-east", S: "turn around", SW: "south-west", W: "left", NW: "north-west" };
  return isHi
    ? `${dirMap[dir] || dir}। ${distStr} बाकी है।`
    : `Go ${dirMap[dir] || dir}. ${distStr} remaining.`;
}

// ── Language config ───────────────────────────────────────────────────────────
const LANGUAGES = {
  "hi-IN": { label: "हिंदी" },
  "en-IN": { label: "English" },
  "or-IN": { label: "ଓଡ଼ିଆ" },
};

// ── Arrow rotation by cardinal direction ──────────────────────────────────────
const DIR_ROTATION = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

const SILENCE_WARNING_SECONDS = 20;
const AUTO_SOS_SECONDS = 30;

const EMERGENCY_WORDS = ["bachao", "help", "emergency", "madad", "बचाओ", "मदद", "trapped", "फंसा", "hurt", "injured"];
const PANIC_WORDS     = ["dar", "scared", "afraid", "panic", "डर", "घबरा", "please help", "koi nahi"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function SoundNav({
  targetLat,
  targetLng,
  target     = [20.305, 85.835],
  targetName = "Shelter",
  onArrived,
  onSOSTrigger,
  onStopNav,
  socket,
  user,
}) {
  const resolvedLat = typeof targetLat === "number" ? targetLat : target[0];
  const resolvedLng = typeof targetLng === "number" ? targetLng : target[1];

  const [audioStarted,     setAudioStarted]     = useState(false);
  const [selectedLang,     setSelectedLang]      = useState("hi-IN");
  const [direction,        setDirection]         = useState("N");
  const [distance,         setDistance]          = useState(null);
  const [isSpeaking,       setIsSpeaking]        = useState(false);
  const [panicDetected,    setPanicDetected]     = useState(false);
  const [aiActive,         setAiActive]          = useState(false);
  const [autoSOSCountdown, setAutoSOSCountdown]  = useState(null);
  const [currentPos,       setCurrentPos]        = useState({ lat: 20.2961, lng: 85.8245 });

  const recognitionRef   = useRef(null);
  const silenceTimerRef  = useRef(null);
  const autoSOSTimerRef  = useRef(null);
  const navIntervalRef   = useRef(null);
  const aiActiveRef      = useRef(false);
  const distanceRef      = useRef(null);
  const directionRef     = useRef("N");

  // Keep refs in sync
  useEffect(() => { aiActiveRef.current = aiActive; }, [aiActive]);
  useEffect(() => { distanceRef.current = distance; }, [distance]);
  useEffect(() => { directionRef.current = direction; }, [direction]);

  // ── Core speak + listen ───────────────────────────────────────────────────
  const speakAndListen = useCallback((text, lang) => {
    const useLang = lang || selectedLang;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    const u = new SpeechSynthesisUtterance(text);
    u.lang   = useLang;
    u.rate   = 0.88;
    u.pitch  = 1.1;
    u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith(useLang.split("-")[0]) &&
      (v.name.includes("Female") || v.name.includes("female") || v.name.includes("Priya"))
    ) || voices.find(v => v.lang.startsWith(useLang.split("-")[0]));
    if (preferred) u.voice = preferred;
    u.onend = () => {
      setIsSpeaking(false);
      if (aiActiveRef.current) startContinuousListening();
    };
    window.speechSynthesis.speak(u);
  }, [selectedLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Continuous speech recognition ─────────────────────────────────────────
  const startContinuousListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang            = selectedLang;
    recognition.continuous      = true;
    recognition.interimResults  = false;

    recognition.onresult = async (event) => {
      const text = event.results[event.results.length - 1][0].transcript;
      resetSilenceTimer();

      if (EMERGENCY_WORDS.some(w => text.toLowerCase().includes(w))) {
        handleEmergencyVoice(); return;
      }
      if (PANIC_WORDS.some(w => text.toLowerCase().includes(w))) {
        handlePanicVoice(); return;
      }
      await sendVoiceToAI(text);
    };

    recognition.onerror = () => {};

    recognition.onend = () => {
      if (aiActiveRef.current) setTimeout(() => startContinuousListening(), 500);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (_) {}
  }, [selectedLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send to NVIDIA AI ──────────────────────────────────────────────────────
  const sendVoiceToAI = async (userText) => {
    try {
      const res = await fetch(`${BASE_URL}/ai/voice-chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are SankatBot guiding someone to ${targetName} emergency shelter during a disaster.
Distance remaining: ${formatDistance(distanceRef.current || 0)}.
Direction: ${directionRef.current}.
Be very brief — max 1-2 sentences. Respond in same language as user. Always end with encouragement.`,
            },
            { role: "user", content: userText },
          ],
          language: selectedLang,
        }),
      });
      const data = await res.json();
      speakAndListen(data.response, selectedLang);
    } catch {
      const fallback = selectedLang.startsWith("hi")
        ? "चलते रहें। आप सही रास्ते पर हैं।"
        : "Keep moving. You are on the right path.";
      speakAndListen(fallback);
    }
  };

  // ── Silence / auto-SOS timer ───────────────────────────────────────────────
  const triggerAutoSOS = useCallback(() => {
    const msg = selectedLang.startsWith("hi")
      ? "मदद बुलाई जा रही है।"
      : "Help is being called. Stay where you are.";
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(msg);
    u.lang = selectedLang;
    window.speechSynthesis.speak(u);
    navigator.vibrate?.([500, 200, 500, 200, 500]);
    const sosPayload = {
      lat: currentPos.lat,
      lng: currentPos.lng,
      type: "auto-sos-silence",
      reason: "No voice or touch detected for 50 seconds during navigation",
      timestamp: new Date().toISOString(),
    };
    onSOSTrigger?.(sosPayload);
    socket?.emit("sos:silent", { userId: user?._id || user?.id || "demo-user", ...sosPayload });
    setAutoSOSCountdown(null);
  }, [selectedLang, currentPos, onSOSTrigger, socket, user]);

  const resetSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(autoSOSTimerRef.current);
    setAutoSOSCountdown(null);

    silenceTimerRef.current = setTimeout(() => {
      const question = selectedLang.startsWith("hi")
        ? "क्या आप ठीक हैं? कुछ बोलिए या स्क्रीन छूइए।"
        : "Are you okay? Please speak or touch the screen.";
      speakAndListen(question);

      let count = AUTO_SOS_SECONDS;
      setAutoSOSCountdown(count);
      autoSOSTimerRef.current = setInterval(() => {
        count -= 1;
        setAutoSOSCountdown(count);
        if (count <= 0) {
          clearInterval(autoSOSTimerRef.current);
          triggerAutoSOS();
        }
      }, 1000);
    }, SILENCE_WARNING_SECONDS * 1000);
  }, [selectedLang, speakAndListen, triggerAutoSOS]);

  // ── Panic / emergency handlers ─────────────────────────────────────────────
  const handlePanicVoice = useCallback(() => {
    setPanicDetected(true);
    const msg = selectedLang.startsWith("hi")
      ? "घबराइए नहीं। आप सुरक्षित हैं। मैं आपके साथ हूं। गहरी सांस लें। अभी सीधे चलते रहें।"
      : "Do not panic. You are safe. I am with you. Take a deep breath. Keep walking straight.";
    speakAndListen(msg);
    navigator.vibrate?.([500, 200, 500]);
    setTimeout(() => setPanicDetected(false), 30000);
  }, [selectedLang, speakAndListen]);

  const handleEmergencyVoice = useCallback(() => {
    const msg = selectedLang.startsWith("hi")
      ? "आपका SOS भेजा जा रहा है। मदद आ रही है। रुकिए मत।"
      : "Sending your SOS. Help is coming. Keep moving.";
    speakAndListen(msg);
    navigator.vibrate?.([1000, 500, 1000]);
    const sosPayload = {
      lat: currentPos.lat,
      lng: currentPos.lng,
      type: "voice-emergency",
      timestamp: new Date().toISOString(),
    };
    onSOSTrigger?.(sosPayload);
    socket?.emit("sos:silent", { userId: user?._id || user?.id || "demo-user", ...sosPayload });
  }, [selectedLang, speakAndListen, currentPos, onSOSTrigger, socket, user]);

  // ── Touch resets silence timer ─────────────────────────────────────────────
  useEffect(() => {
    if (!audioStarted) return;
    const handleTouch = () => {
      resetSilenceTimer();
      setAutoSOSCountdown(null);
      clearInterval(autoSOSTimerRef.current);
    };
    window.addEventListener("touchstart", handleTouch);
    window.addEventListener("click", handleTouch);
    return () => {
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("click", handleTouch);
    };
  }, [audioStarted, resetSilenceTimer]);

  // ── Start navigation ───────────────────────────────────────────────────────
  const handleStartNavigation = useCallback(async () => {
    await window.speechSynthesis.resume?.();
    setAudioStarted(true);
    setAiActive(true);
    aiActiveRef.current = true;

    const greeting = selectedLang.startsWith("hi")
      ? `ठीक है। मैं आपको ${targetName} तक ले जाऊंगा। रास्ते में कुछ भी पूछ सकते हैं। चलिए शुरू करते हैं।`
      : `Okay. I will guide you to ${targetName}. You can ask me anything on the way. Let us begin.`;

    speakAndListen(greeting);
    resetSilenceTimer();

    navIntervalRef.current = setInterval(() => {
      if (!aiActiveRef.current) { clearInterval(navIntervalRef.current); return; }

      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const lat  = pos.coords.latitude;
          const lng  = pos.coords.longitude;
          setCurrentPos({ lat, lng });

          const dist = getDistance(lat, lng, resolvedLat, resolvedLng);
          const bear = getBearing(lat, lng, resolvedLat, resolvedLng);
          const dir  = getCardinalDirection(bear);
          setDistance(dist);
          setDirection(dir);

          if (dist < 30) {
            const arrivedMsg = selectedLang.startsWith("hi")
              ? "आप पहुंच गए। राहत शिविर में प्रवेश करें।"
              : "You have arrived. Please enter the relief camp.";
            speakAndListen(arrivedMsg);
            navigator.vibrate?.([200, 100, 200, 100, 200]);
            stopNavigation();
            onArrived?.();
            return;
          }

          if (!window.speechSynthesis.speaking) {
            speakAndListen(getDirectionMessage(bear, dist, selectedLang));
          }
        },
        () => {
          // GPS failed — decrement demo distance
          setDistance(prev => Math.max(0, (prev ?? 500) - 50));
        },
        { timeout: 5000, maximumAge: 10000 }
      );
    }, 5000);
  }, [selectedLang, targetName, resolvedLat, resolvedLng, speakAndListen, resetSilenceTimer, onArrived]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop navigation ────────────────────────────────────────────────────────
  const stopNavigation = useCallback(() => {
    setAudioStarted(false);
    setAiActive(false);
    aiActiveRef.current = false;
    window.speechSynthesis.cancel();
    try { recognitionRef.current?.stop(); } catch (_) {}
    clearInterval(navIntervalRef.current);
    clearTimeout(silenceTimerRef.current);
    clearInterval(autoSOSTimerRef.current);
    setAutoSOSCountdown(null);
    setPanicDetected(false);
    onStopNav?.();
  }, [onStopNav]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => stopNavigation(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const arrowRotation = DIR_ROTATION[direction] ?? 0;

  // ── Pre-start screen ───────────────────────────────────────────────────────
  if (!audioStarted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "32px 16px", textAlign: "center" }}>
        <p style={{ color: "#9CA3AF", fontSize: "14px" }}>
          Voice navigation guides you to <strong style={{ color: "#F3F7FB" }}>{targetName}</strong> in your language.
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          {Object.entries(LANGUAGES).map(([code, cfg]) => (
            <button
              key={code}
              onClick={() => setSelectedLang(code)}
              style={{
                padding: "8px 16px", borderRadius: "8px", fontSize: "14px", cursor: "pointer",
                background: selectedLang === code ? "#10B981" : "transparent",
                border: `1px solid ${selectedLang === code ? "#10B981" : "rgba(255,255,255,0.2)"}`,
                color: selectedLang === code ? "#fff" : "#9CA3AF",
              }}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleStartNavigation}
          style={{ padding: "18px 40px", borderRadius: "14px", background: "#10B981", color: "#fff", border: "none", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}
        >
          Tap to Enable Voice Navigation
        </button>
        <p style={{ color: "#6B7280", fontSize: "12px" }}>Browser requires a tap before speaking</p>
      </div>
    );
  }

  // ── Active navigation screen ───────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px", textAlign: "center", position: "relative" }}>

      {/* Auto-SOS countdown banner */}
      {autoSOSCountdown !== null && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          background: "#7F1D1D", padding: "12px", textAlign: "center", zIndex: 9999,
        }}>
          <p style={{ color: "white", fontSize: "14px", margin: 0 }}>
            {selectedLang.startsWith("hi")
              ? `SOS ${autoSOSCountdown} सेकंड में — ठीक हों तो स्क्रीन छूएं`
              : `SOS in ${autoSOSCountdown}s — touch screen if okay`}
          </p>
          <button
            onClick={() => {
              clearInterval(autoSOSTimerRef.current);
              setAutoSOSCountdown(null);
              speakAndListen(selectedLang.startsWith("hi") ? "ठीक है। चलते रहें।" : "Okay. Keep moving.");
            }}
            style={{
              marginTop: "8px", padding: "6px 20px", background: "#10B981",
              color: "white", border: "none", borderRadius: "8px", cursor: "pointer",
            }}
          >
            {selectedLang.startsWith("hi") ? "मैं ठीक हूं" : "I am okay"}
          </button>
        </div>
      )}

      {/* Target name */}
      <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: autoSOSCountdown !== null ? "80px" : "0" }}>
        Navigating to <strong style={{ color: "#F3F7FB" }}>{targetName}</strong>
      </p>

      {/* Language selector */}
      <div style={{ display: "flex", gap: "6px" }}>
        {Object.entries(LANGUAGES).map(([code, cfg]) => (
          <button
            key={code}
            onClick={() => setSelectedLang(code)}
            style={{
              padding: "4px 10px", borderRadius: "6px", fontSize: "12px", cursor: "pointer",
              background: selectedLang === code ? "#10B981" : "transparent",
              border: `1px solid ${selectedLang === code ? "#10B981" : "rgba(255,255,255,0.15)"}`,
              color: selectedLang === code ? "#fff" : "#6B7280",
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Direction arrow */}
      <svg
        width="140" height="140" viewBox="0 0 100 100"
        style={{ transform: `rotate(${arrowRotation}deg)`, transition: "transform 0.5s ease" }}
      >
        <polygon
          points="50,5 95,95 50,75 5,95"
          fill={direction === "ARRIVED" ? "#10B981" : "#79D4FF"}
        />
      </svg>

      {/* Direction label */}
      <p style={{ fontSize: "28px", fontWeight: "bold", color: "#F3F7FB", margin: 0 }}>
        {direction === "ARRIVED" ? "✓ ARRIVED" : direction}
      </p>

      {/* Distance */}
      {distance !== null && (
        <p style={{ fontSize: "20px", color: "#9CA3AF", margin: 0 }}>
          <span style={{ color: "#F3F7FB", fontFamily: "monospace" }}>{formatDistance(distance)}</span> to shelter
        </p>
      )}

      {/* Speaking indicator */}
      <p style={{ fontSize: "12px", color: isSpeaking ? "#10B981" : "#4B5563", margin: 0 }}>
        {isSpeaking ? "🔊 Speaking…" : "🎙️ Listening…"}
      </p>

      {/* Panic calm banner */}
      {panicDetected && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#1F2937", borderTop: "2px solid #10B981",
          padding: "20px", textAlign: "center", zIndex: 9998,
        }}>
          <p style={{ color: "#10B981", fontSize: "18px", marginBottom: "8px" }}>
            {selectedLang.startsWith("hi") ? "शांत रहें। आप सुरक्षित हैं।" : "Stay calm. You are safe."}
          </p>
          <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0 }}>
            {selectedLang.startsWith("hi") ? "गहरी सांस लें और चलते रहें" : "Take deep breaths and keep walking"}
          </p>
          <button
            onClick={() => setPanicDetected(false)}
            style={{ marginTop: "12px", padding: "6px 20px", background: "#10B981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}
          >
            {selectedLang.startsWith("hi") ? "ठीक हूं" : "I am okay"}
          </button>
        </div>
      )}

      {/* Panic reversal overlay (full-screen) */}
      {panicDetected && (
        <PanicReversal
          isActive
          onDismiss={() => {
            setPanicDetected(false);
            speakAndListen(selectedLang.startsWith("hi") ? "बहुत अच्छे! चलते रहें।" : "Great! Keep moving.");
          }}
        />
      )}

      {/* Stop navigation */}
      <button
        onClick={stopNavigation}
        style={{
          marginTop: "8px", padding: "10px 24px", borderRadius: "10px",
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
          color: "#EF4444", fontSize: "14px", cursor: "pointer",
        }}
      >
        {selectedLang.startsWith("hi") ? "नेविगेशन बंद करें" : "Stop Navigation"}
      </button>

      {/* Fixed emergency SOS button */}
      <button
        onClick={handleEmergencyVoice}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "70px", height: "70px", borderRadius: "50%",
          background: "#EF4444", color: "white", border: "none",
          fontSize: "12px", fontWeight: "bold", cursor: "pointer", zIndex: 9997,
          boxShadow: "0 0 0 4px rgba(239,68,68,0.3)",
        }}
      >
        SOS
      </button>
    </div>
  );
}
