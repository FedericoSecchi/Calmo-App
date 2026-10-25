import { useReducedMotion } from "framer-motion";
import { renderScene, type GardenCounts, type GardenTheme, type Scene } from "@/lib/garden/engine";

interface GardenProps {
  theme: GardenTheme;
  counts: GardenCounts;
  seed: string;
  size?: number;
  weekly?: boolean;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
}

const CALMO_PALETTE = {
  bg: "#F3EBDD",
  bgDark: "#2E2A24",
  primary: "#5B8266",
  primarySoft: "#D5E2CF",
  secondary: "#D4B483",
  stone: "#9A8475",
  stoneDark: "#5A4F43",
  rake: "rgba(104, 92, 72, 0.35)",
  moss: "#78A75A",
  sand: "#F2E5CF",
  starDim: "#A6B6C8",
  starBright: "#F8E8B7",
  sky1: "#1E1B2E",
  sky2: "#3C3860",
  companionBase: "#5B8266",
  companionSoft: "#D5E2CF",
};

const Zen = ({ scene }: { scene: Scene }) => {
  const z = scene.zen!;
  const size = scene.size;
  return (
    <>
      <rect x={0} y={0} width={size} height={size} fill={CALMO_PALETTE.sand} rx={size * 0.08} />
      {z.rakeRings.map((ring, i) => (
        <circle
          key={`ring-${i}`}
          cx={ring.cx}
          cy={ring.cy}
          r={ring.r}
          fill="none"
          stroke={CALMO_PALETTE.rake}
          strokeWidth={size * 0.004}
        />
      ))}
      {z.furrows.map((f, i) => (
        <path
          key={`furrow-${i}`}
          d={f.path}
          fill="none"
          stroke={CALMO_PALETTE.rake}
          strokeWidth={size * 0.003}
          strokeLinecap="round"
        />
      ))}
      {z.mossDots.map((m, i) => (
        <circle key={`moss-${i}`} cx={m.cx} cy={m.cy} r={m.r} fill={CALMO_PALETTE.moss} opacity={0.75} />
      ))}
      {z.stones.map((s, i) => (
        <g key={`stone-${i}`} transform={`rotate(${s.rotation.toFixed(1)} ${s.cx} ${s.cy})`}>
          <ellipse
            cx={s.cx}
            cy={s.cy}
            rx={s.r}
            ry={s.r * 0.75}
            fill={CALMO_PALETTE.stone}
            stroke={CALMO_PALETTE.stoneDark}
            strokeWidth={size * 0.002}
          />
          <ellipse
            cx={s.cx - s.r * 0.2}
            cy={s.cy - s.r * 0.25}
            rx={s.r * 0.5}
            ry={s.r * 0.25}
            fill="#C7B3A1"
            opacity={0.5}
          />
        </g>
      ))}
    </>
  );
};

const Sky = ({ scene }: { scene: Scene }) => {
  const s = scene.sky!;
  const size = scene.size;
  const base = `rgba(30,27,46,${0.9 + s.tintStrength * 0.1})`;
  const topGlow = `rgba(72, 100, 140, ${0.25 + s.tintStrength * 0.25})`;
  return (
    <>
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={topGlow} />
          <stop offset="100%" stopColor={base} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={size} height={size} fill={CALMO_PALETTE.sky1} rx={size * 0.08} />
      <rect x={0} y={0} width={size} height={size} fill="url(#sky-grad)" rx={size * 0.08} />
      {s.stars.map((star, i) => (
        <circle
          key={`star-${i}`}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill={star.bright ? CALMO_PALETTE.starBright : CALMO_PALETTE.starDim}
          opacity={star.bright ? 1 : 0.75}
        />
      ))}
      {s.constellation &&
        s.constellation.points.slice(0, -1).map((p, i) => {
          const q = s.constellation!.points[i + 1];
          return (
            <line
              key={`cons-${i}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke={CALMO_PALETTE.starBright}
              strokeOpacity={0.6}
              strokeWidth={size * 0.0025}
            />
          );
        })}
    </>
  );
};

const Companion = ({ scene }: { scene: Scene }) => {
  const c = scene.companion!;
  const size = scene.size;
  // Grid origin and body sit roughly centered.
  const cx = size / 2;
  const cy = size * 0.6;
  const headR = size * 0.14;
  // relaxLevel 0..4 — higher means straighter back and lifted chin.
  const slouch = (4 - c.relaxLevel) * size * 0.015;
  const smileWidth = size * (0.04 + c.relaxLevel * 0.01);
  const smileCurve = size * (0.005 + c.relaxLevel * 0.004);
  // Stretch amount tilts the arm upward.
  const armAngle = -20 - c.stretchAmount * 50;
  const armRad = (armAngle * Math.PI) / 180;
  const armLen = size * (0.18 + c.stretchAmount * 0.06);
  const shoulderX = cx + size * 0.12;
  const shoulderY = cy + size * 0.04;
  const handX = shoulderX + Math.cos(armRad) * armLen;
  const handY = shoulderY + Math.sin(armRad) * armLen;

  const plantLevels = [
    null,
    { stem: 0.025, leaf: 0.04 },
    { stem: 0.045, leaf: 0.065 },
    { stem: 0.075, leaf: 0.095 },
    { stem: 0.11, leaf: 0.13 },
    { stem: 0.15, leaf: 0.17 },
  ];
  const plant = plantLevels[c.plantLevel];

  return (
    <>
      <rect x={0} y={0} width={size} height={size} fill={CALMO_PALETTE.bg} rx={size * 0.08} />
      {/* Desk */}
      <rect
        x={size * 0.1}
        y={cy + size * 0.17}
        width={size * 0.8}
        height={size * 0.04}
        fill={CALMO_PALETTE.stone}
        rx={size * 0.01}
      />
      <rect
        x={size * 0.14}
        y={cy + size * 0.21}
        width={size * 0.03}
        height={size * 0.14}
        fill={CALMO_PALETTE.stone}
      />
      <rect
        x={size * 0.83}
        y={cy + size * 0.21}
        width={size * 0.03}
        height={size * 0.14}
        fill={CALMO_PALETTE.stone}
      />
      {/* Laptop */}
      <rect
        x={cx - size * 0.15}
        y={cy + size * 0.09}
        width={size * 0.3}
        height={size * 0.08}
        fill={CALMO_PALETTE.stoneDark}
        rx={size * 0.01}
      />
      <rect
        x={cx - size * 0.14}
        y={cy + size * 0.1}
        width={size * 0.28}
        height={size * 0.06}
        fill={CALMO_PALETTE.primarySoft}
      />
      {/* Plant pot + plant */}
      {plant && (
        <g>
          <rect
            x={size * 0.72}
            y={cy + size * 0.095}
            width={size * 0.07}
            height={size * 0.08}
            fill={CALMO_PALETTE.secondary}
            rx={size * 0.005}
          />
          <path
            d={`M ${size * 0.755} ${cy + size * 0.095} Q ${size * (0.755 - plant.leaf * 0.5)} ${cy + size * (0.095 - plant.stem)} ${size * 0.755} ${cy + size * (0.095 - plant.leaf)}`}
            fill={CALMO_PALETTE.primary}
            stroke={CALMO_PALETTE.primary}
            strokeWidth={size * 0.004}
          />
          <ellipse
            cx={size * (0.755 - plant.leaf * 0.3)}
            cy={cy + size * (0.095 - plant.leaf * 0.4)}
            rx={size * plant.leaf * 0.4}
            ry={size * plant.leaf * 0.2}
            fill={CALMO_PALETTE.primary}
          />
        </g>
      )}
      {/* Body */}
      <path
        d={`M ${cx - size * 0.14} ${cy + size * 0.18 - slouch}
            L ${cx + size * 0.14} ${cy + size * 0.18 - slouch}
            L ${cx + size * 0.11} ${cy - size * 0.02 - slouch * 0.3}
            L ${cx - size * 0.11} ${cy - size * 0.02 - slouch * 0.3} Z`}
        fill={CALMO_PALETTE.companionBase}
      />
      {/* Arm — stretches up with exercise */}
      <line
        x1={shoulderX}
        y1={shoulderY}
        x2={handX}
        y2={handY}
        stroke={CALMO_PALETTE.companionBase}
        strokeWidth={size * 0.03}
        strokeLinecap="round"
      />
      {/* Head */}
      <circle
        cx={cx}
        cy={cy - size * 0.05 - slouch * 0.4}
        r={headR}
        fill={CALMO_PALETTE.companionSoft}
        stroke={CALMO_PALETTE.companionBase}
        strokeWidth={size * 0.004}
      />
      {/* Eyes */}
      <circle cx={cx - size * 0.045} cy={cy - size * 0.06 - slouch * 0.4} r={size * 0.012} fill={CALMO_PALETTE.stoneDark} />
      <circle cx={cx + size * 0.045} cy={cy - size * 0.06 - slouch * 0.4} r={size * 0.012} fill={CALMO_PALETTE.stoneDark} />
      {/* Mouth — smile grows with relaxLevel */}
      <path
        d={`M ${cx - smileWidth} ${cy - size * 0.02 - slouch * 0.4}
            Q ${cx} ${cy - size * 0.02 - slouch * 0.4 + smileCurve}
              ${cx + smileWidth} ${cy - size * 0.02 - slouch * 0.4}`}
        fill="none"
        stroke={CALMO_PALETTE.stoneDark}
        strokeWidth={size * 0.004}
        strokeLinecap="round"
      />
    </>
  );
};

export const Garden = ({
  theme,
  counts,
  seed,
  size = 300,
  weekly = false,
  className,
  svgRef,
}: GardenProps) => {
  const prefersReduced = useReducedMotion();
  const scene = renderScene({ theme, counts, seed, size, weekly });
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={scene.altText}
      className={className}
      style={prefersReduced ? undefined : undefined}
    >
      {theme === "zen" && <Zen scene={scene} />}
      {theme === "sky" && <Sky scene={scene} />}
      {theme === "companion" && <Companion scene={scene} />}
    </svg>
  );
};
