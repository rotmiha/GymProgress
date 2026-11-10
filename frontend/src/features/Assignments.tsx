import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';
import { PageHeading } from './PageHeading';
import type { Program } from './types';
import type { Connection } from './Connections';

type Assignment = {
  id: string;
  trainee_id: string;
  assigned_at: string;
  workout_programs: Program | null;
};

export function Assignments({ api, role, userId }: { api: Api; role: string; userId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [clients, setClients] = useState<Connection[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [program, setProgram] = useState('');
  const [client, setClient] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const trainer = role === 'trener';

  async function load() {
    const [nextPrograms, nextClients, nextAssignments] = await Promise.all([
      trainer ? api<Program[]>('/programs') : Promise.resolve([]),
      trainer ? api<Connection[]>('/connections') : Promise.resolve([]),
      api<Assignment[]>('/assignments'),
    ]);
    setPrograms(nextPrograms.filter((item) => item.owner_id === userId));
    setClients(nextClients.filter((item) => item.status === 'accepted'));
    setAssignments(nextAssignments);
  }
  useEffect(() => {
    setLoading(true);
    void load()
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [api, userId, role]);

  const selectedProgram = programs.find((item) => item.id === program);
  const selectedClient = clients.find((item) => item.client_id === client);
  const exercises = [...(selectedProgram?.program_exercises ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  async function assign() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api('/assignments', 'POST', { program_id: program, trainee_id: client });
      setConfirm(false);
      await load();
      setNotice('Program je dodeljen stranki.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  function preview(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setConfirm(true);
  }

  return (
    <>
      <PageHeading
        title={trainer ? 'Dodeli program stranki' : 'Dodeljeni programi'}
        description={
          trainer
            ? 'Izberi potrjeno povezano stranko in enega od svojih shranjenih programov.'
            : 'Programi, ki ti jih je dodelil tvoj trener.'
        }
      />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading && <p role="status">Nalaganje dodelitev …</p>}
      {trainer && (
        <div className="panel-grid assignment-layout">
          <section className="panel">
            <h2>Izbira dodelitve</h2>
            <form onSubmit={preview}>
              <fieldset disabled={busy}>
                <div>
                  <label htmlFor="assign-client">Potrjeno povezana stranka</label>
                  <select
                    id="assign-client"
                    required
                    value={client}
                    onChange={(event) => {
                      setClient(event.target.value);
                      setConfirm(false);
                    }}
                  >
                    <option value="">Izberite stranko</option>
                    {clients.map((item) => (
                      <option key={item.id} value={item.client_id}>
                        {item.ime} {item.priimek} ({item.email})
                      </option>
                    ))}
                  </select>
                  {selectedClient && <span className="status-badge">Potrjena povezava</span>}
                </div>
                <div>
                  <label htmlFor="assign-program">Lasten program</label>
                  <select
                    id="assign-program"
                    required
                    value={program}
                    onChange={(event) => {
                      setProgram(event.target.value);
                      setConfirm(false);
                    }}
                  >
                    <option value="">Izberite program</option>
                    {programs.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="panel-note">
                  Prikazane so samo potrjeno povezane stranke in programi v tvoji lasti.
                </p>
                <p className="muted">Prejemnik bo lahko iz programa začel svoj trening.</p>
                <button type="submit" disabled={!selectedProgram || !selectedClient}>
                  Preglej dodelitev
                </button>
              </fieldset>
            </form>
          </section>
          <section className="panel preview-panel" aria-label="Pregled dodelitve">
            <h2>Pregled pred dodelitvijo</h2>
            {selectedProgram ? (
              <>
                <h3 className="preview-title">{selectedProgram.name}</h3>
                <p className="muted">
                  {exercises.length} vaj ·{' '}
                  {exercises.reduce((total, item) => total + item.target_sets, 0)} načrtovanih serij
                </p>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Vaja</th>
                        <th scope="col">Serije</th>
                        <th scope="col">Ponovitve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercises.map((item, index) => (
                        <tr key={item.id}>
                          <td>
                            {index + 1}. {item.exercises?.name}
                          </td>
                          <td>{item.target_sets}</td>
                          <td>{item.target_reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="empty-state">
                Izberi program za pregled njegovih vaj, serij in ponovitev.
              </p>
            )}
            <div className="recipient-box">
              {selectedClient ? (
                <>
                  <strong>
                    Prejemnik: {selectedClient.ime} {selectedClient.priimek}
                  </strong>
                  <p>{selectedClient.email} · potrjena povezava</p>
                </>
              ) : (
                <p className="muted">Izberi potrjeno povezano stranko.</p>
              )}
            </div>
            {confirm && selectedProgram && selectedClient && (
              <div className="form-footer">
                <button className="secondary" disabled={busy} onClick={() => setConfirm(false)}>
                  Prekliči
                </button>
                <button disabled={busy} onClick={() => void assign()}>
                  {busy ? 'Dodeljevanje …' : 'Potrdi dodelitev'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
      <section className="panel saved-programs">
        <header className="panel-heading">
          <h2>{trainer ? 'Dodeljeni programi strankam' : 'Moji dodeljeni programi'}</h2>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setError('');
              void load().catch((err) => setError(errorMessage(err)));
            }}
          >
            Osveži dodelitve
          </button>
        </header>
        {!assignments.length && !loading && <p className="empty-state">Ni dodeljenih programov.</p>}
        <div className="saved-grid">
          {assignments.map((item) => (
            <article key={item.id} className="saved-program">
              <h3>{item.workout_programs?.name ?? 'Program ni dostopen'}</h3>
              {trainer && (
                <p className="muted">
                  Stranka:{' '}
                  {clients.find((value) => value.client_id === item.trainee_id)?.email ??
                    item.trainee_id}
                </p>
              )}
              <ol>
                {[...(item.workout_programs?.program_exercises ?? [])]
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map((exercise) => (
                    <li key={exercise.id}>
                      {exercise.exercises?.name} — {exercise.target_sets} × {exercise.target_reps}
                    </li>
                  ))}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
