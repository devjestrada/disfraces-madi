import { AnimatePresence, motion } from 'motion/react';
import { percentChange } from '../../../utils/dateRanges';

export interface RankingDetailRow {
  costumeId: string | null;
  label: string;
  count: number;
  previousCount: number;
}

interface RankingDetailDrawerProps {
  open: boolean;
  title: string;
  rows: RankingDetailRow[];
  onClose: () => void;
  onNavigateToCostume: (costumeId: string) => void;
}

export default function RankingDetailDrawer({
  open,
  title,
  rows,
  onClose,
  onNavigateToCostume,
}: RankingDetailDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex justify-end bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl text-[#1A1418]">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#1A1418]/20 px-3 py-1.5 text-xs font-semibold text-[#1A1418]"
              >
                Cerrar
              </button>
            </div>

            {rows.length === 0 ? (
              <p className="text-sm text-[#5C5257]">Sin datos para este periodo.</p>
            ) : (
              <ol className="space-y-2">
                {rows.map((row, index) => {
                  const variation = percentChange(row.count, row.previousCount);
                  return (
                    <li
                      key={row.costumeId ?? `unlinked-${index}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#1A1418]/10 p-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 font-mono text-xs text-[#5C5257]">#{index + 1}</span>
                        <span className="truncate text-[#1A1418]">{row.label}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {variation !== null ? (
                          <span
                            className={`text-[10px] font-semibold ${
                              variation >= 0 ? 'text-[#1B6F3A]' : 'text-[#B3261E]'
                            }`}
                          >
                            {variation >= 0 ? '▲' : '▼'} {Math.abs(variation).toFixed(0)}%
                          </span>
                        ) : null}
                        <span className="font-mono font-semibold text-[#A8001A]">{row.count}</span>
                        {row.costumeId ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToCostume(row.costumeId!)}
                            className="text-xs font-semibold text-[#A8001A] underline"
                          >
                            Editar
                          </button>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
