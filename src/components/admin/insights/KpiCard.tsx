import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  source: string;
  variation?: number | null;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export default function KpiCard({ label, value, source, variation, isEmpty, emptyMessage }: KpiCardProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5C5257]">{label}</p>

      {isEmpty ? (
        <p className="text-sm text-[#5C5257]">
          {emptyMessage ?? 'Aún no hay movimiento registrado en este periodo. Prueba con otro rango de fechas.'}
        </p>
      ) : (
        <>
          <p className="font-mono text-3xl font-bold text-[#1A1418]">{value}</p>
          {variation !== null && variation !== undefined ? (
            <p className={`text-xs font-semibold ${variation >= 0 ? 'text-[#1B6F3A]' : 'text-[#B3261E]'}`}>
              {variation >= 0 ? '▲' : '▼'} {Math.abs(variation).toFixed(0)}% vs. periodo anterior
            </p>
          ) : null}
        </>
      )}

      <p className="text-[10px] uppercase tracking-wide text-[#5C5257]/70">Fuente: {source}</p>
    </div>
  );
}
