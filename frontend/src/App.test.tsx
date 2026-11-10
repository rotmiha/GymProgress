// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(),
  callback: null as null | ((event: string, session: unknown) => void),
}));
vi.mock('./supabase', () => ({ supabase: { auth: {
  onAuthStateChange: (callback: typeof mocks.callback) => {
    mocks.callback = callback;
    callback?.('INITIAL_SESSION', null);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  },
  signUp: mocks.signUp, signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut,
} } }));
import { App } from './App';
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe('US-01 uporabniški tok', () => {
  it('registrira trenerja in zahteva potrditev e-pošte', async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    render(<App />);
    fireEvent.click(screen.getByText('Nimate računa? Registrirajte se'));
    fireEvent.change(screen.getByLabelText('E-naslov'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Vloga'), { target: { value: 'trener' } });
    expect(screen.queryByRole('option', { name: /administrator/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Registracija' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('potrditev'));
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com', options: expect.objectContaining({ data: { role: 'trener' } }) }));
    expect(screen.getByLabelText('Geslo')).toHaveValue('');
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'a', email: 'test@example.com', role: 'stranka' }) }));
    mocks.signInWithPassword.mockImplementation(async () => {
      mocks.callback?.('SIGNED_IN', { access_token: 'valid' } as Session);
      return { error: null };
    });
    mocks.signOut.mockImplementation(async () => { mocks.callback?.('SIGNED_OUT', null); return { error: null }; });
    render(<App />);
    fireEvent.change(screen.getByLabelText('E-naslov'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Geslo'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prijava' }));
    expect(await screen.findByText('stranka')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Odjava' }));
    await waitFor(() => expect(screen.queryByText('stranka')).toBeNull());
    expect(screen.getByRole('button', { name: 'Prijava' })).toBeInTheDocument();
  });
});
