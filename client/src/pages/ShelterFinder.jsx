import { useState } from "react";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import SoundNav from "../components/navigation/SoundNav";
import useSocket from "../hooks/useSocket";
import useAppStore from "../store/useAppStore";

const DEMO_SHELTERS = [
  {
    _id: "1",
    name: "KIIT University Relief Camp",
    address: "KIIT Road, Patia, Bhubaneswar",
    distance: "1.2 km",
    capacity: 500,
    occupied: 234,
    available: 266,
    facilities: ["Food", "Medical", "Water", "Beds"],
    contact: "+91 98765 43210",
    coordinates: [20.3500, 85.8139],
    status: "OPEN",
  },
  {
    _id: "2",
    name: "Capital Hospital Emergency Shelter",
    address: "Unit 6, Bhubaneswar",
    distance: "2.8 km",
    capacity: 300,
    occupied: 189,
    available: 111,
    facilities: ["Medical", "Water", "First Aid"],
    contact: "+91 98765 43211",
    coordinates: [20.2700, 85.8400],
    status: "OPEN",
  },
  {
    _id: "3",
    name: "Kalinga Stadium Relief Center",
    address: "Nayapalli, Bhubaneswar",
    distance: "4.1 km",
    capacity: 1000,
    occupied: 567,
    available: 433,
    facilities: ["Food", "Water", "Beds", "Medical", "Charging"],
    contact: "+91 98765 43212",
    coordinates: [20.2847, 85.8067],
    status: "OPEN",
  },
  {
    _id: "4",
    name: "Puri Beach Road Cyclone Shelter",
    address: "Marine Drive, Puri",
    distance: "6.5 km",
    capacity: 800,
    occupied: 712,
    available: 88,
    facilities: ["Food", "Water", "Beds"],
    contact: "+91 98765 43213",
    coordinates: [19.8135, 85.8312],
    status: "FILLING UP",
  },
  {
    _id: "5",
    name: "Cuttack Town Hall Emergency Camp",
    address: "College Square, Cuttack",
    distance: "9.2 km",
    capacity: 600,
    occupied: 123,
    available: 477,
    facilities: ["Food", "Water", "Medical", "Beds", "Charging"],
    contact: "+91 98765 43214",
    coordinates: [20.4625, 85.8830],
    status: "OPEN",
  },
];

function statusStyle(status) {
  if (status === "OPEN")       return "bg-green-900/40 text-green-400 border-green-700/40";
  if (status === "FILLING UP") return "bg-amber-900/40 text-amber-400 border-amber-700/40";
  return                              "bg-red-900/40   text-red-400   border-red-700/40";
}

export default function ShelterFinder() {
  const token  = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user   = useAppStore((s) => s.user) || { id: "demo-user" };
  const socket = useSocket(token);

  const [shelters]        = useState(DEMO_SHELTERS);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [navActive,       setNavActive]        = useState(false);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-5xl space-y-4 p-4"
    >
      <h2 className="font-heading text-2xl uppercase tracking-wide">Nearest Shelter Finder</h2>
      <p className="text-sm text-muted">5 emergency shelters active in Odisha disaster zone</p>

      {/* Sound navigation panel */}
      {navActive && selectedShelter && (
        <Card>
          <SoundNav
            targetLat={selectedShelter.coordinates[0]}
            targetLng={selectedShelter.coordinates[1]}
            targetName={selectedShelter.name}
            onArrived={() => setNavActive(false)}
            socket={socket}
            user={user}
          />
          <button
            onClick={() => setNavActive(false)}
            className="mt-4 w-full rounded-lg border border-border py-2 text-sm text-muted hover:text-text"
          >
            Stop Navigation
          </button>
        </Card>
      )}

      {/* Shelter cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {shelters.map((shelter) => {
          const pct = Math.round((shelter.occupied / shelter.capacity) * 100);
          return (
            <Card key={shelter._id}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-tight">{shelter.name}</p>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyle(shelter.status)}`}>
                  {shelter.status}
                </span>
              </div>

              <p className="mt-1 text-xs text-muted">{shelter.address}</p>

              {/* Distance + occupancy */}
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="rounded-full bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-400">
                  {shelter.distance}
                </span>
                <span className="text-muted">
                  <span className="font-mono text-text">{shelter.available}</span> / {shelter.capacity} spots free
                </span>
              </div>

              {/* Occupancy bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-all ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Facilities */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {shelter.facilities.map((f) => (
                  <span key={f} className="rounded-md border border-border bg-white/5 px-2 py-0.5 text-xs text-muted">
                    {f}
                  </span>
                ))}
              </div>

              {/* Contact + navigate */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-muted">{shelter.contact}</p>
                <button
                  onClick={() => { setSelectedShelter(shelter); setNavActive(true); }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
                >
                  Navigate There
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </motion.main>
  );
}
