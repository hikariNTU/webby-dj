import os from "node:os";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

type Ack<Payload = unknown> = (data: Payload) => void;

export type PlayerStatus = {
  name: string;
  playing: boolean;
  duration: number;
  time: number;
  progress: number;
  volume: number;
};

interface ShareEvent {
  play: (name: string) => void;
  playGroup: (name: string) => void;
  pause: () => void;
  stop: () => void;
  status: (status: PlayerStatus) => void;
  setVolume: (vol: PlayerStatus["volume"]) => void;
}

interface ServerToClient extends ShareEvent {
  resIp: (ip: string[]) => void;
}

interface ClientToServer extends ShareEvent {
  hello: (cb: Ack<string>) => void;
  askIp: () => void;
}

export type ClientSocket = Socket<ServerToClient, ClientToServer>;

const io = new Server<ClientToServer, ServerToClient>();

io.on("connection", (currentSocket) => {
  currentSocket.on("play", (name) => {
    io.sockets.emit("play", name);
  });

  currentSocket.on("playGroup", (name) => {
    io.sockets.emit("playGroup", name);
  });

  currentSocket.on("stop", () => {
    io.sockets.emit("stop");
  });

  currentSocket.on("setVolume", (vol) => {
    io.sockets.emit("setVolume", vol);
  });

  currentSocket.on("pause", () => io.sockets.emit("pause"));

  currentSocket.on("status", (status) => {
    io.sockets.emit("status", status);
  });

  currentSocket.on("askIp", () => {
    currentSocket.emit("resIp", getCurrentIp());
  });
});

io.listen(4000);

function getCurrentIp() {
  const nets = os.networkInterfaces();
  const results: string[] = [];

  for (const interfaces of Object.values(nets)) {
    if (!interfaces) {
      continue;
    }
    for (const net of interfaces) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
      if (net.family === familyV4Value && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}
