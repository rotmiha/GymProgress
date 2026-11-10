// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { Workouts } from './Workouts';
import type { Api } from './api';
import type { WorkoutSession } from './types';

afterEach(cleanup);
it('začne trening, prikaže vaje in pošlje opravljeno serijo v kg', async () => {
  const sessions: WorkoutSession[] = [];
  const api = vi.fn(async (path: string, method = 'GET', payload?: unknown) => {
    if (path === '/programs') return [{ id: 'p', name: 'Moč' }];
    if (path === '/sessions' && method === 'GET') return [...sessions];
    if (path === '/sessions' && method === 'POST') {
      sessions.push({
        id: 's',
        trainee_id: 'a',
        program_name: 'Moč',
        started_at: '2026-11-10T10:00:00Z',
        completed_at: null,
        total_volume_kg: 0,
        program_snapshot: [
          { position: 1, exercise_id: 'e', name: 'Počep', target_sets: 3, target_reps: 10 },
        ],
        workout_sets: [],
      });
      return 's';
    }
    if (path === '/sessions/s/sets' && method === 'POST') {
      sessions[0].workout_sets.push({
        id: 'set',
        set_number: 1,
        ...(payload as { exercise_position: number; reps: number; weight_kg: number }),
      });
      return 'set';
    }
    if (path === '/sessions/s/complete' && method === 'POST') {
      sessions[0].completed_at = '2026-11-10T11:00:00Z';
      sessions[0].total_volume_kg = 100;
      return sessions[0];
    }
    return null;
  });
  render(<Workouts api={api as Api} />);
  await screen.findByRole('option', { name: 'Moč' });
  fireEvent.change(screen.getByLabelText('Program za trening'), { target: { value: 'p' } });
  fireEvent.click(screen.getByRole('button', { name: 'Začni trening' }));
  await screen.findByText('Počep: načrt 3 × 10');
  fireEvent.change(screen.getByLabelText('Ponovitve'), { target: { value: '8' } });
  fireEvent.change(screen.getByLabelText('Teža (kg)'), { target: { value: '12.5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Dodaj serijo' }));
  await screen.findByText('Serija 1: 8 ponovitev × 12.5 kg');
  expect(api).toHaveBeenCalledWith('/sessions/s/sets', 'POST', {
    exercise_position: 1,
    reps: 8,
    weight_kg: 12.5,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Zaključi trening' }));
  await screen.findByText('Trening je zaključen. Skupni volumen: 100 kg.');
  expect(screen.queryByRole('button', { name: 'Dodaj serijo' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Uredi serijo 1' })).toBeNull();
});
