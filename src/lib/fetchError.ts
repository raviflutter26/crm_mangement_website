/**
 * Turns an axios failure into something a user can act on.
 *
 * These pages used to swallow every rejection with `.catch(() => ({ data: { data: [] } }))`,
 * which made a 403, a missing route and a genuinely empty table look identical —
 * the page just rendered "no records". Callers should surface the result of this
 * helper instead, so a broken request is distinguishable from an empty one.
 */
export interface FetchError {
    message: string;
    status?: number;
    /** True when retrying might plausibly succeed (network blip, 5xx). */
    retryable: boolean;
}

/** The parts of an axios-style rejection these helpers read. */
interface ErrorLike {
    message?: unknown;
    response?: { status?: number; data?: { message?: unknown; code?: unknown } };
}

const asErrorLike = (err: unknown): ErrorLike | undefined =>
    err && typeof err === 'object' ? (err as ErrorLike) : undefined;

/** The API's own `message` for a failed request, if it sent one. */
export function apiMessage(err: unknown): string | undefined {
    const m = asErrorLike(err)?.response?.data?.message;
    return typeof m === 'string' && m ? m : undefined;
}

/** HTTP status of a failed request (undefined when there was no response). */
export function errorStatus(err: unknown): number | undefined {
    return asErrorLike(err)?.response?.status;
}

/** The API's machine-readable `code` (e.g. "SSO_REQUIRED"), if any. */
export function errorCode(err: unknown): string | undefined {
    const c = asErrorLike(err)?.response?.data?.code;
    return typeof c === 'string' ? c : undefined;
}

/**
 * Text for a caught error: the API's message, else (when `useRaw` is set) the
 * Error's own message, else `fallback`. Replaces the old
 * `catch (err: any) { err.response?.data?.message || "…" }` pattern without
 * changing what the user sees.
 */
export function errorMessage(err: unknown, fallback = 'Something went wrong.', useRaw = false): string {
    const server = apiMessage(err);
    if (server) return server;
    if (useRaw) {
        const raw = asErrorLike(err)?.message;
        if (typeof raw === 'string' && raw) return raw;
    }
    return fallback;
}

export function describeError(err: unknown): FetchError {
    const e = asErrorLike(err);
    const status = e?.response?.status;
    const serverMessage = apiMessage(err);

    // No response at all — the API is unreachable. In this project that is very
    // often the dev tunnel in NEXT_PUBLIC_API_BASE_URL having expired.
    if (!e?.response) {
        return {
            message: 'Could not reach the server. Check that the API is running and that NEXT_PUBLIC_API_BASE_URL is still valid.',
            retryable: true,
        };
    }

    switch (status) {
        case 400:
            return { message: serverMessage || 'The server rejected this request.', status, retryable: false };
        case 401:
            return { message: 'Your session has expired. Please sign in again.', status, retryable: false };
        case 403:
            return {
                message: serverMessage || 'Your role does not have access to this data.',
                status,
                retryable: false,
            };
        case 404:
            return {
                message: serverMessage || 'This endpoint does not exist on the server.',
                status,
                retryable: false,
            };
        default:
            if (status && status >= 500) {
                return { message: serverMessage || 'The server ran into an error.', status, retryable: true };
            }
            return {
                message: serverMessage || (typeof e?.message === 'string' && e.message) || 'Something went wrong.',
                status,
                retryable: true,
            };
    }
}

/**
 * Runs several requests together without letting one failure hide the others.
 *
 * Returns each settled value alongside the errors that occurred, so a page can
 * render the parts that loaded and still tell the user what didn't.
 */
export async function settleAll<T extends readonly Promise<unknown>[]>(
    promises: T
): Promise<{ results: unknown[]; errors: FetchError[] }> {
    const settled = await Promise.allSettled(promises);
    const results: unknown[] = [];
    const errors: FetchError[] = [];

    for (const s of settled) {
        if (s.status === 'fulfilled') {
            results.push(s.value);
        } else {
            results.push(null);
            errors.push(describeError(s.reason));
        }
    }
    return { results, errors };
}

/** Convenience for the common `res.data.data` shape, tolerant of a null result. */
export function unwrap<T = unknown>(res: unknown, fallback: T): T {
    const data = (res as { data?: { data?: T } } | null | undefined)?.data?.data;
    return (data ?? fallback) as T;
}
