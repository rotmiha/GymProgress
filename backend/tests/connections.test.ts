import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { actor, database, ids, scalar } from './helpers/database';

describe('US-03 povabila in dovoljenja', () => {
  let db: PGlite;
  let invitation: string;
  beforeAll(async () => {
    db = await database();
  }, 30_000);
  afterAll(async () => {
    await db?.close();
  });
  it('povabilo pošlje le trener in samo obstoječi stranki', async () => {
    await actor(db, ids.client);
    await expect(db.query("select public.invite_client('other@example.com')")).rejects.toThrow(
      /dovoljenja/,
    );
    await actor(db, ids.trainer);
    await expect(db.query("select public.invite_client('missing@example.com')")).rejects.toThrow(
      /ne obstaja/,
    );
    invitation = await scalar(db, "select public.invite_client(' CLIENT@example.com ') as value");
    await expect(db.query("select public.invite_client('client@example.com')")).rejects.toThrow(
      /že obstaja/,
    );
    await expect(db.query('select public.get_client_profile($1)', [ids.client])).rejects.toThrow(
      /ni potrdila/,
    );
  });
  it('povabilo obravnava samo prejemnik in šele nato odpre profil', async () => {
    await actor(db, ids.other);
    expect(await scalar(db, 'select public.list_connections() as value')).toEqual([]);
    await expect(
      db.query("select public.respond_invitation($1, 'accepted')", [invitation]),
    ).rejects.toThrow(/ni dostopno/);
    await actor(db, ids.client);
    await db.query("select public.respond_invitation($1, 'accepted')", [invitation]);
    await actor(db, ids.trainer);
    expect(
      await scalar(db, 'select public.get_client_profile($1) as value', [ids.client]),
    ).toMatchObject({ email: 'client@example.com' });
    await actor(db, ids.stranger);
    await expect(db.query('select public.get_client_profile($1)', [ids.client])).rejects.toThrow(
      /ni potrdila/,
    );
  });
  it('zavrnitev ne omogoči dostopa; ponovno povabilo je mogoče', async () => {
    await actor(db, ids.trainer);
    const rejected = await scalar(db, "select public.invite_client('other@example.com') as value");
    await actor(db, ids.other);
    await db.query("select public.respond_invitation($1, 'rejected')", [rejected]);
    await actor(db, ids.trainer);
    await expect(db.query('select public.get_client_profile($1)', [ids.other])).rejects.toThrow(
      /ni potrdila/,
    );
    expect(await scalar(db, "select public.invite_client('other@example.com') as value")).toBe(
      rejected,
    );
    await expect(db.exec("update public.trainer_clients set status = 'accepted'")).rejects.toThrow(
      /permission denied/,
    );
  });
});
