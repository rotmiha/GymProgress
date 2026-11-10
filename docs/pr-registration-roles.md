# Popravek registracije pri starejši omejitvi vlog

Refs #3, #4

Registracija je s pravilnimi podatki vrnila `unexpected_failure: Database error
saving new user`, ker sprožilec zapisuje `stranka` oziroma `trener`, obstoječa
omejitev `users_role_check` pa je dovoljevala samo `client`, `trainer` in `admin`.

Migracija 0012 v eni transakciji pretvori stare vloge v aplikacijske vloge,
uskladi omejitev in nastavi privzeto vlogo `stranka`. Identifikatorji uporabnikov,
imena, e-naslovi in povezani zapisi se ohranijo. Preverjanje dovoljene vloge ob
registraciji ostane v sprožilcu; registracija administratorja je zavrnjena.

Regresijski testi reproducirajo napako omejitve 23514 in preverijo registracijo
stranke ter trenerja, ohranitev profilov, ponovljivost migracije in zavrnitev
registracije administratorja. Diagnostični SQL samo prebere strukturo baze.

Preverjanje: `npm test` in `npm run format:check`.
V obstoječem Supabase projektu je treba izvesti celotno migracijo 0012.
