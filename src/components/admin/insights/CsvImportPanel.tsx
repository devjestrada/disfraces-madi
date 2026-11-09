import { useState } from 'react';
import { parseRentalHistoryCsv } from '../../../services/insightsService';
import type { RentalHistoryImportRow } from '../../../types';

interface CsvImportPanelProps {
  onImport: (rows: RentalHistoryImportRow[]) => Promise<void>;
  isImporting: boolean;
}

export default function CsvImportPanel({ onImport, isImporting }: CsvImportPanelProps) {
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<RentalHistoryImportRow[]>([]);
  const [parseError, setParseError] = useState('');

  const handleFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    setFileName(file.name);
    setParseError('');

    try {
      const text = await file.text();
      const rows = parseRentalHistoryCsv(text);
      if (rows.length === 0) {
        setParseError('No se encontraron filas válidas (revisa que la columna "Disfraz" tenga datos).');
      }
      setParsedRows(rows);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'No se pudo leer el archivo.');
      setParsedRows([]);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg text-[#1A1418]">Importar/anexar histórico (CSV)</h3>
        <label className="cursor-pointer rounded-lg bg-[#1A1418] px-3 py-2 text-xs font-semibold text-white">
          Elegir archivo
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <p className="text-xs text-[#5C5257]">
        Columnas esperadas: archivo, numero_factura, cliente, direccion, telefono_nit, fecha, Disfraz, categoria,
        Accesorios, valor_total, deposito, notas. Puedes usar este mismo panel para anexar nuevas filas más adelante.
      </p>

      {fileName ? <p className="text-xs text-[#5C5257]">Archivo: {fileName}</p> : null}
      {parseError ? <p className="text-xs font-semibold text-[#B3261E]">{parseError}</p> : null}

      {parsedRows.length > 0 ? (
        <div className="flex items-center justify-between rounded-lg bg-[#FFF8F5] p-3 text-xs text-[#1A1418]">
          <span>{parsedRows.length} filas listas para importar.</span>
          <button
            type="button"
            disabled={isImporting}
            onClick={async () => {
              await onImport(parsedRows);
              setParsedRows([]);
              setFileName('');
            }}
            className="rounded-lg bg-[#A8001A] px-3 py-2 font-semibold text-white disabled:opacity-60"
          >
            {isImporting ? 'Importando...' : 'Confirmar importación'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
