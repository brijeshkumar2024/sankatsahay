import { useCallback, useMemo } from "react";

export default function useVibration() {
  const pulse = useCallback((pattern = [100]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return useMemo(() => ({
    safePulse: () => pulse([80]),
    obstaclePulse: () => pulse([400]),
    calmPulse: () => pulse([500, 500, 500, 500])
  }), [pulse]);
}
