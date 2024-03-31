import { useEffect, useRef, useState } from "react";
import { useSocket } from "./socket-provider";

function QRCode(props: { text: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function generate() {
      const toCanvas = (await import("qrcode")).toCanvas;
      toCanvas(ref.current, props.text);
    }
    generate();
  }, [props.text]);

  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl bg-white p-4 text-black"
      onClick={(e) => e.stopPropagation()}
    >
      <canvas
        width={256}
        height={256}
        className="h-[256px] w-[256px]"
        ref={ref}
      />
      <code className="text-xs">{props.text}</code>
    </div>
  );
}

export function QRCodeShowBtn() {
  const [open, setOpen] = useState(false);
  const [ips, setIps] = useState<string[]>([]);
  const socket = useSocket();
  useEffect(() => {
    socket?.on("resIp", (data) => setIps(data));
    return () => {
      socket?.off("resIp");
    };
  }, [socket]);

  return (
    <>
      <button
        className="fixed right-2 top-12 z-50 rounded-xl bg-neutral-200/20 p-2"
        onClick={() => {
          setOpen((o) => {
            if (!o) {
              socket?.emit("askIp");
              return true;
            } else {
              return false;
            }
          });
        }}
      >
        <QRCodeIcon fill="currentColor" />
      </button>
      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-neutral-900/80 backdrop-blur"
          onClick={() => {
            setOpen(false);
          }}
        >
          {ips.map((ip) => (
            <QRCode text={`http://${ip}:8888`} key={ip} />
          ))}
        </div>
      )}
    </>
  );
}

const QRCodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="1em"
    viewBox="0 -960 960 960"
    width="1em"
    {...props}
  >
    <path d="M120-520v-320h320v320H120Zm80-80h160v-160H200v160Zm-80 480v-320h320v320H120Zm80-80h160v-160H200v160Zm320-320v-320h320v320H520Zm80-80h160v-160H600v160Zm160 480v-80h80v80h-80ZM520-360v-80h80v80h-80Zm80 80v-80h80v80h-80Zm-80 80v-80h80v80h-80Zm80 80v-80h80v80h-80Zm80-80v-80h80v80h-80Zm0-160v-80h80v80h-80Zm80 80v-80h80v80h-80Z" />
  </svg>
);
