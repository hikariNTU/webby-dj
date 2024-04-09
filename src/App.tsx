import { PauseIcon, PlayIcon, StopIcon } from "@radix-ui/react-icons";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Slider,
  SliderRange,
  SliderThumb,
  SliderTrack,
} from "@radix-ui/react-slider";
import clsx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import { startCase } from "lodash";
import { useEffect, useState } from "react";
import { QRCodeShowBtn } from "./QRCode";
import {
  PlaylistPlayIcon,
  RemoteIcon,
  SpeakerIcon,
  VolumeDown,
  VolumeUp,
} from "./icons";
import { TrackPlayer, playList } from "./player";
import { SocketProvider, useSocket } from "./socket-provider";
import {
  durationAtom,
  isPlayingAtom,
  nameAtom,
  progressAtom,
  timeAtom,
  volumeAtom,
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
      <QRCodeShowBtn />
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
                onClick={() => socket?.emit("playGroup", group.name)}
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
  const [connected, setConnected] = useState(false);

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
      socket.on("connect", () => {
        setConnected(socket.connected);
      });
      socket.on("disconnect", () => {
        setConnected(socket.connected);
      });
      window.document.title = "(Server) Webby DJ";

      return () => {
        socket.off("connect");
        socket.off("disconnect");
      };
    }
  }, [socket]);

  return (
    <div
      className={clsx(
        "fixed right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl text-xl",
        {
          "bg-green-500 text-green-900": !player,
          "bg-orange-500 text-orange-100": player,
          "!bg-neutral-400": !connected,
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
  const [, setVolume] = useAtom(volumeAtom);
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
      setVolume(status.volume);
    });
    return () => {
      socket.off("status");
    };
  }, [setDuration, setIsPlaying, setName, setTime, setVolume, socket]);

  return (
    <div className="fixed bottom-0 flex h-[72px] w-full min-w-0 items-center gap-2 whitespace-nowrap bg-neutral-800 px-4 pt-0.5">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-neutral-600">
        <div
          className="absolute inset-0 bg-blue-600"
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

      <VolumeControl />
      <div className="ml-auto flex min-w-0 flex-shrink items-center max-sm:flex-col max-sm:items-end sm:gap-2">
        <div className="max-w-full truncate text-lg font-semibold">
          {name || "無歌曲min-w-0 truncate text-lg font-semibold"}
        </div>
        <div className="text-xs">
          {formatSec(time)}{" "}
          <span className="text-neutral-400">/ {formatSec(duration)}</span>
        </div>
      </div>
    </div>
  );
}

function VolumeControl() {
  const socket = useSocket();
  const volume = useAtomValue(volumeAtom);
  function setVolume(vol: number) {
    socket?.emit("setVolume", vol);
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex shrink-0 items-center justify-center gap-1 rounded-full bg-neutral-800 p-2 text-neutral-50 hover:bg-neutral-900 disabled:bg-neutral-800/30 disabled:opacity-50">
          {volume > 0.5 ? (
            <VolumeUp fill="currentColor" className="text-[24px]" />
          ) : (
            <VolumeDown fill="currentColor" className="text-[24px]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          sideOffset={5}
          align="center"
          className="z-20 flex h-[220px] flex-col items-center gap-2 rounded-full bg-neutral-900 p-6 pb-2 text-neutral-200"
        >
          <Slider
            orientation="vertical"
            className="relative flex h-full w-4 cursor-pointer touch-none select-none flex-col items-center"
            value={[volume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={(v) => {
              setVolume(v[0]);
            }}
            onValueCommit={(v) => {
              setVolume(v[0]);
            }}
          >
            <SliderTrack className="relative w-1 grow rounded bg-neutral-600">
              <SliderRange className="absolute w-full rounded bg-blue-600" />
            </SliderTrack>
            <SliderThumb
              className="block h-3 w-3 cursor-grab rounded-full border border-blue-600 bg-white hover:ring-2 focus:outline-none focus:ring-2 active:cursor-grabbing"
              aria-label="Volume level"
            />
          </Slider>
          <span className="w-[20px] text-center text-xs text-neutral-500">
            {Math.round(volume * 100)}
          </span>
          <PopoverArrow />
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

export default App;
