import { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import {
  disconnectInstagram,
  formatBogota,
  startInstagramConnection,
  type InstagramConnection,
} from '../../../services/instagramService';
import { primaryButton, secondaryButton } from './shared';

interface ConnectionPanelProps {
  connection: InstagramConnection | null;
  onChanged: () => void;
  onError: (error: unknown) => void;
  onNotify: (text: string) => void;
  requestConfirm: (options: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) => void;
}

export default function ConnectionPanel({ connection, onChanged, onError, onNotify, requestConfirm }: ConnectionPanelProps) {
  const [isWorking, setIsWorking] = useState(false);

  const handleConnect = async () => {
    setIsWorking(true);
    try {
      window.location.assign(await startInstagramConnection());
    } catch (error) {
      onError(error);
      setIsWorking(false);
    }
  };

  const handleDisconnect = () => {
    requestConfirm({
      title: '¿Desconectar Instagram?',
      message: 'Los carruseles programados no se publicarán hasta que vuelvas a conectar la cuenta.',
      confirmLabel: 'Desconectar',
      onConfirm: async () => {
        setIsWorking(true);
        try {
          await disconnectInstagram();
          onNotify('Cuenta de Instagram desconectada.');
          onChanged();
        } catch (error) {
          onError(error);
        } finally {
          setIsWorking(false);
        }
      },
    });
  };


  return (
    <section className="space-y-4 rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="font-serif text-[22px] font-semibold leading-[1.3] text-[#1A1418]">Cuenta de Instagram</h3>
      {connection ? (
        <>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-[#5C5257]">Cuenta conectada</dt>
              <dd className="font-medium text-[#1A1418]">@{connection.username ?? connection.ig_user_id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5C5257]">Nombre</dt>
              <dd className="text-[#1A1418]">{connection.account_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5C5257]">Conectada desde</dt>
              <dd className="font-mono text-[13px] text-[#1A1418]">{formatBogota(connection.connected_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#5C5257]">Estado del acceso</dt>
              <dd className="text-[#1A1418]">
                {connection.last_error ? 'Con error' : 'Funcionando'}
                {connection.last_checked_at ? (
                  <span className="ml-2 font-mono text-xs text-[#5C5257]">(revisado {formatBogota(connection.last_checked_at)})</span>
                ) : null}
              </dd>
            </div>
          </dl>
          {connection.last_error ? (
            <p role="alert" className="rounded-lg border border-[#F3C9C5] bg-[#FDECEA] p-3 text-sm text-[#8C1D18]">
              {connection.last_error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleConnect} disabled={isWorking} className={secondaryButton}>
              <Link2 size={18} strokeWidth={1.75} aria-hidden="true" />
              Volver a conectar
            </button>
            <button type="button" onClick={handleDisconnect} disabled={isWorking} className={secondaryButton}>
              <Unlink size={18} strokeWidth={1.75} aria-hidden="true" />
              Desconectar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm leading-[1.6] text-[#5C5257]">
            Conecta la cuenta profesional de Instagram de Disfraces Madi para publicar los carruseles programados.
            Te llevaremos a Meta para iniciar sesión (con Instagram o Facebook) y elegir la cuenta; luego volverás aquí.
            El acceso no vence: solo hay que reconectar si se revoca desde Meta.
          </p>
          <button type="button" onClick={handleConnect} disabled={isWorking} className={primaryButton}>
            <Link2 size={18} strokeWidth={1.75} aria-hidden="true" />
            {isWorking ? 'Abriendo Meta...' : 'Conectar Instagram'}
          </button>
        </>
      )}
    </section>
  );
}
