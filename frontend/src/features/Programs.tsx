import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';
import type { Exercise, Program, ProgramExercise } from './types';

export function Programs({ api, userId }: { api: Api; userId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ProgramExercise[]>([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    const [nextPrograms, nextCatalog] = await Promise.all([
      api<Program[]>('/programs'),
      api<Exercise[]>('/exercises'),
    ]);
    setPrograms(nextPrograms);
    setCatalog(nextCatalog);
  }
  useEffect(() => {
    void load().catch((err) => setError(errorMessage(err)));
  }, [api]);
  function move(index: number, offset: number) {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    setItems(next);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (
      !name.trim() ||
      !items.length ||
      items.some(
        (item) =>
          !Number.isInteger(item.target_sets) ||
          item.target_sets < 1 ||
          item.target_sets > 100 ||
          !Number.isInteger(item.target_reps) ||
          item.target_reps < 1 ||
          item.target_reps > 1000,
      )
    ) {
      setError('Vnesite ime, vsaj eno vajo ter pozitivna cela števila serij in ponovitev.');
      return;
    }
    setBusy(true);
    try {
      await api(editing ? `/programs/${editing}` : '/programs', editing ? 'PUT' : 'POST', {
        name,
        description,
        exercises: items.map(({ exercise_id, target_sets, target_reps }) => ({
          exercise_id,
          target_sets,
          target_reps,
        })),
      });
      setEditing(null);
      setName('');
      setDescription('');
      setItems([]);
      await load();
      setNotice('Program je shranjen.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <h2>Programi treninga</h2>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <button
        className="secondary"
        onClick={() => {
          setError('');
          void load().catch((err) => setError(errorMessage(err)));
        }}
      >
        Osveži programe
      </button>
      {programs.length === 0 && <p>Ni shranjenih programov.</p>}
      <div className="cards">
        {programs.map((program) => (
          <article key={program.id}>
            <h3>{program.name}</h3>
            <p>{program.description}</p>
            <ol>
              {[...program.program_exercises]
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((item) => (
                  <li key={item.id}>
                    {item.exercises?.name} — {item.target_sets} × {item.target_reps}
                  </li>
                ))}
            </ol>
            {program.owner_id === userId && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setEditing(program.id);
                  setName(program.name);
                  setDescription(program.description);
                  setItems(
                    [...program.program_exercises].sort(
                      (a, b) => (a.position ?? 0) - (b.position ?? 0),
                    ),
                  );
                  setError('');
                  setNotice('');
                }}
              >
                Uredi {program.name}
              </button>
            )}
          </article>
        ))}
      </div>
      <h2>{editing ? 'Urejanje programa' : 'Nov program'}</h2>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <div>
            <label htmlFor="program-name">Ime programa</label>
            <input
              id="program-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="program-description">Opis</label>
            <textarea
              id="program-description"
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="catalog">Katalog vaj</label>
            <select
              id="catalog"
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
            >
              <option value="">Izberite vajo</option>
              {catalog.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.muscle_group})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="secondary"
              disabled={!selected}
              onClick={() =>
                setItems([...items, { exercise_id: selected, target_sets: 3, target_reps: 10 }])
              }
            >
              Dodaj vajo
            </button>
          </div>
          {items.map((item, index) => (
            <article key={index}>
              <h3>
                {index + 1}. {catalog.find((exercise) => exercise.id === item.exercise_id)?.name}
              </h3>
              <div className="field-row">
                <div>
                  <label htmlFor={`sets-${index}`}>Serije</label>
                  <input
                    id={`sets-${index}`}
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    required
                    value={item.target_sets}
                    onChange={(event) =>
                      setItems(
                        items.map((value, i) =>
                          i === index
                            ? { ...value, target_sets: Number(event.target.value) }
                            : value,
                        ),
                      )
                    }
                  />
                </div>
                <div>
                  <label htmlFor={`reps-${index}`}>Ponovitve</label>
                  <input
                    id={`reps-${index}`}
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    required
                    value={item.target_reps}
                    onChange={(event) =>
                      setItems(
                        items.map((value, i) =>
                          i === index
                            ? { ...value, target_reps: Number(event.target.value) }
                            : value,
                        ),
                      )
                    }
                  />
                </div>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label={`Premakni vajo ${index + 1} gor`}
                >
                  Gor
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Premakni vajo ${index + 1} dol`}
                >
                  Dol
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  Odstrani
                </button>
              </div>
            </article>
          ))}
          <div className="actions">
            <button type="submit">{busy ? 'Shranjevanje …' : 'Shrani program'}</button>
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditing(null);
                  setName('');
                  setDescription('');
                  setItems([]);
                }}
              >
                Prekliči urejanje
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
}
