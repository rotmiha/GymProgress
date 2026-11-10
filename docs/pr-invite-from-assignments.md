# Povabilo stranki z e-naslovom pri dodelitvah

Refs #7, #8, #9

Trener lahko v zavihku Dodelitve poleg izbire potrjene stranke vnese e-naslov
obstoječega računa in pošlje povabilo. Obrazec uporablja obstoječi API za povezave
in pojasni, da mora stranka pred dodelitvijo povabilo sprejeti v zavihku Povezave.
Po uspešnem pošiljanju se polje izprazni; napake se prikažejo v obrazcu.

Seznam za dodelitev še vedno vsebuje samo potrjene povezave. Povabilo samo po
sebi ne dodeli programa in ne omogoči dostopa do strankinih podatkov.

Preverjanje: vseh šest Playwright scenarijev, vključno z vnosom e-naslova,
preverjanjem POST /connections in onemogočeno dodelitvijo brez izbrane potrjene
stranke; `npm run build` in `npm run format:check`.
