import { useEffect, useState, type FormEvent } from 'react';
import { type Api, errorMessage } from './api';
import { PageHeading } from './PageHeading';
import type { Exercise, Program, ProgramExercise } from './types';

export function Programs({ api, userId }: { api: Api; userId: string }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ProgramExercise[]>([]);
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const muscleGroups = [
    ...new Set(catalog.map((exercise) => exercise.muscle_group).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'sl'));
  const equipmentOptions = [
    ...new Set(catalog.map((exercise) => exercise.equipment).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, 'sl'));
  const filteredCatalog = catalog.filter(
    (exercise) =>
      (!muscleGroup || exercise.muscle_group === muscleGroup) &&
      (!equipment || exercise.equipment === equipment) &&
      `${exercise.name} ${exercise.muscle_group} ${exercise.equipment}`
        .toLocaleLowerCase('sl-SI')
        .includes(search.trim().toLocaleLowerCase('sl-SI')),
  );

  async function load() {
    const [nextPrograms, nextCatalog] = await Promise.allSettled([
      api<Program[]>('/programs'),
      api<Exercise[]>('/exercises'),
    ]);
    const errors: string[] = [];
    if (nextPrograms.status === 'fulfilled') setPrograms(nextPrograms.value);
    else errors.push(`Programi: ${errorMessage(nextPrograms.reason)}`);
    if (nextCatalog.status === 'fulfilled') setCatalog(nextCatalog.value);
    else errors.push(`Katalog vaj: ${errorMessage(nextCatalog.reason)}`);
    if (errors.length) throw new Error(errors.join(' '));
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void load()
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  function reset() {
    setEditing(null);
    setName('');
    setDescription('');
    setItems([]);
    setError('');
  }

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
      reset();
      await load();
      setNotice('Program je shranjen.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeading
        title={editing ? 'Uredi program' : 'Sestavi program'}
        description="Izberi vaje ter določi vrstni red, ciljne serije in ponovitve."
      />
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading && <p role="status">Nalaganje programov in kataloga …</p>}
      <div className="panel-grid program-layout">
        <aside className="panel catalog-panel" aria-label="Katalog vaj">
          <h2>Katalog vaj</h2>
          <p className="muted">Vajo dodaj v svoj program.</p>
          <label className="sr-only" htmlFor="exercise-search">
            Poišči vajo
          </label>
          <input
            id="exercise-search"
            type="search"
            placeholder="Poišči vajo …"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="catalog-filters">
            <div>
              <label htmlFor="muscle-filter">Mišična skupina</label>
              <select
                id="muscle-filter"
                value={muscleGroup}
                onChange={(event) => setMuscleGroup(event.target.value)}
              >
                <option value="">Vse skupine</option>
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="equipment-filter">Oprema</label>
              <select
                id="equipment-filter"
                value={equipment}
                onChange={(event) => setEquipment(event.target.value)}
              >
                <option value="">Vsa oprema</option>
                {equipmentOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="catalog-summary">
            <small>
              {filteredCatalog.length} od {catalog.length} vaj
            </small>
            {(search || muscleGroup || equipment) && (
              <button
                className="text-button"
                onClick={() => {
                  setSearch('');
                  setMuscleGroup('');
                  setEquipment('');
                }}
              >
                Počisti filtre
              </button>
            )}
          </div>
          <div className="catalog-list" role="region" aria-label="Seznam vaj" tabIndex={0}>
            {filteredCatalog.map((exercise) => (
              <article className="catalog-item" key={exercise.id}>
                <div>
                  <h3>{exercise.name}</h3>
                  <small>
                    {exercise.muscle_group} · {exercise.equipment}
                  </small>
                </div>
                <button
                  className="secondary"
                  disabled={busy || items.length >= 100}
                  aria-label={`Dodaj vajo ${exercise.name}`}
                  onClick={() =>
                    setItems([
                      ...items,
                      { exercise_id: exercise.id, target_sets: 3, target_reps: 10 },
                    ])
                  }
                >
                  + Dodaj
                </button>
              </article>
            ))}
            {!loading && !catalog.length && <p className="empty-state">Katalog še nima vaj.</p>}
            {!loading && catalog.length > 0 && !filteredCatalog.length && (
              <p className="empty-state">Ni vaj za izbrane filtre.</p>
            )}
          </div>
          <p className="panel-note">
            Izbor uporablja obstoječ katalog.
            <br />
            Vsak program je vezan na lastnika.
          </p>
        </aside>
        <section className="panel program-editor" aria-labelledby="program-details-title">
          <h2 id="program-details-title">Podatki programa</h2>
          <form onSubmit={save}>
            <fieldset disabled={busy}>
              <div>
                <label htmlFor="program-name">Ime programa *</label>
                <input
                  id="program-name"
                  placeholder="Npr. Moč – A"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <details className="optional-field">
                <summary>Opis programa (neobvezno)</summary>
                <label className="sr-only" htmlFor="program-description">
                  Opis programa
                </label>
                <textarea
                  id="program-description"
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </details>
              <h2>Vaje v programu</h2>
              <div className="table-scroll">
                <table className="program-table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Vaja</th>
                      <th scope="col">Serije *</th>
                      <th scope="col">Ponovitve *</th>
                      <th scope="col">Vrstni red</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!items.length && (
                      <tr>
                        <td className="empty-state" colSpan={5}>
                          Iz kataloga dodaj vsaj eno vajo.
                        </td>
                      </tr>
                    )}
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>
                            {catalog.find((exercise) => exercise.id === item.exercise_id)?.name}
                          </strong>
                        </td>
                        <td>
                          <label className="sr-only" htmlFor={`sets-${index}`}>
                            Serije za vajo {index + 1}
                          </label>
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
                        </td>
                        <td>
                          <label className="sr-only" htmlFor={`reps-${index}`}>
                            Ponovitve za vajo {index + 1}
                          </label>
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
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="secondary icon-button"
                              disabled={index === 0}
                              onClick={() => move(index, -1)}
                              aria-label={`Premakni vajo ${index + 1} gor`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="secondary icon-button"
                              disabled={index === items.length - 1}
                              onClick={() => move(index, 1)}
                              aria-label={`Premakni vajo ${index + 1} dol`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="text-button"
                              aria-label={`Odstrani vajo ${index + 1}`}
                              onClick={() => setItems(items.filter((_, i) => i !== index))}
                            >
                              Odstrani
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="program-total">
                {items.length} vaj ·{' '}
                {items.reduce(
                  (total, item) =>
                    total + (Number.isFinite(item.target_sets) ? item.target_sets : 0),
                  0,
                )}{' '}
                načrtovanih serij
              </p>
              <p className="help-text">
                * Obvezno; število serij in ponovitev mora biti pozitivno celo število.
              </p>
              <div className="form-footer">
                <button className="secondary" type="button" onClick={reset}>
                  Prekliči
                </button>
                <button type="submit">{busy ? 'Shranjevanje …' : 'Shrani program'}</button>
              </div>
            </fieldset>
          </form>
        </section>
      </div>
      <section className="panel saved-programs" aria-labelledby="saved-programs-title">
        <header className="panel-heading">
          <h2 id="saved-programs-title">Moji in dodeljeni programi</h2>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setError('');
              void load().catch((err) => setError(errorMessage(err)));
            }}
          >
            Osveži programe
          </button>
        </header>
        {!programs.length && !loading && (
          <p className="empty-state">Ni shranjenih programov. Sestavi svoj prvi program zgoraj.</p>
        )}
        <div className="saved-grid">
          {programs.map((program) => (
            <article key={program.id} className="saved-program">
              <span className="status-badge">
                {program.owner_id === userId ? 'Moj program' : 'Dodeljen program'}
              </span>
              <h3>{program.name}</h3>
              {program.description && <p>{program.description}</p>}
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Uredi {program.name}
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
      <p className="page-note">Ob neveljavnem vnosu se ostali podatki ohranijo.</p>
    </>
  );
}
