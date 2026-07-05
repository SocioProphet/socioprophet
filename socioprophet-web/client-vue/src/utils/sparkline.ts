// Tiny self-contained SVG sparkline helpers — no chart library. Shared by the
// market/economy dashboards. Maps a numeric series into a polyline/area point
// string for a given viewBox width/height.
export function sparkPoints(series: number[], w: number, h: number, pad = 0.12): string {
  if (series.length === 0) return '';
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = (max - min) || 1;
  const p = h * pad;
  return series
    .map((v, i) => {
      const x = series.length === 1 ? w : (i / (series.length - 1)) * w;
      const y = (h - p) - ((v - min) / span) * (h - p * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function areaPoints(series: number[], w: number, h: number, pad = 0.12): string {
  return `0,${h} ${sparkPoints(series, w, h, pad)} ${w},${h}`;
}
