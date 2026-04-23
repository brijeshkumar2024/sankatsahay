import { useEffect, useMemo, useState } from "react";

function randomDistance() {
  return 35 + Math.floor(Math.random() * 25);
}

export default function useBluetooth(socket, userId) {
  const [devices, setDevices] = useState([]);
  const [simulation, setSimulation] = useState(false);
  const supported = useMemo(() => !!navigator.bluetooth, []);

  const emitPing = async (count) => {
    if (!socket?.connected) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socket.emit("bluetooth:ping", {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          userId,
          deviceCount: count,
          timestamp: new Date().toISOString(),
          simulation
        });
      },
      () => {
        socket.emit("bluetooth:ping", {
          lat: 20.2961,
          lng: 85.8245,
          userId,
          deviceCount: count,
          timestamp: new Date().toISOString(),
          simulation
        });
      }
    );
  };

  const scan = async () => {
    if (!supported) {
      setSimulation(true);
      const simulated = [
        { id: `sim-${Date.now()}-a`, name: "Unknown Device", distanceMeters: randomDistance() },
        { id: `sim-${Date.now()}-b`, name: "BLE Tag", distanceMeters: randomDistance() }
      ];
      setDevices(simulated);
      emitPing(simulated.length);
      return simulated;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service"]
      });
      const found = [{ id: device.id, name: device.name || "BLE Device", distanceMeters: randomDistance() }];
      setDevices(found);
      emitPing(found.length);
      return found;
    } catch {
      setSimulation(true);
      const simulated = [
        { id: `sim-${Date.now()}-a`, name: "Sim Device 1", distanceMeters: randomDistance() },
        { id: `sim-${Date.now()}-b`, name: "Sim Device 2", distanceMeters: randomDistance() },
        { id: `sim-${Date.now()}-c`, name: "Sim Device 3", distanceMeters: randomDistance() }
      ];
      setDevices(simulated);
      emitPing(simulated.length);
      return simulated;
    }
  };

  useEffect(() => {
    scan();
    const timer = setInterval(scan, 30000);
    return () => clearInterval(timer);
  }, []);

  return { devices, supported, simulation, scan };
}
