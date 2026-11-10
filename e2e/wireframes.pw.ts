import { test, expect, type Page } from '@playwright/test';

// Testni računi in odgovori so izmišljeni. Noben klic ne doseže prave baze.
async function prepare(page: Page, role: 'trener' | 'stranka' = 'trener') {
  const trainerId = '10000000-0000-0000-0000-000000000001';
  const clientId = '10000000-0000-0000-0000-000000000002';
  const profile = {
    id: role === 'trener' ? trainerId : clientId,
    ime: role === 'trener' ? 'Luka' : 'Maja',
    priimek: role === 'trener' ? 'Novak' : 'Zupan',
    email: `${role}@example.com`,
    role,
  };
  const catalog = [
    { id: 'a', name: 'Počep', muscle_group: 'Noge', equipment: 'Drog' },
    { id: 'b', name: 'Potisk s prsi', muscle_group: 'Prsi', equipment: 'Drog' },
    { id: 'c', name: 'Veslanje', muscle_group: 'Hrbet', equipment: 'Ročke' },
    { id: 'd', name: 'Mrtvi dvig', muscle_group: 'Noge / hrbet', equipment: 'Drog' },
  ];
  const programs = [
    {
      id: 'program',
      owner_id: trainerId,
      name: 'Moč – A',
      description: '',
      program_exercises: catalog.slice(0, 3).map((exercise, index) => ({
        id: `pe-${index}`,
        exercise_id: exercise.id,
        position: index + 1,
        target_sets: 3,
        target_reps: index === 1 ? 8 : 10,
        exercises: exercise,
      })),
    },
  ];
  const connections =
    role === 'trener'
      ? [
          {
            id: 'invite',
            trainer_id: trainerId,
            client_id: clientId,
            ime: 'Maja',
            priimek: 'Zupan',
            email: 'maja.zupan@example.com',
            status: 'accepted',
          },
          {
            id: 'waiting',
            trainer_id: trainerId,
            client_id: 'waiting-client',
            ime: 'Ana',
            priimek: 'Kovač',
            email: 'ana@example.com',
            status: 'pending',
          },
        ]
      : [
          {
            id: 'invite',
            trainer_id: trainerId,
            client_id: clientId,
            ime: 'Luka',
            priimek: 'Novak',
            email: 'luka.novak@example.com',
            status: 'pending',
          },
        ];
  const mutations: { path: string; method: string; payload: unknown }[] = [];
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: profile.id,
    email: profile.email,
    role: 'authenticated',
    aud: 'authenticated',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: '2026-11-10T08:00:00Z',
  };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: profile.id, role: 'authenticated', exp: expiresAt })).toString('base64url')}.test-signature`;
  await page.addInitScript(
    (session) => localStorage.setItem('sb-example-auth-token', JSON.stringify(session)),
    {
      access_token: token,
      refresh_token: 'test-refresh-token',
      expires_at: expiresAt,
      expires_in: 3600,
      token_type: 'bearer',
      user,
    },
  );
  await page.route('https://example.supabase.co/**', (route) => route.fulfill({ json: user }));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      const payload = request.postDataJSON();
      mutations.push({ path, method: request.method(), payload });
      if (path === '/api/connections/invite') connections[0].status = payload.status;
      await route.fulfill({ json: 'saved-id' });
      return;
    }
    const responses: Record<string, unknown> = {
      '/api/me': profile,
      '/api/exercises': catalog,
      '/api/programs': programs,
      '/api/connections': connections,
      '/api/assignments': [],
      '/api/sessions': [],
    };
    await route.fulfill({
      status: path in responses ? 200 : 404,
      json: responses[path] ?? { error: 'Nepričakovan testni klic.' },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sestavi program' })).toBeVisible();
  return { mutations };
}

test('WF-01: katalog, tabela, vrstni red in shranjevanje programa', async ({ page }, testInfo) => {
  const { mutations } = await prepare(page);
  await page.getByLabel('Ime programa *', { exact: true }).fill('Moč – B');
  for (const name of ['Počep', 'Potisk s prsi', 'Veslanje'])
    await page.getByRole('button', { name: `Dodaj vajo ${name}`, exact: true }).click();
  await expect(page.locator('.program-table tbody tr')).toHaveCount(3);
  await page.getByRole('button', { name: 'Premakni vajo 2 gor' }).click();
  await expect(page.locator('.program-table tbody tr').first()).toContainText('Potisk s prsi');
  await page.getByRole('button', { name: 'Premakni vajo 1 dol' }).click();
  await page.screenshot({ path: testInfo.outputPath('programs-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Shrani program', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Program je shranjen.');
  expect(mutations[0]).toMatchObject({
    path: '/api/programs',
    payload: {
      name: 'Moč – B',
      exercises: [{ exercise_id: 'a' }, { exercise_id: 'b' }, { exercise_id: 'c' }],
    },
  });
});

test('WF-03: potrjena stranka in pregled pred dodelitvijo', async ({ page }, testInfo) => {
  const { mutations } = await prepare(page);
  await page.getByRole('button', { name: 'Dodelitve', exact: true }).click();
  await page
    .getByLabel('Potrjeno povezana stranka')
    .selectOption('10000000-0000-0000-0000-000000000002');
  await page.getByLabel('Lasten program').selectOption('program');
  await expect(page.getByRole('cell', { name: '1. Počep' })).toBeVisible();
  await page.getByRole('button', { name: 'Preglej dodelitev' }).click();
  expect(mutations).toHaveLength(0);
  await page.screenshot({ path: testInfo.outputPath('assignments-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Potrdi dodelitev' }).click();
  await expect(page.getByRole('status')).toHaveText('Program je dodeljen stranki.');
  expect(mutations[0]).toMatchObject({
    path: '/api/assignments',
    payload: { program_id: 'program', trainee_id: '10000000-0000-0000-0000-000000000002' },
  });
});

test('trener povabi stranko z e-naslovom neposredno pri dodelitvah', async ({ page }) => {
  const { mutations } = await prepare(page);
  await page.getByRole('button', { name: 'Dodelitve', exact: true }).click();
  await page.getByLabel('E-naslov stranke za povabilo').fill('nova.stranka@example.com');
  await page.getByRole('button', { name: 'Pošlji povabilo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Povabilo je poslano.');
  expect(mutations).toEqual([
    { path: '/api/connections', method: 'POST', payload: { email: 'nova.stranka@example.com' } },
  ]);
  await expect(page.getByLabel('E-naslov stranke za povabilo')).toHaveValue('');
  await expect(page.getByLabel('Potrjeno povezana stranka').getByRole('option')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Preglej dodelitev' })).toBeDisabled();
});

test('WF-02: stranka vidi svoje povabilo in ga sprejme', async ({ page }, testInfo) => {
  const { mutations } = await prepare(page, 'stranka');
  await page.getByRole('button', { name: 'Povezave', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Luka Novak', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pošlji povabilo' })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('connections-client-desktop.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Sprejmi', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Povabilo je sprejeto.');
  expect(mutations[0]).toMatchObject({
    path: '/api/connections/invite',
    method: 'PATCH',
    payload: { status: 'accepted' },
  });
});

test('mobilni prikaz ostane znotraj širine zaslona', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepare(page);
  await page.getByRole('button', { name: 'Dodaj vajo Počep', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('programs-mobile.png'), fullPage: true });
});

test('filtri kataloga se kombinirajo in jih je mogoče ponastaviti', async ({ page }) => {
  await prepare(page);
  await page.getByLabel('Mišična skupina', { exact: true }).selectOption('Hrbet');
  await expect(page.getByText('1 od 4 vaj', { exact: true })).toBeVisible();
  await page.getByLabel('Oprema', { exact: true }).selectOption('Ročke');
  await page.getByLabel('Poišči vajo', { exact: true }).fill('vesla');
  await expect(page.getByText('1 od 4 vaj', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Dodaj vajo Veslanje', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dodaj vajo Počep', exact: true })).toHaveCount(0);
  await page.getByLabel('Oprema', { exact: true }).selectOption('Drog');
  await expect(page.getByText('Ni vaj za izbrane filtre.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Počisti filtre', exact: true }).click();
  await expect(page.getByText('4 od 4 vaj', { exact: true })).toBeVisible();
});
