// Samo normalizacija zaupanja vredne vloge iz profila za prikaz in API kontekst.
// Dovoljenja pri pisanju neodvisno preverijo tudi SQL funkcije.
export function applicationRole(value: string | null | undefined): string {
  const role = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return (
    ({ client: 'stranka', trainer: 'trener', admin: 'administrator' } as Record<string, string>)[
      role
    ] ?? role
  );
}
