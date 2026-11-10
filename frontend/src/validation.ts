export function validateCredentials(email: string, password: string, role?: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Vnesite veljaven e-naslov.';
  if (password.length < 8) return 'Geslo mora vsebovati najmanj 8 znakov.';
  if (role !== undefined && !['stranka', 'trener'].includes(role))
    return 'Izberite vlogo stranka ali trener.';
  return null;
}

export function authError(code?: string): string {
  switch (code) {
    case 'invalid_credentials':
      return 'Napačen e-naslov ali geslo.';
    case 'email_not_confirmed':
      return 'Pred prijavo potrdite e-naslov prek povezave v e-pošti.';
    case 'weak_password':
      return 'Geslo ne ustreza varnostnim zahtevam. Uporabite najmanj 8 znakov.';
    case 'user_already_exists':
      return 'Račun že obstaja. Poskusite se prijaviti.';
    case 'over_request_rate_limit':
      return 'Preveč zahtev za prijavo ali registracijo. Počakajte in poskusite znova.';
    case 'over_email_send_rate_limit':
      return 'Dosežena je omejitev pošiljanja potrditvenih e-poštnih sporočil. Počakajte in poskusite znova. Če je račun že potrjen, se prijavite.';
    default:
      return 'Zahteve ni bilo mogoče izvesti. Preverite povezavo in poskusite znova.';
  }
}
