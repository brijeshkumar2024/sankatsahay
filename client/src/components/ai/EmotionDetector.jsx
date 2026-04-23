import { useEffect, useMemo, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import Card from "../ui/Card";
import { api } from "../../services/api";

const levels = ["CALM", "ANXIOUS", "PANICKING", "UNRESPONSIVE"];

function expressionToState(expressions) {
  if (!expressions) return { state: "UNRESPONSIVE", confidence: 0 };
  const fearful = expressions.fearful || 0;
  const angry = expressions.angry || 0;
  const disgusted = expressions.disgusted || 0;
  const happy = expressions.happy || 0;
  const neutral = expressions.neutral || 0;
  const surprised = expressions.surprised || 0;

  if ((angry + disgusted > 0.6 && fearful > 0.7) || fearful > 0.75) return { state: "PANICKING", confidence: fearful };
  if (surprised > 0.35 || fearful > 0.35) return { state: "ANXIOUS", confidence: Math.max(surprised, fearful) };
  if (happy > 0.25 || neutral > 0.35) return { state: "CALM", confidence: Math.max(happy, neutral) };
  return { state: "ANXIOUS", confidence: 0.4 };
}

export default function EmotionDetector({ userId, socket, onPanicDetected }) {
  const [sample, setSample] = useState("ANXIOUS");
  const [confidence, setConfidence] = useState(0);
  const [cameraDenied, setCameraDenied] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let interval;
    let stream;
    let mounted = true;

    const start = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        interval = setInterval(async () => {
          if (!videoRef.current || !mounted) return;
          const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();

          const next = expressionToState(detection?.expressions);
          setSample(next.state);
          setConfidence(Number((next.confidence || 0).toFixed(2)));
          socket?.emit("emotion:update", { userId, state: next.state, confidence: next.confidence || 0 });
          if (next.state === "PANICKING") {
            onPanicDetected?.();
          }
        }, 1000);
      } catch {
        setCameraDenied(true);
        const fallback = await api.aiChat(
          "Analyze tone from sample messages: I am scared. I cannot breathe. Is help coming?",
          "English",
          "Return one label: CALM/ANXIOUS/PANICKING"
        ).catch(() => ({ reply: "ANXIOUS" }));
        const label = String(fallback.reply || "ANXIOUS").toUpperCase();
        const state = levels.includes(label) ? label : "ANXIOUS";
        setSample(state);
        setConfidence(0.55);
        socket?.emit("emotion:update", { userId, state, confidence: 0.55 });
      }
    };

    start();
    return () => {
      mounted = false;
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [socket, userId, onPanicDetected]);

  const color = useMemo(() => {
    if (sample === "CALM") return "text-safe";
    if (sample === "ANXIOUS") return "text-warn";
    if (sample === "PANICKING") return "text-alert";
    return "text-muted";
  }, [sample]);

  return (
    <Card>
      <p className="text-sm text-muted">Emotional State Detection</p>
      <video ref={videoRef} muted playsInline className="mt-3 w-full rounded-lg border border-border bg-black/40" />
      <p className={`mt-3 inline-block rounded-full bg-black/20 px-3 py-1 font-heading text-xl ${color}`}>{sample}</p>
      <p className="mt-2 text-xs text-muted">Confidence: {(confidence * 100).toFixed(0)}%</p>
      <p className="mt-1 text-xs text-muted">{cameraDenied ? "Camera denied - using text fallback analysis" : "Face data stays local"}</p>
    </Card>
  );
}
