import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';
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
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    const [nextPrograms, nextClients, nextAssignments] = await Promise.all([
      api<Program[]>('/programs'),
      api<Connection[]>('/connections'),
      api<Assignment[]>('/assignments'),
    ]);
    setPrograms(nextPrograms.filter((item) => item.owner_id === userId));
    setClients(nextClients.filter((item) => item.status === 'accepted'));
    setAssignments(nextAssignments);
  }
  useEffect(() => {
    void load().catch((err) => setError(errorMessage(err)));
  }, [api, userId]);
  const selectedProgram = programs.find((item) => item.id === program);
  const selectedClient = clients.find((item) => item.client_id === client);
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
    <div>
      <h2>{role === 'trener' ? 'Dodeljevanje programov' : 'Dodeljeni programi'}</h2>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
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
      {role === 'trener' && (
        <form onSubmit={preview}>
          <fieldset disabled={busy}>
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
            </div>
            <button type="submit" disabled={!selectedProgram || !selectedClient}>
              Preglej dodelitev
            </button>
          </fieldset>
        </form>
      )}
      {confirm && selectedProgram && selectedClient && (
        <article aria-label="Pregled dodelitve">
          <h3>{selectedProgram.name}</h3>
          <p>
            Prejemnik: {selectedClient.ime} {selectedClient.priimek} ({selectedClient.email})
          </p>
          <ol>
            {[...selectedProgram.program_exercises]
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((item) => (
                <li key={item.id}>
                  {item.exercises?.name} — {item.target_sets} × {item.target_reps}
                </li>
              ))}
          </ol>
          <div className="actions">
            <button disabled={busy} onClick={() => void assign()}>
              Potrdi dodelitev
            </button>
            <button className="secondary" disabled={busy} onClick={() => setConfirm(false)}>
              Prekliči
            </button>
          </div>
        </article>
      )}
      {!assignments.length && <p>Ni dodeljenih programov.</p>}
      {assignments.map((item) => (
        <article key={item.id}>
          <h3>{item.workout_programs?.name ?? 'Program ni dostopen'}</h3>
          {role === 'trener' && (
            <p>
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
  );
}
