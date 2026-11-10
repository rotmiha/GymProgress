# Popravek dodelitve in prikaza programa v obstoječi bazi

Refs #9, #10

Dodelitev je v starejši tabeli brez `UNIQUE(program_id, trainee_id)` vračala
`42P10`. Funkcija zdaj najprej preveri obstoječo dodelitev in jo po potrebi
ustvari pod zaklepom programa. Ponovitve zahteve ne ustvarijo dvojnikov,
obstoječi zapisi pa ostanejo ohranjeni.

Migracija 0010 obnovi tudi politike za branje dodelitev, programov in njihovih
vaj. Stranka lahko vidi svoj dodeljeni program in iz njega začne lasten trening;
drug račun ga ne vidi. Vsa pisanja ostanejo omejena na preverjene SQL funkcije.

Regresijski test najprej reproducira točno napako 42P10 na stari shemi, nato
preveri ponovljivost popravka, ohranitev zapisov, idempotentnost, prikaz pri
prejemniku in zavrnitev tujih dostopov. Uporabnik je potrdil delovanje dodelitve
in prikaza tudi na svojem Supabase projektu. Potrebna je izvedba migracije 0010.
