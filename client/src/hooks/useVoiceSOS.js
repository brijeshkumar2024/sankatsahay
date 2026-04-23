import { useEffect, useRef, useState } from "react";

export default function useVoiceSOS(onKeyword) {
  const [enabled, setEnabled] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      recognitionRef.current?.stop?.();
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.lang = "en-IN";
    rec.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript?.toUpperCase() || "";
      if (text.includes("SANKAT") || text.includes("HELP")) {
        onKeyword();
      }
    };
    rec.start();
    recognitionRef.current = rec;

    return () => rec.stop();
  }, [enabled, onKeyword]);

  return { enabled, setEnabled };
}
