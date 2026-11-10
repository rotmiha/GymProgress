import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';
import type { Program, WorkoutSession, WorkoutSet } from './types';

function SetForm({
  value,
  busy,
  save,
  cancel,
}: {
  value?: WorkoutSet;
  busy: boolean;
  save: (reps: number, weight: number) => Promise<boolean>;
  cancel?: () => void;
}) {
  const [reps, setReps] = useState(value ? String(value.reps) : '');
  const [weight, setWeight] = useState(value ? String(value.weight_kg) : '');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await save(Number(reps), Number(weight))) {
      if (!value) {
        setReps('');
        setWeight('');
      }
    }
  }
  const prefix = value?.id ?? 'new';
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <div className="field-row">
          <div>
            <label htmlFor={`reps-${prefix}`}>Ponovitve</label>
            <input
              id={`reps-${prefix}`}
              required
              type="number"
              min={1}
              max={10000}
              step={1}
              value={reps}
              onChange={(event) => setReps(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`weight-${prefix}`}>Teža (kg)</label>
            <input
              id={`weight-${prefix}`}
              required
              type="number"
              min={0}
              max={100000}
              step="0.001"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </div>
        </div>
        <div className="actions">
          <button>{value ? 'Shrani spremembo serije' : 'Dodaj serijo'}</button>
          {cancel && (
            <button type="button" className="secondary" onClick={cancel}>
              Prekliči
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

export function Workouts({ api }: { api: Api }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [program, setProgram] = useState('');
  const [active, setActive] = useState('');
  const [editing, setEditing] = useState('');
  const [position, setPosition] = useState(1);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    const [nextPrograms, nextSessions] = await Promise.all([
      api<Program[]>('/programs'),
      api<WorkoutSession[]>('/sessions'),
    ]);
    setPrograms(nextPrograms);
    setSessions(nextSessions);
  }
  useEffect(() => {
    void load().catch((err) => setError(errorMessage(err)));
  }, [api]);
  const workout = sessions.find((item) => item.id === active);
  const exercise = workout?.program_snapshot.find((item) => item.position === position);
  async function mutate(action: () => Promise<unknown>) {
    if (busy) return false;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function start(event: FormEvent) {
    event.preventDefault();
    await mutate(async () => {
      const id = await api<string>('/sessions', 'POST', {
        program_id: program,
        request_id: requestId,
      });
      setActive(id);
      setPosition(1);
      setEditing('');
      setRequestId(crypto.randomUUID());
    });
  }
  async function save(reps: number, weight_kg: number, value?: WorkoutSet) {
    if (
      !workout ||
      !Number.isInteger(reps) ||
      reps < 1 ||
      reps > 10000 ||
      !Number.isFinite(weight_kg) ||
      weight_kg < 0 ||
      weight_kg > 100000
    ) {
      setError('Vnesite pozitivno celo število ponovitev in nenegativno težo v kg.');
      return false;
    }
    return mutate(async () => {
      await api(
        `/sessions/${workout.id}/sets${value ? `/${value.id}` : ''}`,
        value ? 'PUT' : 'POST',
        { exercise_position: position, reps, weight_kg },
      );
      setEditing('');
    });
  }
  return (
    <div>
      <h2>Moji treningi</h2>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <button className="secondary" disabled={busy} onClick={() => void mutate(async () => {})}>
        Osveži treninge
      </button>
      <form onSubmit={start}>
        <fieldset disabled={busy}>
          <div>
            <label htmlFor="workout-program">Program za trening</label>
            <select
              id="workout-program"
              required
              value={program}
              onChange={(event) => {
                setProgram(event.target.value);
                setRequestId(crypto.randomUUID());
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
          <button disabled={!program}>Začni trening</button>
        </fieldset>
      </form>
      {!sessions.length && <p>Ni začetih treningov.</p>}
      {sessions.map((item) => (
        <article key={item.id}>
          <h3>{item.program_name}</h3>
          <p>
            {new Date(item.started_at).toLocaleString('sl-SI')} —{' '}
            {item.completed_at ? 'Zaključen' : 'V teku'}
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setActive(item.id);
              setPosition(1);
              setEditing('');
              setError('');
            }}
          >
            Odpri trening
          </button>
        </article>
      ))}
      {workout && (
        <article aria-label="Izbrani trening">
          <h3>{workout.program_name}</h3>
          {workout.completed_at && (
            <p>
              Zaključeno: {new Date(workout.completed_at).toLocaleString('sl-SI')}. Skupni volumen:{' '}
              {workout.total_volume_kg} kg.
            </p>
          )}
          <ol>
            {workout.program_snapshot.map((item) => (
              <li key={item.position}>
                {item.name}: načrt {item.target_sets} × {item.target_reps}
              </li>
            ))}
          </ol>
          <label htmlFor="workout-exercise">Vaja</label>
          <select
            id="workout-exercise"
            value={position}
            disabled={busy}
            onChange={(event) => {
              setPosition(Number(event.target.value));
              setEditing('');
            }}
          >
            {workout.program_snapshot.map((item) => (
              <option key={item.position} value={item.position}>
                {item.position}. {item.name}
              </option>
            ))}
          </select>
          {exercise && <h3>Opravljene serije — {exercise.name}</h3>}
          {workout.workout_sets
            .filter((item) => item.exercise_position === position)
            .sort((a, b) => a.set_number - b.set_number)
            .map((item) => (
              <article key={item.id}>
                <p>
                  Serija {item.set_number}: {item.reps} ponovitev × {item.weight_kg} kg
                </p>
                {!workout.completed_at &&
                  (editing === item.id ? (
                    <SetForm
                      key={item.id}
                      value={item}
                      busy={busy}
                      save={(reps, weight) => save(reps, weight, item)}
                      cancel={() => setEditing('')}
                    />
                  ) : (
                    <div className="actions">
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => setEditing(item.id)}
                      >
                        Uredi serijo {item.set_number}
                      </button>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() =>
                          void mutate(() =>
                            api(`/sessions/${workout.id}/sets/${item.id}`, 'DELETE'),
                          )
                        }
                      >
                        Izbriši serijo {item.set_number}
                      </button>
                    </div>
                  ))}
              </article>
            ))}
          {!workout.completed_at && (
            <SetForm
              key={`${workout.id}-${position}`}
              busy={busy}
              save={(reps, weight) => save(reps, weight)}
            />
          )}
          {!workout.completed_at && (
            <button
              disabled={busy || workout.workout_sets.length === 0}
              onClick={() =>
                void mutate(async () => {
                  const result = await api<WorkoutSession>(
                    `/sessions/${workout.id}/complete`,
                    'POST',
                  );
                  setNotice(`Trening je zaključen. Skupni volumen: ${result.total_volume_kg} kg.`);
                  setEditing('');
                })
              }
            >
              Zaključi trening
            </button>
          )}
        </article>
      )}
    </div>
  );
}
