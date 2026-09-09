import { describe, test, expect } from "vitest";
import { describeError, settleAll, unwrap } from "../fetchError";

/** Shape of an axios rejection, which is all describeError inspects. */
const axiosError = (status: number, message?: string) => ({
    response: { status, data: message ? { message } : {} },
});

describe("describeError", () => {
    test("treats a missing response as an unreachable API and suggests the likely cause", () => {
        const e = describeError({ message: "Network Error" });
        expect(e.status).toBeUndefined();
        expect(e.retryable).toBe(true);
        // The dev tunnel in NEXT_PUBLIC_API_BASE_URL expiring is the common
        // failure here, so the message must point at it.
        expect(e.message).toMatch(/NEXT_PUBLIC_API_BASE_URL/);
    });

    test("reports 401 as an expired session and does not offer a retry", () => {
        const e = describeError(axiosError(401));
        expect(e.status).toBe(401);
        expect(e.retryable).toBe(false);
        expect(e.message).toMatch(/session/i);
    });

    test("reports 403 as a permissions problem", () => {
        expect(describeError(axiosError(403)).message).toMatch(/access|role/i);
    });

    test("reports 404 as a missing endpoint", () => {
        expect(describeError(axiosError(404)).message).toMatch(/does not exist/i);
    });

    test("prefers the server's own message when it sends one", () => {
        const e = describeError(axiosError(403, "Not authorized for this organization."));
        expect(e.message).toBe("Not authorized for this organization.");
    });

    test("marks 5xx as retryable but 4xx as not", () => {
        expect(describeError(axiosError(500)).retryable).toBe(true);
        expect(describeError(axiosError(503)).retryable).toBe(true);
        expect(describeError(axiosError(400)).retryable).toBe(false);
    });

    test("never returns an empty message, whatever it is handed", () => {
        for (const input of [null, undefined, {}, "a string", new Error("boom")]) {
            expect(describeError(input).message.length).toBeGreaterThan(0);
        }
    });
});

describe("settleAll", () => {
    test("returns every result when all succeed, and no errors", async () => {
        const { results, errors } = await settleAll([
            Promise.resolve({ data: { data: [1] } }),
            Promise.resolve({ data: { data: [2] } }),
        ]);
        expect(errors).toHaveLength(0);
        expect(results).toHaveLength(2);
    });

    test("one failure does not discard the results that succeeded", async () => {
        // This is the whole point: a partly-broken page still renders what loaded.
        const { results, errors } = await settleAll([
            Promise.resolve({ data: { data: ["kept"] } }),
            Promise.reject(axiosError(403)),
        ]);
        expect(results[0]).toEqual({ data: { data: ["kept"] } });
        expect(results[1]).toBeNull();
        expect(errors).toHaveLength(1);
        expect(errors[0].status).toBe(403);
    });

    test("keeps results positionally aligned when an earlier call fails", async () => {
        const { results } = await settleAll([
            Promise.reject(axiosError(500)),
            Promise.resolve({ data: { data: "second" } }),
        ]);
        expect(results[0]).toBeNull();
        expect(results[1]).toEqual({ data: { data: "second" } });
    });

    test("collects one error per failure", async () => {
        const { errors } = await settleAll([
            Promise.reject(axiosError(500)),
            Promise.reject(axiosError(404)),
        ]);
        expect(errors.map((e) => e.status)).toEqual([500, 404]);
    });
});

describe("unwrap", () => {
    test("pulls res.data.data out", () => {
        expect(unwrap({ data: { data: [1, 2] } }, [])).toEqual([1, 2]);
    });

    test("falls back when the result is null, as it is for a failed call", () => {
        expect(unwrap(null, [])).toEqual([]);
        expect(unwrap(undefined, {})).toEqual({});
    });

    test("falls back when the envelope is missing its data field", () => {
        expect(unwrap({ data: {} }, "fallback")).toBe("fallback");
    });

    test("preserves a legitimately empty array rather than substituting the fallback", () => {
        // An empty list is a real answer and must not be confused with a failure.
        expect(unwrap({ data: { data: [] } }, ["fallback"])).toEqual([]);
    });

    test("preserves a falsy-but-valid value such as 0", () => {
        expect(unwrap({ data: { data: 0 } }, 99)).toBe(0);
    });
});
