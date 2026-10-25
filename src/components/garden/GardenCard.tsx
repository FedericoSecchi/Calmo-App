import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Trees, Sparkles, Users as UsersIcon } from "lucide-react";
import { Garden } from "./Garden";
import { useT, format } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { hasAnyActivity, type GardenCounts, type GardenTheme } from "@/lib/garden/engine";

interface GardenCardProps {
  theme: GardenTheme;
  counts: GardenCounts;
  seed: string;
  heading?: string;
  subheading?: string;
  weekly?: boolean;
  trackSource?: string;
  showActions?: boolean;
  size?: number;
}

async function svgToPng(svgEl: SVGSVGElement, outSize = 1080): Promise<Blob> {
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg load failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas 2d context");
    ctx.fillStyle = "#F3EBDD";
    ctx.fillRect(0, 0, outSize, outSize);
    const margin = Math.round(outSize * 0.08);
    const inner = outSize - margin * 2 - Math.round(outSize * 0.08);
    ctx.drawImage(img, margin, margin, inner, inner);
    ctx.fillStyle = "#2E2A24";
    ctx.font = `600 ${Math.round(outSize * 0.045)}px "Hammersmith One", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("Calmo", margin, outSize - margin * 0.5);
    ctx.textAlign = "right";
    ctx.font = `400 ${Math.round(outSize * 0.03)}px sans-serif`;
    ctx.fillText("calmo.fit", outSize - margin, outSize - margin * 0.5);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const GardenCard = ({
  theme,
  counts,
  seed,
  heading,
  subheading,
  weekly = false,
  trackSource = "personal",
  showActions = true,
  size = 320,
}: GardenCardProps) => {
  const { t } = useT();
  const g = t.app.garden;
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const trackedViewRef = useRef(false);
  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;
    track("garden_viewed", { theme, source: trackSource });
  }, [theme, trackSource]);

  const summaryText = format(g.summary, {
    breaks: counts.break,
    exercises: counts.exercise,
    water: counts.water,
  });

  const isEmpty = !hasAnyActivity(counts);
  const themeName = g.themeNames[theme];
  const altText = isEmpty
    ? format(g.altText.empty, { theme: themeName })
    : (() => {
        const parts: string[] = [];
        if (counts.break > 0) parts.push(format(g.altText.parts.break, { n: counts.break }));
        if (counts.exercise > 0) parts.push(format(g.altText.parts.exercise, { n: counts.exercise }));
        if (counts.water > 0) parts.push(format(g.altText.parts.water, { n: counts.water }));
        if (counts.focus > 0) parts.push(format(g.altText.parts.focus, { n: counts.focus }));
        return format(g.altText.nonEmpty, { theme: themeName, summary: parts.join(", ") });
      })();
  const emptyGuide = isEmpty ? g.emptyGuide[theme] : null;

  const handleShare = async () => {
    if (!svgRef.current) return;
    try {
      const blob = await svgToPng(svgRef.current, 1080);
      const file = new File([blob], "calmo-garden.png", { type: "image/png" });
      const text = format(g.shareText, { counts: summaryText });
      const canShareFiles =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof (navigator as Navigator & { canShare?: (data: ShareData) => boolean }).canShare === "function" &&
        (navigator as Navigator & { canShare: (data: ShareData) => boolean }).canShare({
          files: [file],
          text,
        });
      if (canShareFiles) {
        await (navigator as Navigator & {
          share: (data: ShareData & { files?: File[] }) => Promise<void>;
        }).share({ files: [file], title: "Calmo", text });
        track("garden_shared", { theme, source: trackSource, via: "web_share" });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "calmo-garden.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      track("garden_shared", { theme, source: trackSource, via: "download" });
    } catch {
      toast({ title: g.exportError, variant: "destructive" });
    }
  };

  const ThemeIcon = theme === "zen" ? Trees : theme === "sky" ? Sparkles : UsersIcon;

  return (
    <div className="rounded-2xl border border-border/30 bg-card p-4">
      {(heading || subheading) && (
        <div className="flex items-start justify-between mb-3 gap-3">
          <div>
            {heading && (
              <div className="flex items-center gap-2">
                <ThemeIcon className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">{heading}</p>
              </div>
            )}
            {subheading && (
              <p className="text-xs text-muted-foreground mt-0.5">{subheading}</p>
            )}
          </div>
          {showActions && (
            <Button variant="ghost" size="sm" onClick={handleShare} aria-label={g.share}>
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      <div className="aspect-square w-full overflow-hidden rounded-xl" style={{ maxWidth: size }}>
        <Garden theme={theme} counts={counts} seed={seed} weekly={weekly} svgRef={svgRef} />
      </div>
      <p className="sr-only">{altText}</p>
      {emptyGuide && (
        <p className="mt-3 text-xs text-muted-foreground italic">{emptyGuide}</p>
      )}
      <p className="mt-3 text-xs text-muted-foreground break-words">{summaryText}</p>
      {showActions && (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Download className="h-4 w-4 mr-2" />
            {g.download}
          </Button>
        </div>
      )}
    </div>
  );
};
