import { useState } from 'react';

/* Lightweight SVG charts (no chart library) — colours come from CSS variables so
   they follow the dark / light theme automatically. */
const clamp = (n) => Math.max(0, Math.min(100, n));

export function Sparkline({ values, width = 120, height = 52 }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [
    (i / Math.max(values.length - 1, 1)) * (width - 8) + 4,
    height - 5 - ((v - min) / span) * (height - 10),
  ]);
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend line">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MiniBars({ values, label = 'Bar chart' }) {
  const max = Math.max(...values, 1);
  return (
    <div className="minibars" role="img" aria-label={label}>
      {values.map((v, i) => <i key={i} title={String(v)} style={{ height: `${Math.max(12, (v / max) * 100)}%` }} className={i === values.length - 1 ? 'hl' : ''} />)}
    </div>
  );
}

export function Ring({ percent, size = 72, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const c0 = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${percent}% complete`}>
      <circle cx={c0} cy={c0} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle cx={c0} cy={c0} r={r} fill="none" stroke="var(--gold)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(c * clamp(percent)) / 100} ${c}`} transform={`rotate(-90 ${c0} ${c0})`} />
    </svg>
  );
}

export function Gauge({ value }) {
  const r = 78;
  const c = 2 * Math.PI * r;
  const sweep = 0.75;
  const common = { cx: 100, cy: 100, r, fill: 'none', strokeWidth: 15, strokeLinecap: 'round', transform: 'rotate(135 100 100)' };
  return (
    <svg className="gauge" viewBox="0 0 200 190" role="img" aria-label={`Team score ${value} out of 100`}>
      <circle {...common} stroke="var(--surface-2)" strokeDasharray={`${c * sweep} ${c}`} />
      <circle {...common} stroke="var(--gold)" strokeDasharray={`${c * sweep * (clamp(value) / 100)} ${c}`} style={{ transition: 'stroke-dasharray .8s ease' }} />
      <text x="100" y="112" textAnchor="middle" fontSize="58" fontWeight="500" fill="var(--text)">{value}</text>
    </svg>
  );
}

export function LineChart({ labels, series }) {
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = 290;
  const P = { l: 42, r: 18, t: 18, b: 34 };
  const n = labels.length;
  const top = Math.max(...series.flatMap((s) => s.values), 1);
  const max = Math.max(4, Math.ceil(top / 4) * 4);
  const x = (i) => P.l + (n === 1 ? 0.5 : i / (n - 1)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  const ticks = [0, 1, 2, 3, 4].map((i) => (i * max) / 4);

  return (
    <div className="linechart" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tasks created versus completed">
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={P.l} x2={W - P.r} y1={y(tk)} y2={y(tk)} stroke="var(--border)" />
            <text x={P.l - 10} y={y(tk) + 4} textAnchor="end" fontSize="12" fill="var(--muted)">{tk}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--muted)">{l}</text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="var(--border-strong)" strokeDasharray="4 4" />}
        {series.map((s) => (
          <g key={s.name}>
            <polyline fill="none" stroke={s.color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
            {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 6 : 4.5} fill={s.color} stroke="var(--surface)" strokeWidth="2" />)}
          </g>
        ))}
        {labels.map((l, i) => (
          <rect key={`h${i}`} x={x(i) - (W - P.l - P.r) / n / 2} y={P.t} width={(W - P.l - P.r) / n} height={H - P.t - P.b} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="tooltip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(Math.max(...series.map((s) => s.values[hover]))) / H) * 100}%` }}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => <span key={s.name}><i style={{ background: s.color }} /> {s.name}: {s.values[hover]}</span>)}
        </div>
      )}
    </div>
  );
}

export function Heatmap({ rows, cols, data }) {
  const max = Math.max(1, ...data.flat());
  return (
    <div>
      <div className="heat">
        <span />
        {cols.map((c) => <span key={c} className="heat-col">{c}</span>)}
        {rows.map((r, ri) => (
          <div key={r} className="heat-row">
            <span className="heat-label">{r}</span>
            {data[ri].map((v, ci) => (
              <i key={ci} className="heat-cell" title={`${r} · ${cols[ci]}: ${v} task${v === 1 ? '' : 's'}`}
                style={{ background: v === 0 ? 'var(--surface-2)' : `color-mix(in srgb, var(--gold) ${25 + (v / max) * 75}%, var(--surface-2))` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend"><span>0</span>{[0, 0.3, 0.6, 1].map((f) => <i key={f} style={{ background: f === 0 ? 'var(--surface-2)' : `color-mix(in srgb, var(--gold) ${25 + f * 75}%, var(--surface-2))` }} />)}<span>{max}+</span></div>
    </div>
  );
}

export function Donut({ slices, total, size = 190, stroke = 28 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const c0 = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution chart" className="donut">
      <circle cx={c0} cy={c0} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {slices.map((s) => {
        const len = total ? (c * s.value) / total : 0;
        const el = len > 0 && (
          <circle key={s.label} cx={c0} cy={c0} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${Math.max(len - 3, 0)} ${c - Math.max(len - 3, 0)}`} strokeDashoffset={-acc} transform={`rotate(-90 ${c0} ${c0})`} />
        );
        acc += len;
        return el;
      })}
      <text x={c0} y={c0 + 4} textAnchor="middle" fontSize="34" fontWeight="600" fill="var(--text)">{total}</text>
      <text x={c0} y={c0 + 24} textAnchor="middle" fontSize="12" fill="var(--muted)">people</text>
    </svg>
  );
}
