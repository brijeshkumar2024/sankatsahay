import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import SoundNav from "../components/navigation/SoundNav";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ShelterFinder() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [navActive, setNavActive] = useState(false);

  const fetchNearbyShelters = async () => {
    setLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `${API_BASE}/resources/shelters/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          const data = await res.json();
          setShelters(Array.isArray(data.shelters) ? data.shelters : []);
        } catch {
          setError("Failed to load nearby shelters.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchNearbyShelters();
  }, []);

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl p-4">
      <h2 className="font-heading text-3xl">Nearest Shelter Finder</h2>

      {navActive && selectedShelter ? (
        <Card className="mt-4">
          <SoundNav
            targetLat={selectedShelter.location.coordinates[1]}
            targetLng={selectedShelter.location.coordinates[0]}
            targetName={selectedShelter.name}
            onArrived={() => setNavActive(false)}
          />
        </Card>
      ) : null}

      <Card className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-muted">Nearby shelters from live geosearch</p>
          <button className="rounded-lg border border-border px-3 py-1 text-sm" onClick={fetchNearbyShelters}>Refresh</button>
        </div>

        {loading ? <p className="text-muted">Loading nearby shelters...</p> : null}
        {error ? <p className="text-alert">{error}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          {shelters.map((shelter) => (
            <div key={shelter._id} className="rounded-xl border border-border bg-white/5 p-3">
              <p className="font-semibold">{shelter.name}</p>
              <p className="text-sm text-muted">Capacity: {shelter.currentOccupancy}/{shelter.capacity}</p>
              <button
                onClick={() => {
                  setSelectedShelter(shelter);
                  setNavActive(true);
                }}
                className="mt-3 rounded-lg bg-live px-3 py-2 text-sm font-semibold text-black"
              >
                Navigate with Sound + Vibration
              </button>
            </div>
          ))}
        </div>
      </Card>
    </motion.main>
  );
}
