// src/bench/svg.ts
//
// A minimal SVG line-chart emitter.
//
// It produces both the pre-rendered figures committed under docs/figures/ and
// the live charts on the Docs page. Sharing one renderer is the point: a figure
// in the paper and its interactive counterpart in the browser are drawn by the
// same code from the same experiment functions, so they cannot disagree about
// what the data looks like.
//
// No charting library is used. The figures are small, the requirements are
// fixed, and a dependency-free emitter keeps the generated SVG readable and
// diffable in review, which matters because these files are the printed
// evidence for the claims in docs/06-evaluation.md.
//
// The palette is deliberately light-background with dark ink. GitHub renders
// Markdown images through a proxy that does not apply the viewer's colour
// scheme to SVG internals, so a figure that adapted to dark mode would be
// unreadable for half the readers. A fixed light figure is legible in both.

export interface Series {
  label: string;
  color: string;
  points: { x: number; y: number }[];
  /** Draw a dashed line rather than a solid one. */
  dashed?: boolean;
  /** Plot markers at each data point. */
  markers?: boolean;
}

export interface ChartOptions {
  title: string;
  subtitle?: string;
  xLabel: string;
  yLabel: string;
  series: Series[];
  width?: number;
  height?: number;
  xLog?: boolean;
  yLog?: boolean;
  /** Explicit axis bounds. Computed from the data when omitted. */
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  /** Vertical rule with a label, used to mark a critical point. */
  vRule?: { x: number; label: string; color?: string };
  caption?: string;
}

const INK = "#111827";
const MUTED = "#6b7280";
const GRID = "#e5e7eb";
const BG = "#ffffff";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1e6) return `${(n / 1e6).toPrecision(3)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toPrecision(3)}k`;
  if (abs >= 10) return n.toFixed(0);
  if (abs >= 1) return n.toFixed(1);
  if (abs >= 0.01) return n.toFixed(3);
  return n.toExponential(1);
}

/** Rounds coordinates so regenerated figures diff cleanly. */
function r(n: number): number {
  return Math.round(n * 100) / 100;
}

function logTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const lo = Math.floor(Math.log10(min));
  const hi = Math.ceil(Math.log10(max));
  for (let e = lo; e <= hi; e++) {
    const v = Math.pow(10, e);
    if (v >= min * 0.999 && v <= max * 1.001) ticks.push(v);
  }
  return ticks.length >= 2 ? ticks : [min, max];
}

function linearTicks(min: number, max: number, count = 6): number[] {
  if (max === min) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max * 1.0001; v += step) {
    ticks.push(parseFloat(v.toPrecision(12)));
  }
  return ticks;
}

export function lineChart(opts: ChartOptions): string {
  const W = opts.width ?? 760;
  const H = opts.height ?? 420;
  const padL = 78;
  const padR = 24;
  const padT = opts.subtitle ? 68 : 52;
  const padB = opts.caption ? 92 : 68;

  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const all = opts.series.flatMap(s => s.points);
  if (all.length === 0) throw new Error(`lineChart "${opts.title}" received no data points`);

  const positive = (vals: number[]) => vals.filter(v => v > 0);

  const xMin = opts.xMin ?? Math.min(...all.map(p => p.x));
  let xMax = opts.xMax ?? Math.max(...all.map(p => p.x));
  let yMin = opts.yMin ?? (opts.yLog ? Math.min(...positive(all.map(p => p.y))) : Math.min(0, ...all.map(p => p.y)));
  let yMax = opts.yMax ?? Math.max(...all.map(p => p.y));

  if (opts.yLog) {
    yMin = Math.pow(10, Math.floor(Math.log10(Math.max(yMin, Number.MIN_VALUE))));
    yMax = Math.pow(10, Math.ceil(Math.log10(yMax)));
  } else if (yMax === yMin) {
    yMax = yMin + 1;
  }
  if (xMax === xMin) xMax = xMin + 1;

  const sx = (x: number): number => {
    if (opts.xLog) {
      const t = (Math.log10(x) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin));
      return padL + t * plotW;
    }
    return padL + ((x - xMin) / (xMax - xMin)) * plotW;
  };

  const sy = (y: number): number => {
    if (opts.yLog) {
      const v = Math.max(y, yMin);
      const t = (Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin));
      return padT + plotH - t * plotH;
    }
    return padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
  };

  const xTicks = opts.xLog ? logTicks(xMin, xMax) : linearTicks(xMin, xMax);
  const yTicks = opts.yLog ? logTicks(yMin, yMax) : linearTicks(yMin, yMax);

  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title)}">`);
  out.push(`<title>${esc(opts.title)}</title>`);
  out.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  out.push(`<g font-family="Segoe UI, Helvetica, Arial, sans-serif">`);

  out.push(`<text x="${padL}" y="28" font-size="15" font-weight="700" fill="${INK}">${esc(opts.title)}</text>`);
  if (opts.subtitle) {
    out.push(`<text x="${padL}" y="47" font-size="11.5" fill="${MUTED}">${esc(opts.subtitle)}</text>`);
  }

  // Grid and axis labels.
  for (const t of yTicks) {
    const y = r(sy(t));
    if (y < padT - 1 || y > padT + plotH + 1) continue;
    out.push(`<line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`);
    out.push(`<text x="${padL - 9}" y="${r(y + 3.5)}" font-size="10.5" fill="${MUTED}" text-anchor="end">${esc(fmt(t))}</text>`);
  }
  for (const t of xTicks) {
    const x = r(sx(t));
    if (x < padL - 1 || x > padL + plotW + 1) continue;
    out.push(`<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + plotH}" stroke="${GRID}" stroke-width="1"/>`);
    out.push(`<text x="${x}" y="${padT + plotH + 17}" font-size="10.5" fill="${MUTED}" text-anchor="middle">${esc(fmt(t))}</text>`);
  }

  // Axis lines.
  out.push(`<line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="${INK}" stroke-width="1.25"/>`);
  out.push(`<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="${INK}" stroke-width="1.25"/>`);

  // Axis titles.
  out.push(`<text x="${padL + plotW / 2}" y="${padT + plotH + 38}" font-size="11.5" font-weight="600" fill="${INK}" text-anchor="middle">${esc(opts.xLabel)}</text>`);
  out.push(`<text x="${18}" y="${padT + plotH / 2}" font-size="11.5" font-weight="600" fill="${INK}" text-anchor="middle" transform="rotate(-90 18 ${padT + plotH / 2})">${esc(opts.yLabel)}</text>`);

  // Optional vertical rule.
  if (opts.vRule) {
    const x = r(sx(opts.vRule.x));
    const c = opts.vRule.color ?? "#dc2626";
    out.push(`<line x1="${x}" y1="${padT}" x2="${x}" y2="${padT + plotH}" stroke="${c}" stroke-width="1.5" stroke-dasharray="5 4"/>`);
    out.push(`<text x="${r(x + 5)}" y="${padT + 14}" font-size="10.5" font-weight="700" fill="${c}">${esc(opts.vRule.label)}</text>`);
  }

  // Series.
  for (const s of opts.series) {
    const pts = s.points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && (!opts.yLog || p.y > 0));
    if (pts.length === 0) continue;
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${r(sx(p.x))} ${r(sy(p.y))}`).join(" ");
    out.push(`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"${s.dashed ? ' stroke-dasharray="6 4"' : ""}/>`);
    if (s.markers !== false) {
      for (const p of pts) {
        out.push(`<circle cx="${r(sx(p.x))}" cy="${r(sy(p.y))}" r="2.6" fill="${s.color}"/>`);
      }
    }
  }

  // Legend, laid out along the top of the plot area.
  let lx = padL;
  const ly = padT - 12;
  for (const s of opts.series) {
    out.push(`<line x1="${r(lx)}" y1="${ly}" x2="${r(lx + 16)}" y2="${ly}" stroke="${s.color}" stroke-width="2.5"${s.dashed ? ' stroke-dasharray="5 3"' : ""}/>`);
    out.push(`<text x="${r(lx + 21)}" y="${ly + 3.5}" font-size="10.5" fill="${INK}">${esc(s.label)}</text>`);
    lx += 30 + s.label.length * 5.9;
  }

  if (opts.caption) {
    const words = opts.caption.split(" ");
    const lines: string[] = [];
    let line = "";
    const maxChars = Math.floor((W - padL - padR) / 5.5);
    for (const w of words) {
      if ((line + " " + w).trim().length > maxChars) {
        lines.push(line.trim());
        line = w;
      } else {
        line += " " + w;
      }
    }
    if (line.trim()) lines.push(line.trim());
    lines.slice(0, 3).forEach((l, i) => {
      out.push(`<text x="${padL}" y="${H - 34 + i * 13}" font-size="10" fill="${MUTED}">${esc(l)}</text>`);
    });
  }

  out.push(`</g></svg>`);
  return out.join("\n");
}
