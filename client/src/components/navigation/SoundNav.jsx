/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import PanicReversal from "../ai/PanicReversal";

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

// ── Web Speech API — NO Tone.js ───────────────────────────────────────────────
function speak(text, lang = "hi-IN") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang   = lang;
  u.rate   = 0.85;
  u.pitch  = 1;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

// ── Language config ───────────────────────────────────────────────────────────
const LANGUAGES = {
  "hi-IN": {
    label: "हिंदी",
    messages: {
      started:    (name) => `नेविगेशन शुरू। लक्ष्य: ${name}`,
      forward:    "सीधे आगे बढ़ें",
      left:       "बाईं ओर मुड़ें",
      right:      "दाईं ओर मुड़ें",
      turnAround: "पीछे मुड़ें",
      arrived:    "आप पहुंच गए। आश्रय मिल गया।",
      calm:       "घबराएं नहीं। मदद आ रही है।",
      great:      "बहुत अच्छे! चलते रहें।",
    },
  },
  "en-IN": {
    label: "English",
    messages: {
      started:    (name) => `Navigation started. Target: ${name}`,
      forward:    "Continue straight ahead",
      left:       "Turn left",
      right:      "Turn right",
      turnAround: "Turn around",
      arrived:    "You have arrived at the shelter.",
      calm:       "Don't panic. Help is coming.",
      great:      "Great! Keep moving.",
    },
  },
  "or-IN": {
    label: "ଓଡ଼ିଆ",
    messages: {
      started:    (name) => `ନେଭିଗେସନ ଆରମ୍ଭ। ଲକ୍ଷ୍ୟ: ${name}`,
      forward:    "ସିଧା ଆଗକୁ ଯାଆନ୍ତୁ",
      left:       "ବାମ ଦିଗକୁ ମୋଡ଼ନ୍ତୁ",
      right:      "ଡାହାଣ ଦିଗକୁ ମୋଡ଼ନ୍ତୁ",
      turnAround: "ପଛକୁ ଫେରନ୍ତୁ",
      arrived:    "ଆପଣ ପହଞ୍ଚି ଗଲେ।",
      calm:       "ଭୟ କରନ୍ତୁ ନାହିଁ। ସାହାଯ୍ୟ ଆସୁଛି।",
      great:      "ବହୁତ ଭଲ! ଚାଲୁ ରୁହନ୍ତୁ।",
    },
  },
};

// ── Panic check questions ─────────────────────────────────────────────────────
const PANIC_CHECK_QUESTIONS = [
  {
    question: "क्या आप ठीक हैं? (Are you okay?)",
    options: [
      { text: "हां, ठीक हूं (Yes, I am fine)",       panic: false },
      { text: "थोड़ा डरा हुआ हूं (Feeling scared)",   panic: true  },
      { text: "बहुत डर लग रहा है (Very scared)",      panic: true  },
    ],
  },
  {
    question: "क्या आप चल सकते हैं? (Can you walk?)",
    options: [
      { text: "हां, चल सकता हूं (Yes)",    panic: false },
      { text: "मुश्किल है (Difficult)",     panic: true  },
      { text: "नहीं (No)",                  panic: true  },
    ],
  },
  {
    question: "क्या आप अकेले हैं? (Are you alone?)",
    options: [
      { text: "नहीं, साथ में हैं (No, with others)", panic: false },
      { text: "हां, अकेला हूं (Yes, alone)",          panic: true  },
      { text: "बच्चे साथ हैं (With children)",        panic: true  },
    ],
  },
];

// ── Arrow rotation by cardinal direction ──────────────────────────────────────
const DIR_ROTATION = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

// ── Component ─────────────────────────────────────────────────────────────────
export default function SoundNav({
  targetLat,
  targetLng,
  target     = [20.305, 85.835],
  targetName = "Shelter",
  onArrived,
  socket,
  user,
}) {
  const resolvedLat = typeof targetLat === "number" ? targetLat : target[0];
  const resolvedLng = typeof targetLng === "number" ? targetLng : target[1];

  const [audioStarted,    setAudioStarted]    = useState(false);
  const [selectedLang,    setSelectedLang]    = useState("hi-IN");
  const [direction,       setDirection]       = useState("N");
  const [distance,        setDistance]        = useState(null);
  const [isSpeaking,      setIsSpeaking]      = useState(false);
  const [showPanicCheck,  setShowPanicCheck]  = useState(false);
  const [panicDetected,   setPanicDetected]   = useState(false);
  const [checkStep,       setCheckStep]       = useState(0);
  const [currentPos,      setCurrentPos]      = useState({ lat: 20.2961, lng: 85.8245 });

  const navIntervalRef   = useRef(null);
  const panicIntervalRef = useRef(null);
  const cancelRef        = useRef(false);

  const sayIt = useCallback((text) => {
    setIsSpeaking(true);
    speak(text, selectedLang);
    setTimeout(() => setIsSpeaking(false), 3000);
  }, [selectedLang]);

  // ── Start navigation ────────────────────────────────────────────────────────
  const startNavigation = useCallback(() => {
    setAudioStarted(true);
    const msgs = LANGUAGES[selectedLang].messages;
    sayIt(msgs.started(targetName));
  }, [selectedLang, targetName, sayIt]);

  // ── Navigation tick ─────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (cancelRef.current) return;
    const msgs = LANGUAGES[selectedLang].messages;

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        if (cancelRef.current) return;
        const lat  = pos.coords.latitude;
        const lng  = pos.coords.longitude;
        setCurrentPos({ lat, lng });

        const dist = getDistance(lat, lng, resolvedLat, resolvedLng);
        const bear = getBearing(lat, lng, resolvedLat, resolvedLng);
        const dir  = getCardinalDirection(bear);

        setDistance(dist);
        setDirection(dir);

        if (dist < 30) {
          sayIt(msgs.arrived);
          navigator.vibrate?.([200, 100, 200, 100, 200]);
          cancelRef.current = true;
          clearInterval(navIntervalRef.current);
          onArrived?.();
          return;
        }

        const isForward = ["N", "NE", "NW"].includes(dir);
        const isLeft    = ["W", "SW"].includes(dir);
        const isRight   = ["E", "SE"].includes(dir);

        if (isForward) {
          sayIt(`${msgs.forward}. ${formatDistance(dist)} remaining.`);
          navigator.vibrate?.([200, 100, 200]);
        } else if (isLeft) {
          sayIt(msgs.left);
          navigator.vibrate?.([200, 100, 200, 100, 200]);
        } else if (isRight) {
          sayIt(msgs.right);
          navigator.vibrate?.([500]);
        } else {
          sayIt(msgs.turnAround);
          navigator.vibrate?.([1000]);
        }
      },
      () => sayIt("Continuing navigation. Follow the arrow."),
      { timeout: 5000, maximumAge: 10000 }
    );
  }, [selectedLang, resolvedLat, resolvedLng, sayIt, onArrived]);

  // ── Start intervals after audio enabled ────────────────────────────────────
  useEffect(() => {
    if (!audioStarted) return undefined;
    cancelRef.current = false;

    tick();
    navIntervalRef.current = setInterval(tick, 5000);

    // Panic check every 60 seconds
    panicIntervalRef.current = setInterval(() => {
      if (cancelRef.current) return;
      const q = PANIC_CHECK_QUESTIONS[checkStep % PANIC_CHECK_QUESTIONS.length];
      setShowPanicCheck(true);
      speak(q.question, selectedLang);
    }, 60000);

    return () => {
      cancelRef.current = true;
      clearInterval(navIntervalRef.current);
      clearInterval(panicIntervalRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [audioStarted]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle panic answer ─────────────────────────────────────────────────────
  const handlePanicAnswer = useCallback((option) => {
    setShowPanicCheck(false);
    setCheckStep((prev) => prev + 1);
    const msgs = LANGUAGES[selectedLang].messages;

    if (option.panic) {
      setPanicDetected(true);
      sayIt(msgs.calm);
      navigator.vibrate?.([500, 200, 500]);
      socket?.emit("sos:silent", {
        userId: user?._id || user?.id || "demo-user",
        lat: currentPos.lat,
        lng: currentPos.lng,
        type: "panic-detected-during-navigation",
        timestamp: new Date().toISOString(),
      });
    } else {
      sayIt(msgs.great);
    }
  }, [selectedLang, sayIt, socket, user, currentPos]);

  const handleEmergencySOS = useCallback(() => {
    const msgs = LANGUAGES[selectedLang].messages;
    sayIt(msgs.calm);
    socket?.emit("sos:silent", {
      userId: user?._id || user?.id || "demo-user",
      lat: currentPos.lat,
      lng: currentPos.lng,
      type: "emergency-button-navigation",
      timestamp: new Date().toISOString(),
    });
    setPanicDetected(true);
  }, [selectedLang, sayIt, socket, user, currentPos]);

  const arrowRotation = DIR_ROTATION[direction] ?? 0;
  const currentQ      = PANIC_CHECK_QUESTIONS[checkStep % PANIC_CHECK_QUESTIONS.length];

  // ── Pre-start screen ────────────────────────────────────────────────────────
  if (!audioStarted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "32px 16px", textAlign: "center" }}>
        <p style={{ color: "#9CA3AF", fontSize: "14px" }}>
          Voice navigation guides you to <strong style={{ color: "#F3F7FB" }}>{targetName}</strong> in your language.
        </p>

        {/* Language selector */}
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
          onClick={startNavigation}
          style={{ padding: "18px 40px", borderRadius: "14px", background: "#10B981", color: "#fff", border: "none", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}
        >
          Tap to Enable Voice Navigation
        </button>
        <p style={{ color: "#6B7280", fontSize: "12px" }}>Browser requires a tap before speaking</p>
      </div>
    );
  }

  // ── Active navigation screen ────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "16px", textAlign: "center", position: "relative" }}>

      {/* Target name */}
      <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
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
        {isSpeaking ? "🔊 Speaking…" : "🔇 Listening for GPS…"}
      </p>

      {/* Panic reversal overlay */}
      {panicDetected && (
        <PanicReversal
          isActive
          onDismiss={() => {
            setPanicDetected(false);
            sayIt(LANGUAGES[selectedLang].messages.great);
          }}
        />
      )}

      {/* Panic check bottom sheet */}
      {showPanicCheck && !panicDetected && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#111827", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px 20px 0 0", padding: "24px", zIndex: 9999,
        }}>
          <p style={{ color: "#F9FAFB", fontSize: "18px", marginBottom: "16px", textAlign: "center" }}>
            {currentQ.question}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handlePanicAnswer(opt)}
                style={{
                  padding: "16px", borderRadius: "12px", cursor: "pointer", textAlign: "left",
                  border: "1px solid rgba(255,255,255,0.2)", fontSize: "15px", color: "white",
                  background: opt.panic ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fixed emergency SOS button */}
      <button
        onClick={handleEmergencySOS}
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "70px", height: "70px", borderRadius: "50%",
          background: "#EF4444", color: "white", border: "none",
          fontSize: "12px", fontWeight: "bold", cursor: "pointer", zIndex: 9998,
          boxShadow: "0 0 0 4px rgba(239,68,68,0.3)",
        }}
      >
        SOS
      </button>
    </div>
  );
}
