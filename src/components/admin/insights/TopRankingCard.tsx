export interface RankingRow {
  costumeId: string | null;
  label: string;
  count: number;
}

interface TopRankingCardProps {
  title: string;
  source: string;
  rows: RankingRow[];
  onViewAll: () => void;
}

export default function TopRankingCard({ title, source, rows, onViewAll }: TopRankingCardProps) {
  const top = rows.slice(0, 5);
  const maxCount = top[0]?.count ?? 0;

  return (
    <div className="space-y-3 rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-[#4A1F1F]">{title}</h3>
        <span className="text-[10px] uppercase tracking-wide text-[#6E4B4B]/70">Fuente: {source}</span>
      </div>

      {top.length === 0 ? (
        <p className="text-sm text-[#6E4B4B]">
          Aún no hay movimiento registrado en este periodo. Prueba con otro rango de fechas.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {top.map((row, index) => (
            <li key={row.costumeId ?? `unlinked-${index}`} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-[#4A1F1F]">
                  {index + 1}. {row.label}
                </span>
                <span className="font-mono font-semibold text-[#A8001A]">{row.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F0EF]">
                <div
                  className="h-full rounded-full bg-[#A8001A]"
                  style={{ width: `${maxCount > 0 ? (row.count / maxCount) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 ? (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-[#A8001A] underline underline-offset-2"
        >
          Ver detalle completo →
        </button>
      ) : null}
    </div>
  );
}
