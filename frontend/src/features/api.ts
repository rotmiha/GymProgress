export class ApiError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

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
    if (!response.ok) throw new ApiError(data.error ?? 'Zahteva ni uspela.', data.code);
    return data as T;
  };
}
export type Api = ReturnType<typeof createApi>;
export function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return 'Preverite povezavo in poskusite znova.';
  if (
    import.meta.env.DEV &&
    error instanceof ApiError &&
    error.code &&
    /^[A-Z0-9_]+$/.test(error.code)
  ) {
    return `${error.message} (koda: ${error.code})`;
  }
  return error.message;
}
