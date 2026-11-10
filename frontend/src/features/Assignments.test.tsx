// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { Assignments } from './Assignments';
import type { Api } from './api';

afterEach(cleanup);
it('pred dodelitvijo zahteva pregled programa in prejemnika', async () => {
  const api = vi.fn(async (path: string, method = 'GET') => {
    if (method === 'POST') return 'assignment';
    if (path === '/programs')
      return [
        {
          id: 'program',
          owner_id: 'trainer',
          name: 'Moč',
          program_exercises: [
            { id: 'exercise', exercises: { name: 'Počep' }, target_sets: 3, target_reps: 10 },
          ],
        },
      ];
    if (path === '/connections')
      return [
        {
          id: 'a',
          client_id: 'client',
          status: 'accepted',
          ime: 'Ana',
          priimek: 'Novak',
          email: 'ana@example.com',
        },
        {
          id: 'b',
          client_id: 'pending',
          status: 'pending',
          ime: 'Čakajoča',
          email: 'pending@example.com',
        },
      ];
    return [];
  });
  render(<Assignments api={api as Api} role="trener" userId="trainer" />);
  await screen.findByRole('option', { name: 'Moč' });
  expect(screen.queryByRole('option', { name: /Čakajoča/ })).toBeNull();
  fireEvent.change(screen.getByLabelText('Lasten program'), { target: { value: 'program' } });
  fireEvent.change(screen.getByLabelText('Potrjeno povezana stranka'), {
    target: { value: 'client' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Preglej dodelitev' }));
  expect(screen.getByText(/Prejemnik: Ana Novak/)).toBeInTheDocument();
  expect(screen.getByText(/Počep — 3 × 10/)).toBeInTheDocument();
  expect(api.mock.calls.some(([, method]) => method === 'POST')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Potrdi dodelitev' }));
  await screen.findByText('Program je dodeljen stranki.');
  expect(api).toHaveBeenCalledWith('/assignments', 'POST', {
    program_id: 'program',
    trainee_id: 'client',
  });
});
