import { useState } from 'react';
import { suggestLabelMatches, type MatchableCostume } from '../../../services/insightsService';

interface LinkingUtilityProps {
  unmatchedLabels: string[];
  costumes: MatchableCostume[];
  onConfirm: (label: string, costumeId: string) => Promise<void>;
}

export default function LinkingUtility({ unmatchedLabels, costumes, onConfirm }: LinkingUtilityProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confirmingLabel, setConfirmingLabel] = useState<string | null>(null);

  if (unmatchedLabels.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E6D0C9] bg-white p-5 text-sm text-[#6E4B4B] shadow-sm">
        Todas las etiquetas del histórico están vinculadas a un disfraz del catálogo.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg text-[#4A1F1F]">Vincular etiquetas del histórico</h3>
      <p className="text-xs text-[#6E4B4B]">
        Estas etiquetas de "Disfraz" del CSV no coinciden con ningún disfraz del catálogo actual. Vincúlalas una
        vez y quedarán asociadas automáticamente en futuras importaciones.
      </p>

      <ul className="space-y-2">
        {unmatchedLabels.map((label) => {
          const suggestions = suggestLabelMatches(label, costumes);
          const suggestedIds = new Set(suggestions.map((s) => s.costumeId));
          const selected = selections[label] ?? suggestions[0]?.costumeId ?? '';

          return (
            <li
              key={label}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EFE1DB] p-3 text-sm"
            >
              <span className="min-w-[140px] font-semibold text-[#4A1F1F]">{label}</span>
              <select
                value={selected}
                onChange={(event) => setSelections((prev) => ({ ...prev, [label]: event.target.value }))}
                className="rounded-lg border border-[#D6B8AE] px-2 py-1 text-xs"
              >
                <option value="">Selecciona un disfraz</option>
                {suggestions.map((suggestion) => (
                  <option key={suggestion.costumeId} value={suggestion.costumeId}>
                    {suggestion.costumeName} (sugerido, {Math.round(suggestion.score * 100)}%)
                  </option>
                ))}
                {costumes
                  .filter((costume) => !suggestedIds.has(costume.id))
                  .map((costume) => (
                    <option key={costume.id} value={costume.id}>
                      {costume.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!selected || confirmingLabel === label}
                onClick={async () => {
                  setConfirmingLabel(label);
                  await onConfirm(label, selected);
                  setConfirmingLabel(null);
                }}
                className="rounded-lg bg-[#A8001A] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                {confirmingLabel === label ? 'Vinculando...' : 'Confirmar vínculo'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
