import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket(token) {
  const [socket, setSocket] = useState(null);
  // Track the token we last connected with so StrictMode double-invoke
  // doesn't create two sockets for the same token.
  const connectedTokenRef = useRef(undefined);

  useEffect(() => {
    // connectedTokenRef uses a sentinel so null token still connects once
    const tokenKey = token ?? "__anonymous__";
    if (connectedTokenRef.current === tokenKey) return;
    connectedTokenRef.current = tokenKey;

    const nextSocket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      {
        auth: token ? { token } : undefined,
        // Start with polling so the handshake completes before upgrading.
        // This prevents the "WebSocket closed before connection established" error.
        transports: ["polling", "websocket"],
        upgrade: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    setSocket(nextSocket);
    return () => {
      connectedTokenRef.current = undefined;
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return socket;
}
