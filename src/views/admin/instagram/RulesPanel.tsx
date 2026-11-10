import { useEffect, useState } from 'react';
import { Pencil, Plus, Repeat, Trash2, X } from 'lucide-react';
import {
  deleteRule,
  fetchRules,
  formatBogota,
  nextRuleOccurrence,
  RULE_KIND_LABELS,
  saveRule,
  type InstagramRule,
  type InstagramRuleInput,
  type InstagramRuleKind,
} from '../../../services/instagramService';
import { ghostButton, inputClass, labelClass, primaryButton, secondaryButton } from './shared';

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const weekdayName = (value: number) => WEEKDAY_OPTIONS.find((option) => option.value === value)?.label.toLowerCase() ?? '';

function describeSchedule(rule: Pick<InstagramRule, 'cadence' | 'weekday' | 'publish_time'>) {
  const time = rule.publish_time.slice(0, 5);
  return rule.cadence === 'mensual'
    ? `El primer ${weekdayName(rule.weekday)} de cada mes, ${time}`
    : `Cada ${weekdayName(rule.weekday)}, ${time}`;
}

function defaultsFor(kind: InstagramRuleKind): InstagramRuleInput {
  return {
    kind,
    name: RULE_KIND_LABELS[kind].title,
    cadence: RULE_KIND_LABELS[kind].cadence,
    weekday: kind === 'categoria_semana' ? 3 : 5,
    publish_time: '19:00',
    items_count: 5,
    requires_approval: true,
    active: true,
  };
}

interface RulesPanelProps {
  onNotify: (text: string) => void;
  onError: (error: unknown) => void;
  requestConfirm: (options: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
}

export default function RulesPanel({ onNotify, onError, requestConfirm }: RulesPanelProps) {
  const [rules, setRules] = useState<InstagramRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<{ id?: string; input: InstagramRuleInput } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setRules(await fetchRules());
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      await saveRule(editing.input, editing.id);
      onNotify(editing.id ? 'Regla actualizada.' : 'Regla creada. Su carrusel se prepara 3 días antes de cada fecha.');
      setEditing(null);
      void load();
    } catch (error) {
      onError(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (rule: InstagramRule) => {
    try {
      const { id: _id, last_generated_for: _last, created_at: _created, ...input } = rule;
      await saveRule({ ...input, active: !rule.active }, rule.id);
      onNotify(rule.active ? 'Regla en pausa.' : 'Regla activada.');
      void load();
    } catch (error) {
      onError(error);
    }
  };

  const remove = (rule: InstagramRule) => {
    requestConfirm({
      title: `¿Eliminar la regla "${rule.name}"?`,
      message: 'Dejará de generar carruseles. Los que ya generó se mantienen en el calendario.',
      confirmLabel: 'Eliminar regla',
      onConfirm: async () => {
        try {
          await deleteRule(rule.id);
          onNotify('Regla eliminada.');
          void load();
        } catch (error) {
          onError(error);
        }
      },
    });
  };

  const update = (patch: Partial<InstagramRuleInput>) =>
    setEditing((prev) => (prev ? { ...prev, input: { ...prev.input, ...patch } } : prev));

  const usedKinds = new Set(rules.map((rule) => rule.kind));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-[1.6] text-[#5C5257]">
          Plantillas que arman carruseles solas a partir del catálogo. Cada carrusel se prepara 3 días antes para que puedas revisarlo.
        </p>
        {!editing ? (
          <button type="button" onClick={() => setEditing({ input: defaultsFor(usedKinds.has('novedades') ? 'categoria_semana' : 'novedades') })} className={primaryButton}>
            <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
            Nueva regla
          </button>
        ) : null}
      </div>

      {editing ? (
        <section className="space-y-4 rounded-2xl border border-[#1A1418]/10 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="regla-titulo">
          <div className="flex items-start justify-between gap-3">
            <h3 id="regla-titulo" className="font-serif text-[22px] font-semibold text-[#1A1418]">
              {editing.id ? 'Editar regla' : 'Nueva regla'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-lg text-[#5C5257] hover:text-[#A8001A]">
              <X size={22} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          <fieldset>
            <legend className={labelClass}>Tipo</legend>
            <div className="mt-1.5 grid gap-2 md:grid-cols-3">
              {(Object.keys(RULE_KIND_LABELS) as InstagramRuleKind[]).map((kind) => {
                const active = editing.input.kind === kind;
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={active}
                    disabled={Boolean(editing.id)}
                    onClick={() => setEditing((prev) => (prev ? { ...prev, input: { ...defaultsFor(kind), active: prev.input.active } } : prev))}
                    className={`rounded-xl border p-3 text-left disabled:cursor-default ${active ? 'border-[#A8001A] bg-[#A8001A]/5' : 'border-[#1A1418]/15 bg-white'} ${editing.id && !active ? 'opacity-40' : ''}`}
                  >
                    <span className="block text-sm font-medium text-[#1A1418]">{RULE_KIND_LABELS[kind].title}</span>
                    <span className="mt-1 block text-xs leading-[1.5] text-[#5C5257]">{RULE_KIND_LABELS[kind].description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={`${labelClass} md:col-span-2`}>
              Nombre
              <input value={editing.input.name} onChange={(event) => update({ name: event.target.value })} className={`mt-1.5 ${inputClass}`} />
            </label>
            <label className={labelClass}>
              Frecuencia
              <select value={editing.input.cadence} onChange={(event) => update({ cadence: event.target.value as InstagramRuleInput['cadence'] })} className={`mt-1.5 ${inputClass}`}>
                <option value="semanal">Cada semana</option>
                <option value="mensual">Una vez al mes (primera semana)</option>
              </select>
            </label>
            <label className={labelClass}>
              Día
              <select value={editing.input.weekday} onChange={(event) => update({ weekday: Number(event.target.value) })} className={`mt-1.5 ${inputClass}`}>
                {WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Hora (Colombia)
              <input type="time" value={editing.input.publish_time.slice(0, 5)} onChange={(event) => update({ publish_time: event.target.value })} className={`mt-1.5 font-mono ${inputClass}`} />
            </label>
            <label className={labelClass}>
              Disfraces por carrusel
              <input
                type="number"
                min={2}
                max={10}
                value={editing.input.items_count}
                onChange={(event) => update({ items_count: Math.min(10, Math.max(2, Number(event.target.value) || 2)) })}
                className={`mt-1.5 font-mono ${inputClass}`}
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex min-h-10 items-center gap-2 text-sm text-[#1A1418]">
              <input type="checkbox" checked={editing.input.requires_approval} onChange={() => update({ requires_approval: !editing.input.requires_approval })} className="h-4 w-4 accent-[#A8001A]" />
              Requiere aprobación antes de publicar (recomendado)
            </label>
            {!editing.input.requires_approval ? (
              <p className="rounded-lg bg-[#FED968] p-3 text-sm text-[#1A1418]">
                Sin aprobación, los carruseles de esta regla se publican solos con el texto que escriba la IA.
              </p>
            ) : null}
            <label className="flex min-h-10 items-center gap-2 text-sm text-[#1A1418]">
              <input type="checkbox" checked={editing.input.active} onChange={() => update({ active: !editing.input.active })} className="h-4 w-4 accent-[#A8001A]" />
              Activa
            </label>
          </div>

          <p className="text-sm text-[#5C5257]">
            {describeSchedule(editing.input)}.{' '}
            {(() => {
              const next = nextRuleOccurrence(editing.input);
              return next ? `Próxima fecha: ${formatBogota(next, { timeStyle: undefined, dateStyle: 'full' })}.` : '';
            })()}
          </p>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void save()} disabled={isSaving} className={primaryButton}>
              {isSaving ? 'Guardando...' : editing.id ? 'Guardar cambios' : 'Crear regla'}
            </button>
            <button type="button" onClick={() => setEditing(null)} disabled={isSaving} className={ghostButton}>
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      {isLoading ? <p className="text-sm text-[#5C5257]">Cargando reglas...</p> : null}
      {!isLoading && rules.length === 0 && !editing ? (
        <p className="rounded-2xl border border-[#1A1418]/10 bg-white p-6 text-sm text-[#5C5257]">
          Aún no hay reglas. Empieza con "Novedades" para mostrar cada semana lo que llega al atelier.
        </p>
      ) : null}

      <ul className="space-y-3">
        {rules.map((rule) => {
          const next = rule.active ? nextRuleOccurrence(rule) : null;
          return (
            <li key={rule.id} className={`space-y-3 rounded-2xl border border-[#1A1418]/10 bg-white p-4 shadow-sm ${rule.active ? '' : 'opacity-70'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Repeat size={20} strokeWidth={1.75} aria-hidden="true" className="mt-1 shrink-0 text-[#A8001A]" />
                  <div>
                    <h3 className="font-serif text-[22px] font-semibold text-[#1A1418]">{rule.name}</h3>
                    <p className="text-sm text-[#5C5257]">
                      {RULE_KIND_LABELS[rule.kind].title} · {describeSchedule(rule)} · <span className="font-mono">{rule.items_count}</span> disfraces
                    </p>
                    <p className="mt-1 text-xs text-[#5C5257]">
                      {rule.active
                        ? `${rule.requires_approval ? 'Con aprobación' : 'Sin aprobación'}${next ? ` · próxima: ${formatBogota(next)}` : ''}`
                        : 'En pausa'}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${rule.active ? 'bg-[#EAF8EE] text-[#1B6F3A]' : 'bg-[#1A1418]/5 text-[#5C5257]'}`}>
                  {rule.active ? 'Activa' : 'En pausa'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void toggleActive(rule)} className={secondaryButton}>
                  {rule.active ? 'Pausar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { id, last_generated_for: _last, created_at: _created, ...input } = rule;
                    setEditing({ id, input });
                  }}
                  className={secondaryButton}
                >
                  <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
                  Editar
                </button>
                <button type="button" onClick={() => remove(rule)} className={ghostButton}>
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
