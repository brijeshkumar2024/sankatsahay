import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const nextSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: token ? { token } : undefined,
      transports: ["websocket"]
    });

    setSocket(nextSocket);
    return () => {
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return socket;
}
