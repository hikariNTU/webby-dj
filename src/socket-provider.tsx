import { createContext, useContext, useEffect, useState } from "react";
import { Socket, io as ioCreate } from "socket.io-client";
import type { ClientSocket } from "./server";

const SocketContext = createContext<ClientSocket | undefined>(undefined);

export function SocketProvider(props: React.PropsWithChildren) {
  const [socket, setSocket] = useState<Socket | undefined>();

  useEffect(() => {
    if (!socket) {
      setSocket(ioCreate());
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const socket = useContext(SocketContext);
  return socket;
}
