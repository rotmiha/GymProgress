import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';
import { PageHeading } from './PageHeading';

export type Connection = {
  id: string;
  trainer_id: string;
  client_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  email: string;
  ime: string;
  priimek: string;
};
const statuses = {
  pending: 'Čaka na potrditev',
  accepted: 'Potrjena povezava',
  rejected: 'Zavrnjeno povabilo',
};

export function Connections({ api, role }: { api: Api; role: string }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<{
    ime: string;
    priimek: string;
    email: string;
  } | null>(null);
  const trainer = role === 'trener';
  const load = async () => setConnections(await api<Connection[]>('/connections'));
  useEffect(() => {
    setLoading(true);
    void load()
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
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
    <>
      <PageHeading
        title="Povezava stranke s trenerjem"
        description={
          trainer
            ? 'Povabi obstoječo stranko. Povezava začne veljati, ko stranka povabilo sprejme.'
            : 'Preglej povabila in odloči, komu omogočiš dostop do svojih treningov.'
        }
        actions={
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void act(load, 'Povezave so osvežene.')}
          >
            Osveži povezave
          </button>
        }
      />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading && <p role="status">Nalaganje povezav …</p>}
      <div className="panel-grid balanced-layout">
        <section className="panel">
          <h2>{trainer ? 'Pogled trenerja' : 'Pogled stranke'}</h2>
          <p className="muted">
            {trainer
              ? 'Pošlji povabilo za sodelovanje.'
              : 'Ti odločaš, s katerim trenerjem želiš sodelovati.'}
          </p>
          <hr />
          {trainer ? (
            <>
              <h3>Povabi stranko</h3>
              <form onSubmit={invite}>
                <fieldset disabled={busy}>
                  <div>
                    <label htmlFor="client-email">E-naslov obstoječe stranke</label>
                    <input
                      id="client-email"
                      placeholder="ime.priimek@example.com"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="form-footer">
                    <button>Pošlji povabilo</button>
                  </div>
                </fieldset>
              </form>
              <p className="panel-note">
                Pred potrditvijo nimaš dostopa do strankinih treningov in ji ne moreš dodeliti
                programa.
              </p>
            </>
          ) : (
            <div className="connection-explainer">
              <h3>Kaj pomeni potrditev?</h3>
              <p>
                S potrditvijo omogočiš trenerju dodelitev programov in vpogled v svoje treninge ter
                rezultate.
              </p>
              <p>
                <strong>Sprejmi →</strong> potrjena povezava
              </p>
              <p>
                <strong>Zavrni →</strong> zavrnjeno povabilo
              </p>
              <small>Odloči se lahko samo naslovljena stranka.</small>
            </div>
          )}
        </section>
        <section className="panel">
          <h2>{trainer ? 'Poslana povabila in povezave' : 'Moja povabila in povezave'}</h2>
          {!connections.length && !loading && (
            <p className="empty-state">Ni povabil ali povezav.</p>
          )}
          {connections.map((connection) => (
            <article key={connection.id} className="invitation-card">
              {connection.status === 'pending' && !trainer && (
                <p className="eyebrow">Novo povabilo za povezavo</p>
              )}
              <header className="invitation-heading">
                <div>
                  <h3>
                    {connection.ime} {connection.priimek}
                  </h3>
                  <p className="muted">{connection.email}</p>
                </div>
                <span className="status-badge">{statuses[connection.status]}</span>
              </header>
              {!trainer && connection.status === 'pending' && (
                <>
                  <p>Vabi te k sodelovanju kot tvoj trener.</p>
                  <div className="actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(
                          () =>
                            api(`/connections/${connection.id}`, 'PATCH', { status: 'accepted' }),
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
                          () =>
                            api(`/connections/${connection.id}`, 'PATCH', { status: 'rejected' }),
                          'Povabilo je zavrnjeno.',
                        )
                      }
                    >
                      Zavrni
                    </button>
                  </div>
                </>
              )}
              {trainer && connection.status === 'accepted' && (
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setError('');
                    setClientProfile(null);
                    setBusy(true);
                    try {
                      setClientProfile(await api(`/clients/${connection.client_id}`));
                    } catch (err) {
                      setError(errorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Prikaži profil stranke
                </button>
              )}
            </article>
          ))}
          {clientProfile && (
            <article className="recipient-box">
              <h3>Profil povezane stranke</h3>
              <p>
                {clientProfile.ime} {clientProfile.priimek}
              </p>
              <p>{clientProfile.email}</p>
            </article>
          )}
        </section>
      </div>
      <p className="page-note">
        Povabila so prikazana znotraj aplikacije. Vsak uporabnik vidi samo svoje povezave.
      </p>
    </>
  );
}
