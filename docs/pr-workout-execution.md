# Popravek izvedbe treninga v obstoječi bazi

Refs #11, #12, #13, #14, #15, #16

Začetek treninga je na starejši shemi brez program_name in program_snapshot
vračal 42703. Migracija 0011 doda manjkajoče stolpce in exercise_position pri
serijah ter obnovi tok začetka, zapisa, urejanja, brisanja in zaključka treninga.
Nastavi privzete vrednosti in preverjena bralna dovoljenja. Ostanejo preverjanje
aktivne seje, lastništva ter potrjene povezave za trenerjev bralni dostop.

Obstoječi treningi, opravljene serije in rezultati se ohranijo. Manjkajoči stari
posnetki se obnovijo iz trenutnega programa in so izrecno označeni; obstoječi
posnetki se ne prepisujejo. Ponovitev migracije in začetka je varna. Številčenje
serij podpira tudi staro omejitev po exercise_id pri ponovitvi iste vaje v programu.

V razvoju API napake pokažejo še kodo. Produkcija ohrani uporabniško sporočilo.
Regresijski testi najprej reproducirajo 42703 na stari shemi, nato preverijo
ohranitev zapisov, celoten tok do zaključka z volumnom 262,5 kg, idempotentnost,
ohranitev posnetkov ob ponovni migraciji in zavrnitev tujih dostopov.

Preverjanje: `npm test`, `npm run build`, `npm run format:check`.
Za obstoječ Supabase projekt je treba izvesti celotno migracijo 0011.
