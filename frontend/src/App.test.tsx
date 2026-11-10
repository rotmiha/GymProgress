// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  refreshSession: vi.fn(),
  callback: null as null | ((event: string, session: unknown) => void),
}));
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: typeof mocks.callback) => {
        mocks.callback = callback;
        callback?.('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signUp: mocks.signUp,
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
      refreshSession: mocks.refreshSession,
    },
  },
}));
import { App } from './App';
vi.mock('./features/Dashboard', () => ({ Dashboard: () => null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('US-01 uporabniški tok', () => {
  it('neveljavno sejo zapre in prikaže prijavni obrazec brez ponavljanja 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ error: 'Seja ni veljavna.' }),
      }),
    );
    mocks.refreshSession.mockResolvedValue({ data: { session: null }, error: { status: 401 } });
    mocks.signOut.mockImplementation(async () => {
      mocks.callback?.('SIGNED_OUT', null);
      return { error: null };
    });
    render(<App />);
    await act(() => {
      mocks.callback?.('INITIAL_SESSION', { access_token: 'expired' });
    });
    await screen.findByText('Seja je potekla ali ni več veljavna. Ponovno se prijavite.');
    expect(screen.getByRole('button', { name: 'Prijava' })).toBeInTheDocument();
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });
  it('pretečen žeton osveži enkrat in z novim naloži profil', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          id: 'a',
          ime: 'Ana',
          priimek: 'Novak',
          email: 'a@example.com',
          role: 'stranka',
        }),
      });
    vi.stubGlobal('fetch', fetch);
    mocks.refreshSession.mockResolvedValue({
      data: { session: { access_token: 'refreshed' } },
      error: null,
    });
    render(<App />);
    await act(() => {
      mocks.callback?.('INITIAL_SESSION', { access_token: 'expired' });
    });
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(mocks.refreshSession).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/me',
      expect.objectContaining({ headers: { Authorization: 'Bearer refreshed' } }),
    );
  });
  it('registrira trenerja in zahteva potrditev e-pošte', async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<App />);
    fireEvent.click(screen.getByText('Nimate računa? Registrirajte se'));
    fireEvent.change(screen.getByLabelText('Ime'), { target: { value: ' Ana ' } });
    fireEvent.change(screen.getByLabelText('Priimek'), { target: { value: ' Novak ' } });
    fireEvent.change(screen.getByLabelText('E-naslov'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Vloga'), { target: { value: 'trener' } });
    expect(screen.queryByRole('option', { name: /administrator/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Registracija' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('potrditev'));
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        options: expect.objectContaining({
          data: { role: 'trener', ime: 'Ana', priimek: 'Novak' },
        }),
      }),
    );
    expect(screen.getByLabelText('Geslo')).toHaveValue('');
  });
  it('zavrne registracijo brez imena ali priimka', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('Nimate računa? Registrirajte se'));
    fireEvent.change(screen.getByLabelText('E-naslov'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Vloga'), { target: { value: 'stranka' } });
    fireEvent.change(screen.getByLabelText('Ime'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registracija' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Vnesite ime in priimek.');
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it('prikaže napako pri napačnih prijavnih podatkih', async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials' } });
    render(<App />);
    fireEvent.change(screen.getByLabelText('E-naslov'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prijava' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Napačen e-naslov ali geslo');
  });
  it('po prijavi naloži lasten profil in ga po odjavi odstrani', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'a',
          ime: 'Ana',
          priimek: 'Novak',
          email: 'test@example.com',
          role: 'stranka',
        }),
      }),
    );
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.callback?.('SIGNED_IN', { access_token: 'valid' } as Session);
      return { error: null };
    });
    mocks.signOut.mockImplementation(async () => {
      mocks.callback?.('SIGNED_OUT', null);
      return { error: null };
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText('E-naslov'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prijava' }));
    expect(await screen.findByText('stranka')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Novak')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Odjava' }));
    await waitFor(() => expect(screen.queryByText('stranka')).toBeNull());
    expect(screen.getByRole('button', { name: 'Prijava' })).toBeInTheDocument();
  });
});
