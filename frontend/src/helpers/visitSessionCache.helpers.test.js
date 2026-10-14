import { beforeEach, describe, expect, it } from "vitest";
import {
    __resetVisitSessionCache,
    getVisitClassification,
    hasVisitClassification,
    invalidateVisitClassification,
    setVisitClassification
} from "./visitSessionCache.helpers";

describe("visitSessionCache", () => {
    beforeEach(() => {
        __resetVisitSessionCache();
    });

    it("has no classification for a user before one is set", () => {
        expect(hasVisitClassification(42)).toBe(false);
        expect(getVisitClassification(42)).toBeUndefined();
    });

    it("stores and retrieves a classification per user id", () => {
        setVisitClassification(42, false);
        setVisitClassification(7, true);

        expect(hasVisitClassification(42)).toBe(true);
        expect(getVisitClassification(42)).toBe(false);
        expect(hasVisitClassification(7)).toBe(true);
        expect(getVisitClassification(7)).toBe(true);
    });

    it("invalidates only the specified user's entry", () => {
        setVisitClassification(42, false);
        setVisitClassification(7, true);

        invalidateVisitClassification(42);

        expect(hasVisitClassification(42)).toBe(false);
        expect(hasVisitClassification(7)).toBe(true);
    });

    it("is a no-op to invalidate a user with no cached entry", () => {
        expect(() => invalidateVisitClassification(999)).not.toThrow();
        expect(hasVisitClassification(999)).toBe(false);
    });
});
