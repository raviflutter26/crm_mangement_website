import { describeError } from "./fetchError";

/**
 * Should this failure end the user's session?
 *
 * Only a definitive answer from the server counts. A network error or a 5xx
 * means we could not ask, and the token may well still be valid — clearing it
 * then logs people out over an API restart, a sleeping laptop, or the frontend
 * simply booting a few seconds before the backend.
 *
 * Extracted from auth.tsx so this rule is testable on its own; it is the kind
 * of condition that gets "simplified" back into `catch (err) { logout() }`.
 */
export function isSessionRejected(err: unknown): boolean {
    const { status } = describeError(err);
    return status === 401 || status === 403;
}
