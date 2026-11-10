import { useMemo, useState } from 'react';
import { createApi } from './api';
import { Programs } from './Programs';
import { Connections } from './Connections';

export function Dashboard({
  token,
  userId,
  role,
}: {
  token: string;
  userId: string;
  role: string;
}) {
  const [tab, setTab] = useState('programs');
  const api = useMemo(() => createApi(token), [token]);
  return (
    <div className="dashboard">
      <nav aria-label="Funkcionalnosti">
        <button
          className="secondary"
          aria-pressed={tab === 'programs'}
          onClick={() => setTab('programs')}
        >
          Programi
        </button>
        <button
          className="secondary"
          aria-pressed={tab === 'connections'}
          onClick={() => setTab('connections')}
        >
          Povezave
        </button>
      </nav>
      {tab === 'programs' && <Programs api={api} userId={userId} />}
      {tab === 'connections' && <Connections api={api} role={role} />}
    </div>
  );
}
