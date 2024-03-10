import { useEffect, useState } from "react";
import { SocketProvider, useSocket } from "./socket-provider";
import { PlayerStatus, TrackPlayer, playList } from "./player";
import { PauseIcon, PlayIcon, StopIcon } from "@radix-ui/react-icons";
import { PlaylistPlayIcon, RemoteIcon, ServerIcon } from "./icons";
import clsx from "clsx";

function formatSec(s: number) {
  const min = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function App() {
  return (
    <SocketProvider>
      <div className="h-full pb-[72px]">
        <TrackContainer />
        <StatusBar />
      </div>
      <Player />
    </SocketProvider>
  );
}

function TrackContainer() {
  const socket = useSocket();

  return (
    <div className="flex h-full w-full min-w-0 items-start gap-4 overflow-auto p-6">
      {playList.map((group) => {
        return (
          <div
            className="relative flex max-h-full w-[200px] shrink-0 flex-col rounded-xl bg-neutral-800 shadow-lg shadow-blue-300/10"
            key={group.name}
          >
            <div className="flex items-center border-b border-neutral-700">
              <h2 className="truncate px-3 py-3 text-lg font-semibold text-neutral-300">
                {group.name}
              </h2>
              <button
                className="ml-auto mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-blue-500"
                onClick={() => socket?.emit("play", group.files[0].name)}
              >
                <PlaylistPlayIcon fill="currentColor" />
              </button>
            </div>
            <ol className="overflow-auto p-2">
              {group.files.map((file, idx) => {
                return (
                  <li
                    className="group flex items-center gap-2 rounded px-3 py-1 hover:bg-neutral-700"
                    key={file.name}
                  >
                    <span>{String(idx + 1).padStart(2, "0")}. </span>
                    <span className="truncate">{file.name}</span>
                    <button
                      className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-white opacity-0 transition-opacity focus-within:opacity-100 hover:bg-blue-500 hover:opacity-100 group-hover:opacity-100"
                      onClick={() => socket?.emit("play", file.name)}
                    >
                      <PlayIcon />
                    </button>
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
    if (socket && new URLSearchParams(window.location.search).has("server")) {
      const instance = new TrackPlayer(socket);
      setPlayer(instance);
      return () => {
        instance.stop();
        instance.remove();
      };
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      player?.remove();
    };
  }, [player]);

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
        <ServerIcon fill="currentColor" />
      ) : (
        <RemoteIcon fill="currentColor" />
      )}
    </div>
  );
}

function StatusBar() {
  const socket = useSocket();
  const [status, setStatus] = useState<PlayerStatus>();

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.on("status", (status) => {
      setStatus(status);
    });
    return () => {
      socket.off("status");
    };
  }, [socket]);

  return (
    <div className="fixed bottom-0 flex h-[72px] w-full min-w-0 items-center gap-2 whitespace-nowrap bg-neutral-800 px-4 pt-0.5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-neutral-600">
        <div
          className="absolute inset-0 bg-blue-600 transition-transform duration-500 ease-linear"
          style={{
            transform: `translateX(-${(1 - (status?.progress || 0)) * 100}%)`,
          }}
        ></div>
      </div>

      <div className="flex items-center gap-2">
        {status?.playing ? (
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
              socket?.emit("play", status?.name || playList[0].files[0].name)
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
        {status?.name || "無歌曲"}
      </div>
      <div className="text-xs">
        {formatSec(status?.time || 0)}{" "}
        <span className="text-neutral-400">
          {" "}
          / {formatSec(status?.duration || 0)}
        </span>
      </div>
    </div>
  );
}

export default App;
