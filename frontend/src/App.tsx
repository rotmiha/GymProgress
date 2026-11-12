import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { authError, validateCredentials } from './validation';

type Profile = { id: string; email: string; ime: string | null; priimek: string | null; role: 'stranka' | 'trener' | 'administrator'; created_at: string };

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [register, setRegister] = useState(false);
  const [ime, setIme] = useState('');
  const [priimek, setPriimek] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    setProfile(null);
    setError('');
    void (async () => {
      try {
        const response = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'Profila ni mogoče naložiti.');
        if (!controller.signal.aborted) setProfile(body);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Profila ni mogoče naložiti.');
      }
    })();
    return () => controller.abort();
  }, [session, reload]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy) return;
    setError(''); setNotice('');
    const invalid = validateCredentials(email, password, register ? role : undefined);
    if (invalid) { setError(invalid); return; }
    if (register && (!ime.trim() || !priimek.trim())) {
      setError('Vnesite ime in priimek.'); return;
    }
    if (register && (ime.trim().length > 100 || priimek.trim().length > 100)) {
      setError('Ime in priimek lahko vsebujeta največ 100 znakov.'); return;
    }
    setBusy(true);
    try {
      if (register) {

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { role, ime: ime.trim(), priimek: priimek.trim() }, emailRedirectTo: window.location.origin },
        });
        
        if (error) { setError(authError(error.code)); return; }
        setPassword('');
        if (!data.session) setNotice('Če je registracija mogoča, boste prejeli povezavo za potrditev e-naslova. Nato se prijavite.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) { setError(authError(error.code)); return; }
        setPassword('');
      }
    } catch { setError(authError()); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!supabase || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) { setError('Odjava ni uspela. Preverite povezavo in poskusite znova.'); return; }
      setProfile(null); setSession(null); setPassword('');
      setNotice('Uspešno ste se odjavili.');
    } catch { setError('Odjava ni uspela. Poskusite znova.'); }
    finally { setBusy(false); }
  }

  return <main>
    <section aria-label="Uporabniški račun">
      <p>GymProgress</p>
      <h1>{session ? 'Moj račun' : register ? 'Ustvarite račun' : 'Dobrodošli nazaj'}</h1>
      {!supabase ? <p role="alert">Za zagon nastavite Supabase v datoteki frontend/.env po navodilih README.</p>
        : !ready ? <p role="status">Preverjanje seje …</p> : <>
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          {session ? <>
            {profile ? <dl><dt>Ime</dt><dd>{profile.ime || '—'}</dd><dt>Priimek</dt><dd>{profile.priimek || '—'}</dd><dt>E-naslov</dt><dd>{profile.email}</dd><dt>Vloga</dt><dd>{profile.role}</dd></dl>
              : error ? <button onClick={() => setReload(value => value + 1)}>Ponovno naloži profil</button>
                : <p role="status">Nalaganje profila …</p>}
            <button onClick={signOut} disabled={busy}>{busy ? 'Odjava …' : 'Odjava'}</button>
          </> : <>
            <p>{register ? 'Izberite vlogo in začnite z lastnim računom.' : 'Prijavite se za varen dostop do svojih podatkov.'}</p>
            <form onSubmit={submit} noValidate>
              {register && <>
                <div>
                  <label htmlFor="ime">Ime</label>
                  <input id="ime" autoComplete="given-name" required maxLength={100} value={ime} onChange={event => setIme(event.target.value)} disabled={busy} />
                </div>
                <div>
                  <label htmlFor="priimek">Priimek</label>
                  <input id="priimek" autoComplete="family-name" required maxLength={100} value={priimek} onChange={event => setPriimek(event.target.value)} disabled={busy} />
                </div>
              </>}
              <div>
              <label htmlFor="email">E-naslov</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
              </div>
              <div>
              <label htmlFor="password">Geslo</label>
              <input id="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} aria-describedby="password-help" />
              <small id="password-help">Najmanj 8 znakov.</small>
              </div>
              {register && <div><label htmlFor="role">Vloga</label>
                <select id="role" required value={role} onChange={event => setRole(event.target.value)} disabled={busy}>
                  <option value="">Izberite vlogo</option><option value="stranka">Stranka</option><option value="trener">Trener</option>
                </select></div>}
              <button type="submit" disabled={busy}>{busy ? 'Počakajte …' : register ? 'Registracija' : 'Prijava'}</button>
            </form>
            <button disabled={busy} onClick={() => { setRegister(!register); setPassword(''); setError(''); setNotice(''); }}>
              {register ? 'Že imate račun? Prijavite se' : 'Nimate računa? Registrirajte se'}
            </button>
          </>}
        </>}
    </section>
  </main>;
}
