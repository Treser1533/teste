import { cn } from "@/lib/utils";

const palettes: Record<
  string,
  { halo: string; body: string; cap: string; word: string }
> = {
  lime: {
    halo: "bg-lime-300/20",
    body: "from-[#242a1e] via-[#161914] to-[#0d0f0d]",
    cap: "bg-lime-300",
    word: "text-lime-200",
  },
  orange: {
    halo: "bg-orange-400/20",
    body: "from-[#33251e] via-[#1d1713] to-[#100e0d]",
    cap: "bg-orange-300",
    word: "text-orange-200",
  },
  violet: {
    halo: "bg-violet-400/20",
    body: "from-[#292237] via-[#191622] to-[#100f13]",
    cap: "bg-violet-300",
    word: "text-violet-200",
  },
  cyan: {
    halo: "bg-cyan-300/20",
    body: "from-[#1d3031] via-[#121c1e] to-[#0c1011]",
    cap: "bg-cyan-300",
    word: "text-cyan-200",
  },
};

export function PodArtwork({
  accent,
  name,
  brand,
  compact = false,
}: {
  accent: string;
  name: string;
  brand?: string;
  compact?: boolean;
}) {
  const palette = palettes[accent] ?? palettes.lime;
  const capacity = name.match(/\b\d+\s*K\b/i)?.[0] ?? "POD";
  return (
    <div
      className={cn(
        "relative grid w-full place-items-center overflow-hidden",
        compact ? "h-32" : "h-52",
      )}
    >
      <div
        className={cn(
          "absolute size-36 rounded-full opacity-60 blur-3xl",
          palette.halo,
        )}
      />
      <div
        className={cn(
          "pod-shadow relative flex -rotate-[8deg] flex-col items-center justify-center rounded-[22px] border border-white/10 bg-gradient-to-br",
          palette.body,
          compact ? "h-[98px] w-[50px]" : "h-[154px] w-[76px]",
        )}
      >
        <div
          className={cn(
            "absolute -top-3 h-5 w-[70%] rounded-t-xl border border-white/15",
            palette.cap,
          )}
        />
        <span
          className={cn(
            "mt-1 max-w-[90%] truncate text-[7px] font-bold tracking-[.16em]",
            palette.word,
          )}
        >
          {brand?.toUpperCase() ?? "POD"}
        </span>
        <div className="my-2 h-px w-7 bg-white/15" />
        <span className="max-w-[90%] whitespace-pre-line text-center text-[7px] font-medium leading-3 text-white/65">
          {name.replace(" ", "\n")}
        </span>
        <span
          className={cn(
            "absolute bottom-2 rounded-full border border-white/10 px-1.5 py-0.5 text-[6px] tracking-wider",
            palette.word,
          )}
        >
          {capacity}
        </span>
        <span className="absolute right-1.5 top-8 h-14 w-1 rounded-full bg-white/[.035]" />
      </div>
      {!compact && (
        <div className="absolute bottom-2 left-5 text-[9px] tracking-[.23em] text-white/25">
          SÉRIE ESSENCIAL · 01
        </div>
      )}
    </div>
  );
}
