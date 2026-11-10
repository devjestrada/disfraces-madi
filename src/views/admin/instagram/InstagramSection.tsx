import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { AdminCategory, AdminCostume } from '../../../types';
import {
  bogotaDayKey,
  fetchInstagramConnection,
  fetchInstagramPosts,
  type InstagramConnection,
  type InstagramPost,
} from '../../../services/instagramService';
import CalendarView from './CalendarView';
import ConnectionPanel from './ConnectionPanel';
import PostEditor from './PostEditor';
import CampaignsPanel from './CampaignsPanel';
import RulesPanel from './RulesPanel';
import { primaryButton } from './shared';

export type InstagramTab = 'calendario' | 'campanas' | 'reglas' | 'conexion';

const TABS: Array<{ id: InstagramTab; label: string }> = [
  { id: 'calendario', label: 'Calendario' },
  { id: 'campanas', label: 'Campañas' },
  { id: 'reglas', label: 'Reglas' },
  { id: 'conexion', label: 'Conexión' },
];

export interface InstagramSectionProps {
  costumes: AdminCostume[];
  categories: AdminCategory[];
  userId: string | null;
  initialTab?: InstagramTab;
  notify: (text: string, variant?: 'success' | 'error' | 'info') => void;
  notifyError: (error: unknown) => void;
  requestConfirm: (options: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
}

function currentMonth() {
  const [year, month] = bogotaDayKey(new Date().toISOString()).split('-').map(Number);
  return { year, month: month - 1 };
}

function monthRange({ year, month }: { year: number; month: number }) {
  // Del primer día 00:00 al último día 23:59 en hora de Colombia (UTC−5).
  const from = new Date(Date.UTC(year, month, 1, 5, 0, 0)).toISOString();
  const to = new Date(Date.UTC(year, month + 1, 1, 4, 59, 59)).toISOString();
  return { from, to };
}

export default function InstagramSection(props: InstagramSectionProps) {
  const { costumes, categories, userId, initialTab, notify, notifyError, requestConfirm } = props;
  const [tab, setTab] = useState<InstagramTab>(initialTab ?? 'calendario');
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [connectionLoaded, setConnectionLoaded] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [editor, setEditor] = useState<{ post: InstagramPost | null } | null>(null);

  const loadConnection = useCallback(async () => {
    try {
      setConnection(await fetchInstagramConnection());
    } catch (error) {
      notifyError(error);
    } finally {
      setConnectionLoaded(true);
    }
  }, [notifyError]);

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const { from, to } = monthRange(month);
      setPosts(await fetchInstagramPosts(from, to));
    } catch (error) {
      notifyError(error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [month, notifyError]);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl font-bold leading-[1.2] text-[#1A1418]">Instagram</h2>
          <p className="mt-1 text-sm leading-[1.6] text-[#5C5257]">
            Carruseles programados para el feed{connection?.username ? ` de @${connection.username}` : ''}. Horas en hora de Colombia.
          </p>
        </div>
        <button type="button" onClick={() => setEditor({ post: null })} className={primaryButton}>
          <Plus size={20} strokeWidth={1.75} aria-hidden="true" />
          Nuevo carrusel
        </button>
      </div>

      {connectionLoaded && !connection ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FED968] p-4 text-sm text-[#1A1418]">
          <span>Instagram no está conectado: puedes preparar y programar, pero nada se publicará hasta conectar la cuenta.</span>
          <button type="button" onClick={() => setTab('conexion')} className="min-h-10 font-medium text-[#A8001A] underline">
            Conectar ahora
          </button>
        </div>
      ) : null}

      <div role="tablist" aria-label="Secciones de Instagram" className="flex flex-wrap gap-1 rounded-xl border border-[#1A1418]/10 bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`min-h-10 rounded-lg px-4 text-sm font-medium ${tab === item.id ? 'bg-[#A8001A] text-[#FFF8F5]' : 'text-[#1A1418] hover:bg-[#A8001A]/5'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'calendario' ? (
        <CalendarView
          posts={posts}
          month={month}
          onMonthChange={setMonth}
          isLoading={isLoadingPosts}
          userId={userId}
          onEdit={(post) => setEditor({ post })}
          onChanged={loadPosts}
          onNotify={(text) => notify(text)}
          onError={notifyError}
        />
      ) : null}

      {tab === 'campanas' ? (
        <CampaignsPanel
          costumes={costumes}
          categories={categories}
          userId={userId}
          onCreated={() => {
            void loadPosts();
            setTab('calendario');
          }}
          onNotify={(text) => notify(text)}
          onError={notifyError}
          requestConfirm={requestConfirm}
        />
      ) : null}

      {tab === 'reglas' ? <RulesPanel onNotify={(text) => notify(text)} onError={notifyError} requestConfirm={requestConfirm} /> : null}

      {tab === 'conexion' ? (
        <ConnectionPanel
          connection={connection}
          onChanged={loadConnection}
          onError={notifyError}
          onNotify={(text) => notify(text)}
          requestConfirm={requestConfirm}
        />
      ) : null}

      {editor ? (
        <PostEditor
          post={editor.post}
          costumes={costumes}
          categories={categories}
          userId={userId}
          onClose={() => setEditor(null)}
          onSaved={(message) => {
            setEditor(null);
            notify(message);
            void loadPosts();
          }}
          onError={notifyError}
        />
      ) : null}
    </div>
  );
}
