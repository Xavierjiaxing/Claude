const colorMap: Record<string, string> = {
  pdf: 'bg-red-50 text-red-600',
  docx: 'bg-blue-50 text-blue-700',
  txt: 'bg-emerald-50 text-emerald-600',
  md: 'bg-emerald-50 text-emerald-600',
  svg: 'bg-amber-50 text-amber-600',
  jpg: 'bg-amber-50 text-amber-600',
  jpeg: 'bg-amber-50 text-amber-600',
  png: 'bg-amber-50 text-amber-600',
  bmp: 'bg-amber-50 text-amber-600',
  webp: 'bg-amber-50 text-amber-600',
};

export default function FileTypeBadge({ type }: { type: string }) {
  const ext = (type || '').replace('.', '').toLowerCase();
  const colors = colorMap[ext] || 'bg-slate-100 text-slate-600';
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${colors}`}>{ext || '--'}</span>;
}
