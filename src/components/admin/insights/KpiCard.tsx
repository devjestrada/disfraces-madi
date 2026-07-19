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
    <div className="space-y-2 rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#6E4B4B]">{label}</p>

      {isEmpty ? (
        <p className="text-sm text-[#6E4B4B]">
          {emptyMessage ?? 'Aún no hay movimiento registrado en este periodo. Prueba con otro rango de fechas.'}
        </p>
      ) : (
        <>
          <p className="font-mono text-3xl font-bold text-[#4A1F1F]">{value}</p>
          {variation !== null && variation !== undefined ? (
            <p className={`text-xs font-semibold ${variation >= 0 ? 'text-[#1B6F3A]' : 'text-[#9E2D2D]'}`}>
              {variation >= 0 ? '▲' : '▼'} {Math.abs(variation).toFixed(0)}% vs. periodo anterior
            </p>
          ) : null}
        </>
      )}

      <p className="text-[10px] uppercase tracking-wide text-[#6E4B4B]/70">Fuente: {source}</p>
    </div>
  );
}
