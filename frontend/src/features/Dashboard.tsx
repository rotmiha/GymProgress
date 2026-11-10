import { useMemo } from 'react';
import { createApi } from './api';
import { Programs } from './Programs';

export function Dashboard({ token, userId }: { token: string; userId: string; role: string }) {
  const api = useMemo(() => createApi(token), [token]);
  return (
    <div className="dashboard">
      <Programs api={api} userId={userId} />
    </div>
  );
}
