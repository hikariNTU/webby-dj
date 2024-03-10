import { Server } from "socket.io";
import { Socket } from "socket.io-client";

type Ack<Payload = unknown> = (data: Payload) => void;

interface ShareEvent {
  play: (name: string) => void;
  pause: () => void;
  stop: () => void;
  status: (status: PlayerStatus) => void;
}

interface ServerToClient extends ShareEvent {}

interface ClientToServer extends ShareEvent {
  hello: (cb: Ack<string>) => void;
}

type PlayerStatus = {
  name: string;
  playing: boolean;
  duration: number;
  time: number;
  progress: number;
};

export type ClientSocket = Socket<ServerToClient, ClientToServer>;

const io = new Server<ClientToServer, ServerToClient>();

let statusHolder: undefined | PlayerStatus;

io.on("connection", (socket) => {
  if (statusHolder) {
    socket.emit("status", statusHolder);
  }

  socket.on("play", (name) => {
    io.sockets.emit("play", name);
  });

  socket.on("stop", () => {
    io.sockets.emit("stop");
  });

  socket.on("pause", () => io.sockets.emit("pause"));

  socket.on("status", (status) => {
    statusHolder = status;
    io.sockets.volatile.emit("status", status);
  });
});

io.listen(4000);
