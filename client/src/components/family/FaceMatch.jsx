import { useEffect, useState } from "react";
import Card from "../../ui/Card.jsx";
import Button from "../../ui/Button.jsx";
import { api } from "../../../services/api.js";
import useDemoStore from "../../store/useDemoStore";

export default function FaceMatch() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode] = useDemoStore((s) => [s.activePhase === "family"]);
  const [imageSrc, setImageSrc] = useState("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80");

  const performMatch = async () => {
    setLoading(true);
    try {
      // Always simulate high-confidence match for demo - bulletproof
      const demoMatches = [
        {
          userId: "demo-family-1",
          name: "Priya Sahoo",
          photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
          familyPin: "FAM-2471",
          distance: 0.05,
          confidence: 95
        },
        {
          userId: "demo-family-2",
          name: "Rajesh Patra",
          photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          familyPin: "FAM-2471",
          distance: 0.12,
          confidence: 89
        },
        {
          userId: "demo-family-3",
          name: "Anita Behera",
          photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
          familyPin: "FAM-2471",
          distance: 0.21,
          confidence: 82
        }
      ];
      setMatches(demoMatches);
    } catch (err) {
      // Fallback even if sim fails
      setMatches([
        { name: "Family Member (High Confidence Match)", confidence: 97, familyPin: "FAM-2471" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (demoMode) {
      performMatch();
    }
  }, [demoMode]);

  if (!demoMode) {
    return (
      <Card>
        <p className="text-sm text-muted">Family reunification scanner ready.</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold">Face Recognition Match</h3>
        <p className="text-sm text-muted">High-confidence matches found:</p>
      </div>
      
      {loading ? (
        <div className="flex h-32 items-center justify-center rounded-lg border border-border/50 bg-gradient-to-r from-muted/20 to-muted">
          <p className="text-sm text-muted">Scanning face...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <div key={match.userId || i} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <img
                  src={match.photo}
                  alt={match.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-safe/50"
                />
                <div>
                  <p className="font-semibold">{match.name}</p>
                  <p className="text-xs text-muted">PIN: {match.familyPin}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-safe">{match.confidence}%</p>
                <p className="text-xs text-muted">Match</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Button onClick={performMatch} className="w-full" variant="secondary">
        Re-scan Face
      </Button>
    </Card>
  );
}

