import { InsightsPeriodPreset, DateRange } from '../../../types';

const PRESET_OPTIONS: { id: InsightsPeriodPreset; label: string }[] = [
  { id: 'hoy', label: 'Hoy' },
  { id: '7dias', label: 'Últimos 7 días' },
  { id: 'mes', label: 'Este mes' },
  { id: 'anio', label: 'Este año' },
  { id: 'historico', label: 'Histórico completo' },
  { id: 'personalizado', label: 'Rango personalizado' },
];

interface PeriodSelectorProps {
  value: InsightsPeriodPreset;
  customRange: DateRange;
  onChange: (preset: InsightsPeriodPreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

function toInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : '';
}

export default function PeriodSelector({
  value,
  customRange,
  onChange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E6D0C9] bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {PRESET_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              value === option.id
                ? 'bg-[#A8001A] text-white'
                : 'border border-[#D6B8AE] text-[#4A1F1F] hover:bg-[#FFF4F6]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {value === 'personalizado' ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A1F1F]">
          <label className="flex items-center gap-1.5">
            Desde
            <input
              type="date"
              value={toInputValue(customRange.from)}
              onChange={(event) =>
                onCustomRangeChange({
                  ...customRange,
                  from: event.target.value ? new Date(event.target.value) : null,
                })
              }
              className="rounded-lg border border-[#D6B8AE] px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Hasta
            <input
              type="date"
              value={toInputValue(customRange.to)}
              onChange={(event) =>
                onCustomRangeChange({
                  ...customRange,
                  to: event.target.value ? new Date(event.target.value) : null,
                })
              }
              className="rounded-lg border border-[#D6B8AE] px-2 py-1"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
