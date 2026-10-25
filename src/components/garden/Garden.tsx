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
  rake: "rgba(104, 92, 72, 0.5)",
  moss: "#78A75A",
  sand: "#F2E5CF",
  starDim: "#A6B6C8",
  starBright: "#F8E8B7",
  sky1: "#1E1B2E",
  sky2: "#3C3860",
  sunsetTop: "#F6B98B",
  sunsetMid: "#D77F70",
  sunsetLow: "#3F2E52",
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
  const sunset = s.sunsetness;
  const gradId = `sky-grad-${Math.round(sunset * 100)}`;
  // Interpolate between a deep-night gradient and a sunset gradient so the
  // empty-state scene reads as "atardecer con la primera estrella".
  const night = { top: "#2A3454", mid: "#1E1B2E", low: "#121028" };
  const dusk = { top: CALMO_PALETTE.sunsetTop, mid: CALMO_PALETTE.sunsetMid, low: CALMO_PALETTE.sunsetLow };
  const mix = (a: string, b: string, t: number): string => {
    const toRgb = (hex: string): number[] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    const ar = toRgb(a);
    const br = toRgb(b);
    const mixed = ar.map((c, i) => Math.round(c * (1 - t) + br[i] * t));
    return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
  };
  const top = mix(night.top, dusk.top, sunset);
  const mid = mix(night.mid, dusk.mid, sunset);
  const low = mix(night.low, dusk.low, sunset);
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="60%" stopColor={mid} />
          <stop offset="100%" stopColor={low} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={size} height={size} fill={`url(#${gradId})`} rx={size * 0.08} />
      {sunset > 0.6 && (
        // A soft sun just below the horizon to anchor the sunset scene.
        <circle
          cx={size * 0.3}
          cy={size * 0.72}
          r={size * 0.11}
          fill={CALMO_PALETTE.sunsetTop}
          opacity={0.55}
        />
      )}
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

  const weeklyScale = c.weeklyBoost ? 1.35 : 1;
  const plantLevels = [
    null,
    { stem: 0.03, leaf: 0.04 },
    { stem: 0.055, leaf: 0.065 },
    { stem: 0.085, leaf: 0.1 },
    { stem: 0.12, leaf: 0.14 },
    { stem: 0.17, leaf: 0.19 },
  ];
  const plant = plantLevels[c.plantLevel];
  // Pot sits on the LEFT side of the desk, away from the right-hand that
  // reaches up during exercises, so the arm and the plant never overlap.
  const potX = size * 0.14;
  const potY = cy + size * 0.095;
  const potW = size * 0.09 * weeklyScale;
  const potH = size * 0.08 * weeklyScale;
  const potStemX = potX + potW * 0.5;

  return (
    <>
      <rect x={0} y={0} width={size} height={size} fill={CALMO_PALETTE.bg} rx={size * 0.08} />
      {/* Desk */}
      <rect
        x={size * 0.08}
        y={cy + size * 0.17}
        width={size * 0.84}
        height={size * 0.04}
        fill={CALMO_PALETTE.stone}
        rx={size * 0.01}
      />
      <rect
        x={size * 0.12}
        y={cy + size * 0.21}
        width={size * 0.03}
        height={size * 0.14}
        fill={CALMO_PALETTE.stone}
      />
      <rect
        x={size * 0.85}
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
      {/* Plant pot + plant on the LEFT side of the desk */}
      {plant && (
        <g>
          <rect
            x={potX}
            y={potY}
            width={potW}
            height={potH}
            fill={CALMO_PALETTE.secondary}
            rx={size * 0.005}
          />
          <path
            d={`M ${potStemX} ${potY} Q ${potStemX - size * plant.leaf * 0.4} ${potY - size * plant.stem * weeklyScale} ${potStemX} ${potY - size * plant.leaf * weeklyScale}`}
            fill="none"
            stroke={CALMO_PALETTE.primary}
            strokeWidth={size * 0.005}
          />
          <ellipse
            cx={potStemX - size * plant.leaf * 0.3}
            cy={potY - size * plant.leaf * 0.4 * weeklyScale}
            rx={size * plant.leaf * 0.4 * weeklyScale}
            ry={size * plant.leaf * 0.22 * weeklyScale}
            fill={CALMO_PALETTE.primary}
          />
          <ellipse
            cx={potStemX + size * plant.leaf * 0.3}
            cy={potY - size * plant.leaf * 0.7 * weeklyScale}
            rx={size * plant.leaf * 0.35 * weeklyScale}
            ry={size * plant.leaf * 0.2 * weeklyScale}
            fill={CALMO_PALETTE.primary}
            opacity={0.9}
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
      {/* Arm — stretches up and to the right with exercise. The pot sits on
          the opposite side so they never overlap. */}
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
