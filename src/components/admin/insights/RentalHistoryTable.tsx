import { Fragment, useMemo, useState } from 'react';
import type { AdminRentalHistoryRow } from '../../../types';
import type { MatchableCostume } from '../../../services/insightsService';
import { formatCOP } from '../../../utils/format';

type LinkedFilter = 'todos' | 'vinculados' | 'sin-vincular';
type SortKey = 'rental_date' | 'costume_label' | 'total_value' | 'customer_name';

const PAGE_SIZE = 20;

interface RentalHistoryTableProps {
  rows: AdminRentalHistoryRow[];
  costumes: MatchableCostume[];
  onRequestLink: (label: string) => void;
}

export default function RentalHistoryTable({ rows, costumes, onRequestLink }: RentalHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [linkedFilter, setLinkedFilter] = useState<LinkedFilter>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('rental_date');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const costumeNameById = useMemo(() => new Map(costumes.map((c) => [c.id, c.name])), [costumes]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      if (row.category_label) {
        set.add(row.category_label);
      }
    });
    return Array.from(set).sort();
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let result = rows.filter((row) => {
      if (query) {
        const haystack = `${row.customer_name ?? ''} ${row.costume_label} ${row.invoice_number ?? ''}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (categoryFilter !== 'todas' && row.category_label !== categoryFilter) {
        return false;
      }

      if (linkedFilter === 'vinculados' && !row.matched_costume_id) {
        return false;
      }
      if (linkedFilter === 'sin-vincular' && row.matched_costume_id) {
        return false;
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      let compare = 0;
      if (sortKey === 'rental_date') {
        compare = (a.rental_date ?? '').localeCompare(b.rental_date ?? '');
      } else if (sortKey === 'costume_label') {
        compare = a.costume_label.localeCompare(b.costume_label);
      } else if (sortKey === 'total_value') {
        compare = (a.total_value ?? 0) - (b.total_value ?? 0);
      } else if (sortKey === 'customer_name') {
        compare = (a.customer_name ?? '').localeCompare(b.customer_name ?? '');
      }
      return sortAsc ? compare : -compare;
    });

    return result;
  }, [rows, searchQuery, categoryFilter, linkedFilter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(1);
  };

  const sortIndicator = (key: SortKey) => (key === sortKey ? (sortAsc ? '▲' : '▼') : '');

  return (
    <div className="space-y-4 rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por cliente, disfraz o factura..."
          className="min-w-[220px] flex-1 rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
        >
          <option value="todas">Todas las categorías</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select
          value={linkedFilter}
          onChange={(event) => {
            setLinkedFilter(event.target.value as LinkedFilter);
            setPage(1);
          }}
          className="rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
        >
          <option value="todos">Vinculados y sin vincular</option>
          <option value="vinculados">Solo vinculados</option>
          <option value="sin-vincular">Solo sin vincular</option>
        </select>
      </div>

      <div className="max-h-[600px] overflow-y-auto rounded-xl border border-[#EFE1DB]">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#FFF8F5] text-xs font-semibold uppercase tracking-wide text-[#6E4B4B]">
            <tr>
              <th className="cursor-pointer px-3 py-2" onClick={() => handleSort('rental_date')}>
                Fecha {sortIndicator('rental_date')}
              </th>
              <th className="cursor-pointer px-3 py-2" onClick={() => handleSort('costume_label')}>
                Disfraz {sortIndicator('costume_label')}
              </th>
              <th className="cursor-pointer px-3 py-2" onClick={() => handleSort('customer_name')}>
                Cliente {sortIndicator('customer_name')}
              </th>
              <th className="cursor-pointer px-3 py-2" onClick={() => handleSort('total_value')}>
                Valor {sortIndicator('total_value')}
              </th>
              <th className="px-3 py-2">Vínculo</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className="cursor-pointer border-t border-[#EFE1DB] hover:bg-[#FFF4F6]"
                  onClick={() => setExpandedRowId((prev) => (prev === row.id ? null : row.id))}
                >
                  <td className="px-3 py-2 font-mono text-xs">{row.rental_date ?? 'Sin fecha'}</td>
                  <td className="px-3 py-2">{row.costume_label}</td>
                  <td className="px-3 py-2">{row.customer_name ?? '—'}</td>
                  <td className="px-3 py-2 font-mono">
                    {row.total_value !== null ? formatCOP(row.total_value) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.matched_costume_id ? (
                      <span className="rounded-full bg-[#EAF8EE] px-2 py-1 text-[10px] font-semibold text-[#1B6F3A]">
                        {costumeNameById.get(row.matched_costume_id) ?? 'Vinculado'}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRequestLink(row.costume_label);
                        }}
                        className="rounded-full bg-[#F3F0EF] px-2 py-1 text-[10px] font-semibold text-[#6E4B4B] hover:bg-[#E6D0C9]"
                      >
                        Sin vincular · Vincular
                      </button>
                    )}
                  </td>
                </tr>
                {expandedRowId === row.id ? (
                  <tr className="border-t border-[#EFE1DB] bg-[#FFF8F5]">
                    <td colSpan={5} className="px-3 py-3 text-xs text-[#6E4B4B]">
                      <div className="grid gap-1 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold">Dirección:</span> {row.customer_address ?? '—'}
                        </p>
                        <p>
                          <span className="font-semibold">Teléfono:</span> {row.customer_phone ?? '—'}
                        </p>
                        <p>
                          <span className="font-semibold">Factura:</span> {row.invoice_number ?? '—'}
                        </p>
                        <p>
                          <span className="font-semibold">Depósito:</span>{' '}
                          {row.deposit_value !== null ? formatCOP(row.deposit_value) : '—'}
                        </p>
                        <p className="sm:col-span-2">
                          <span className="font-semibold">Accesorios:</span> {row.accessories_text ?? '—'}
                        </p>
                        {row.notes ? (
                          <p className="sm:col-span-2">
                            <span className="font-semibold">Notas de transcripción:</span> {row.notes}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-[#6E4B4B]">
                  Sin registros que coincidan con la búsqueda/filtros.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[#6E4B4B]">
        <span>
          {filteredRows.length} registro{filteredRows.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="rounded border border-[#D6B8AE] px-2 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded border border-[#D6B8AE] px-2 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
