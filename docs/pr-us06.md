# US-06 – zaključek treninga in skupni volumen

Closes #13
Closes #14

Lastnik zaključi trening z vsaj eno serijo ter vidi čas zaključka in skupni
volumen, izračunan kot vsota ponovitve × teža. Ponovitev zahteve vrne isti
rezultat. Po zaključku treninga ni več mogoče spreminjati serij.

Migracija 0007 zaklene uporabnika in trening, zato zaključek poteka atomarno.
Dodana je tudi podpora ws za Supabase odjemalec na Node.js 20: prej je ustvarjanje
odjemalca brez native WebSocket povzročilo napako pri nalaganju profila.
README pojasni uporabo bcrypt v Supabase Auth; gesel aplikacija ne shranjuje sama.

Veja izhaja iz main po združitvi US-05. Preverjanje: 45 uspešnih testov,
vključno z dejansko inicializacijo odjemalca, decimalnim volumnom,
idempotentnostjo zaključka, zavrnitvijo tujih zahtev, zaklepanjem serij in
posredovanjem istega uporabniškega žetona podatkovnemu API-ju.
`npm run build` preveri frontend in backend. Gostovani Supabase še ni preverjen.
