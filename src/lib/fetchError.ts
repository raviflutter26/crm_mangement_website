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

export function describeError(err: any): FetchError {
    const status: number | undefined = err?.response?.status;
    const serverMessage: string | undefined = err?.response?.data?.message;

    // No response at all — the API is unreachable. In this project that is very
    // often the dev tunnel in NEXT_PUBLIC_API_BASE_URL having expired.
    if (!err?.response) {
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
            return { message: serverMessage || err?.message || 'Something went wrong.', status, retryable: true };
    }
}

/**
 * Runs several requests together without letting one failure hide the others.
 *
 * Returns each settled value alongside the errors that occurred, so a page can
 * render the parts that loaded and still tell the user what didn't.
 */
export async function settleAll<T extends readonly Promise<any>[]>(
    promises: T
): Promise<{ results: any[]; errors: FetchError[] }> {
    const settled = await Promise.allSettled(promises);
    const results: any[] = [];
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
export function unwrap<T = any>(res: any, fallback: T): T {
    return (res?.data?.data ?? fallback) as T;
}
