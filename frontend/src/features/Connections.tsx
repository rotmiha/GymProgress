import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';

export type Connection = {
  id: string;
  trainer_id: string;
  client_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  email: string;
  ime: string;
  priimek: string;
};
export function Connections({ api, role }: { api: Api; role: string }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [clientProfile, setClientProfile] = useState<{
    ime: string;
    priimek: string;
    email: string;
  } | null>(null);
  const load = async () => setConnections(await api<Connection[]>('/connections'));
  useEffect(() => {
    void load().catch((err) => setError(errorMessage(err)));
  }, [api]);
  async function act(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    setNotice('');
    setClientProfile(null);
    try {
      await action();
      await load();
      setNotice(message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  function invite(event: FormEvent) {
    event.preventDefault();
    void act(() => api('/connections', 'POST', { email: email.trim() }), 'Povabilo je poslano.');
  }
  return (
    <div>
      <h2>{role === 'trener' ? 'Povezave s strankami' : 'Povabila trenerjev'}</h2>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {role === 'trener' && (
        <form onSubmit={invite}>
          <div>
            <label htmlFor="client-email">E-naslov obstoječe stranke</label>
            <input
              id="client-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
            />
          </div>
          <button disabled={busy}>Pošlji povabilo</button>
        </form>
      )}
      <button
        className="secondary"
        disabled={busy}
        onClick={() => void act(load, 'Povezave so osvežene.')}
      >
        Osveži povezave
      </button>
      {!connections.length && <p>Ni povabil ali povezav.</p>}
      {connections.map((connection) => (
        <article key={connection.id}>
          <h3>
            {connection.ime} {connection.priimek}
          </h3>
          <p>{connection.email}</p>
          <p>
            Stanje:{' '}
            {
              { pending: 'Čaka na potrditev', accepted: 'Potrjeno', rejected: 'Zavrnjeno' }[
                connection.status
              ]
            }
          </p>
          {role === 'stranka' && connection.status === 'pending' && (
            <div className="actions">
              <button
                disabled={busy}
                onClick={() =>
                  void act(
                    () => api(`/connections/${connection.id}`, 'PATCH', { status: 'accepted' }),
                    'Povabilo je sprejeto.',
                  )
                }
              >
                Sprejmi
              </button>
              <button
                className="secondary"
                disabled={busy}
                onClick={() =>
                  void act(
                    () => api(`/connections/${connection.id}`, 'PATCH', { status: 'rejected' }),
                    'Povabilo je zavrnjeno.',
                  )
                }
              >
                Zavrni
              </button>
            </div>
          )}
          {role === 'trener' && connection.status === 'accepted' && (
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                setError('');
                setClientProfile(null);
                try {
                  setClientProfile(await api(`/clients/${connection.client_id}`));
                } catch (err) {
                  setError(errorMessage(err));
                }
              }}
            >
              Prikaži profil stranke
            </button>
          )}
        </article>
      ))}
      {clientProfile && (
        <article>
          <h3>Profil povezane stranke</h3>
          <p>
            {clientProfile.ime} {clientProfile.priimek}
          </p>
          <p>{clientProfile.email}</p>
        </article>
      )}
    </div>
  );
}
