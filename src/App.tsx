import { useEffect, useState } from "react";
import { SocketProvider, useSocket } from "./socket-provider";
import { TrackPlayer, playList } from "./player";
import { PauseIcon, PlayIcon, StopIcon } from "@radix-ui/react-icons";
import { PlaylistPlayIcon, RemoteIcon, SpeakerIcon } from "./icons";
import clsx from "clsx";
import { startCase } from "lodash";
import { useAtom, useAtomValue } from "jotai";
import {
  durationAtom,
  isPlayingAtom,
  nameAtom,
  progressAtom,
  timeAtom,
} from "./state";

function formatSec(s: number) {
  const min = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function App() {
  return (
    <SocketProvider>
      <div className="flex h-full flex-col items-start pb-[72px]">
        <TrackContainer />
      </div>
      <StatusBar />
      <Player />
      <IPAddress />
    </SocketProvider>
  );
}

function TrackContainer() {
  const socket = useSocket();
  const playingName = useAtomValue(nameAtom);
  const isPlaying = useAtomValue(isPlayingAtom);

  return (
    <div className="flex h-full w-full min-w-0 items-start gap-8 overflow-auto p-8">
      {playList.map((group) => {
        const hasSelectedName = !!group.files.find(
          (f) => f.name === playingName,
        );
        return (
          <div
            className={clsx(
              "relative flex max-h-full w-[220px] shrink-0 flex-col overflow-hidden rounded-xl bg-neutral-800 outline outline-1 outline-neutral-700",
            )}
            key={group.name}
          >
            <div className="flex items-center border-b border-neutral-700">
              <div className="flex min-w-0 flex-col px-3 py-3">
                <h2
                  className={clsx("truncate text-lg", {
                    "font-bold text-blue-400": hasSelectedName,
                    "text-neutral-300": !hasSelectedName,
                  })}
                >
                  {startCase(group.name)}
                </h2>
                <span className="text-xs text-neutral-500">
                  {group.files.length} tracks
                </span>
              </div>
              <button
                className="ml-auto mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-blue-500"
                onClick={() => socket?.emit("play", group.files[0].name)}
              >
                <PlaylistPlayIcon fill="currentColor" />
              </button>
            </div>
            <ol className="overflow-auto pb-3">
              {group.files.map((file, idx) => {
                const isSelected = file.name === playingName;
                const beenPlayed = isPlaying && isSelected;
                return (
                  <li
                    className={clsx(
                      "group flex items-center gap-2 px-3 py-2 hover:bg-neutral-700",
                    )}
                    key={file.name}
                  >
                    <div
                      className={clsx("min-w-0", {
                        "text-neutral-200": !beenPlayed,
                        "text-blue-400": beenPlayed,
                        "font-bold": isSelected,
                      })}
                    >
                      <div className={clsx("flex items-center text-xs")}>
                        <div>{String(idx + 1).padStart(2, "0")}.</div>
                      </div>
                      <div className="truncate">{file.name}</div>
                    </div>
                    {!beenPlayed && (
                      <button
                        className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-600 text-white hover:bg-neutral-900"
                        onClick={() => socket?.emit("play", file.name)}
                      >
                        <PlayIcon />
                      </button>
                    )}
                    {beenPlayed && (
                      <SpeakerIcon
                        fill="currentColor"
                        className="ml-auto mr-1.5 shrink-0 text-blue-400"
                        width={24}
                        height={24}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

function Player() {
  const socket = useSocket();
  const [player, setPlayer] = useState<TrackPlayer>();

  useEffect(() => {
    if (player) {
      return () => {
        player.remove();
      };
    }
  }, [player]);

  useEffect(() => {
    if (socket && new URLSearchParams(window.location.search).has("server")) {
      const p = new TrackPlayer(socket);
      setPlayer(p);
      window.document.title = "(Server) Webby DJ";
    }
  }, [socket]);

  return (
    <div
      className={clsx(
        "fixed right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl text-xl",
        {
          "bg-green-500 text-green-900": !player,
          "bg-orange-500 text-orange-100": player,
        },
      )}
    >
      {player ? (
        <SpeakerIcon fill="currentColor" />
      ) : (
        <RemoteIcon fill="currentColor" />
      )}
    </div>
  );
}

function StatusBar() {
  const socket = useSocket();
  const [duration, setDuration] = useAtom(durationAtom);
  const [time, setTime] = useAtom(timeAtom);
  const [name, setName] = useAtom(nameAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const progress = useAtomValue(progressAtom);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on("status", (status) => {
      setDuration(status.duration);
      setTime(status.time);
      setName(status.name);
      setIsPlaying(status.playing);
    });
    return () => {
      socket.off("status");
    };
  }, [setDuration, setIsPlaying, setName, setTime, socket]);

  return (
    <div className="fixed bottom-0 flex h-[72px] w-full min-w-0 items-center gap-2 whitespace-nowrap bg-neutral-800 px-4 pt-0.5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-neutral-600">
        <div
          className="absolute inset-0 bg-blue-600 transition-transform duration-500 ease-linear"
          style={{
            transform: `translateX(-${(1 - (progress || 0)) * 100}%)`,
          }}
        ></div>
      </div>

      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            className="rounded-full bg-neutral-700 p-4 hover:bg-neutral-900"
            onClick={() => socket?.emit("pause")}
          >
            <PauseIcon width={20} height={20} />
          </button>
        ) : (
          <button
            className="rounded-full bg-neutral-700 p-4 hover:bg-neutral-900"
            onClick={() =>
              socket?.emit("play", name || playList[0].files[0].name)
            }
          >
            <PlayIcon width={20} height={20} />
          </button>
        )}
        <button
          className="rounded-full bg-neutral-700 p-4 hover:bg-neutral-900"
          onClick={() => socket?.emit("stop")}
        >
          <StopIcon width={20} height={20} />
        </button>
      </div>

      <div className="ml-auto truncate text-lg font-semibold">
        {name || "無歌曲"}
      </div>
      <div className="text-xs">
        {formatSec(time)}{" "}
        <span className="text-neutral-400"> / {formatSec(duration)}</span>
      </div>
    </div>
  );
}

function IPAddress() {
  const [ips, setIps] = useState<string[]>([]);
  const socket = useSocket();
  useEffect(() => {
    socket?.on("resIp", (data) => setIps(data));
    socket?.emit("askIp");

    return () => {
      socket?.off("resIp");
    };
  }, [socket]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-neutral-900/80 backdrop-blur">
      <pre>{ips.join("\n")}</pre>
    </div>
  );
}

export default App;
