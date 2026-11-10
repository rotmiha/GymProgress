// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, expect, it, vi } from 'vitest';
import { Programs } from './Programs';
import type { Api } from './api';

afterEach(cleanup);
it('prikaže dejanski katalog tudi če nalaganje programov ne uspe', async () => {
  const api = vi.fn(async (path: string) => {
    if (path === '/programs') throw new Error('Seznam programov ni dosegljiv.');
    return [{ id: 'bench', name: 'Bench Press', muscle_group: 'Prsa', equipment: 'Palica' }];
  });
  render(<Programs api={api as Api} userId="client" />);
  expect(await screen.findByRole('button', { name: 'Dodaj vajo Bench Press' })).toBeInTheDocument();
  expect(screen.getByText('Prsa · Palica')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('Seznam programov ni dosegljiv.');
});

it('kombinuje iskanje, mišično skupino in opremo nad vajami iz Supabase', async () => {
  const catalog = [
    { id: 'bench', name: 'Bench Press', muscle_group: 'Prsa', equipment: 'Palica' },
    { id: 'squat', name: 'Squat', muscle_group: 'Noge', equipment: 'Palica' },
    { id: 'curl', name: 'Leg Curl', muscle_group: 'Noge', equipment: 'Naprava' },
    { id: 'raise', name: 'Lateral Raises', muscle_group: 'Ramena', equipment: 'Ročke' },
  ];
  const api = vi.fn(async (path: string) => (path === '/programs' ? [] : catalog));
  render(<Programs api={api as Api} userId="client" />);
  await screen.findByRole('button', { name: 'Dodaj vajo Squat' });
  fireEvent.change(screen.getByLabelText('Mišična skupina'), { target: { value: 'Noge' } });
  expect(screen.getByText('2 od 4 vaj')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Dodaj vajo Bench Press' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Oprema'), { target: { value: 'Naprava' } });
  expect(screen.getByRole('button', { name: 'Dodaj vajo Leg Curl' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Dodaj vajo Squat' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Poišči vajo'), { target: { value: 'bench' } });
  expect(screen.getByText('Ni vaj za izbrane filtre.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Počisti filtre' }));
  expect(screen.getByText('4 od 4 vaj')).toBeInTheDocument();
});
