import { ClientSocket } from "./server";

type PlayingGroup = {
  name: string;
  files: { url: string; name: string; description?: string }[];
};

type AllList = PlayingGroup[];

export type PlayerStatus = {
  name: string;
  playing: boolean;
  duration: number;
  time: number;
  progress: number;
};

const files = import.meta.glob("./tracks/*/*.*", {
  query: "url",
  import: "default",
  eager: true,
});

export const playList: AllList = [];

for (const [path, url] of Object.entries(files)) {
  const [group, name] = path.replace("./tracks/", "").split("/");
  const names = name.split(".");
  names.pop();

  const theGroup = group.replace(/_/g, " ");

  const data = {
    name: names.join("."),
    url: url as string,
  };

  const targetGroup = playList.find((g) => g.name === theGroup);
  if (targetGroup) {
    targetGroup.files.push(data);
  } else {
    playList.push({
      name: theGroup,
      files: [data],
    });
  }
}

export class TrackPlayer {
  audio: HTMLAudioElement;
  status: {
    name: string;
    playing: boolean;
    duration: number;
    time: number;
    progress: number;
  };
  socket: ClientSocket;
  constructor(socket: ClientSocket) {
    this.socket = socket;
    this.status = {
      duration: 0,
      name: "",
      playing: false,
      progress: 0,
      time: 0,
    };
    const audio = document.createElement("audio");
    audio.addEventListener("durationchange", () => {
      this.setStatus({
        duration: audio.duration,
      });
    });
    audio.addEventListener("play", () => {
      this.setStatus({
        playing: true,
      });
    });
    audio.addEventListener("pause", () => {
      this.setStatus({
        playing: false,
      });
    });
    audio.addEventListener("timeupdate", () => {
      this.setStatus({
        time: audio.currentTime,
        progress: audio.currentTime / (audio.duration || 1),
      });
    });
    audio.addEventListener("ended", () => {
      this.nextTrack();
    });
    this.audio = audio;
    socket.on("play", (name) => this.setTrack(name));
    socket.on("pause", () => this.audio.pause());
    socket.on("stop", () => this.stop());
  }

  setStatus(payload: Partial<PlayerStatus>) {
    Object.assign(this.status, payload);
    this.socket.volatile.emit("status", this.status);
  }

  setTrack(name: string) {
    const isResume = !this.status.playing && this.status.name === name;
    if (isResume) {
      this.audio.play();
      return;
    }

    const file = TrackPlayer.getFile(name);
    this.audio.pause();

    this.setStatus({
      name,
      playing: false,
      time: 0,
      duration: 0,
    });
    this.audio.src = file?.url || "";
    if (file) {
      this.audio.play();
    }
  }

  nextTrack() {
    this.setTrack(TrackPlayer.getNextTrack(this.status.name) || "");
  }

  stop() {
    this.setTrack("");
  }

  remove() {
    console.log("Removed");
    this.audio.remove();
  }

  static getFile(name: string) {
    if (!name) {
      return;
    }
    for (const group of playList) {
      for (const file of group.files) {
        if (file.name === name) {
          return file;
        }
      }
    }
  }

  static getNextTrack(name: string) {
    if (!name) {
      return;
    }
    for (const group of playList) {
      const idx = group.files.findIndex((f) => {
        return f.name === name;
      });
      if (idx >= 0) {
        return group.files.at((idx + 1) % group.files.length)?.name;
      }
    }
  }
}
