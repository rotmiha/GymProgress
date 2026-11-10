export function createApi(token: string) {
  return async function api<T>(path: string, method = 'GET', payload?: unknown): Promise<T> {
    const response = await fetch(`/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Zahteva ni uspela.');
    return data as T;
  };
}
export type Api = ReturnType<typeof createApi>;
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Preverite povezavo in poskusite znova.';
