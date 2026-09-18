import { describe, test, expect } from "vitest";
import { isSessionRejected } from "../session";

/**
 * The rule auth.tsx's checkAuth() depends on.
 *
 * A session must only be discarded when the server actually rejects it. This
 * was a real bug: any failure cleared the token, so a network blip — an API
 * restart, a sleeping laptop, or the frontend simply booting a few seconds
 * before the backend — logged the user out of a valid session.
 */
const axiosError = (status: number) => ({ response: { status, data: {} } });

describe("session retention", () => {
    test("a 401 rejects the session", () => {
        expect(isSessionRejected(axiosError(401))).toBe(true);
    });

    test("a 403 rejects the session", () => {
        expect(isSessionRejected(axiosError(403))).toBe(true);
    });

    test("a network error does NOT reject the session", () => {
        // The exact case that was logging people out.
        expect(isSessionRejected({ message: "Network Error" })).toBe(false);
    });

    test("a 500 does NOT reject the session — the server failed, the token did not", () => {
        expect(isSessionRejected(axiosError(500))).toBe(false);
    });

    test("a 502/503 during a backend restart does NOT reject the session", () => {
        expect(isSessionRejected(axiosError(502))).toBe(false);
        expect(isSessionRejected(axiosError(503))).toBe(false);
    });

    test("a 404 does NOT reject the session", () => {
        // A missing route says nothing about whether the token is good.
        expect(isSessionRejected(axiosError(404))).toBe(false);
    });

    test("a malformed rejection does not accidentally sign the user out", () => {
        for (const input of [null, undefined, {}, new Error("boom")]) {
            expect(isSessionRejected(input)).toBe(false);
        }
    });
});
