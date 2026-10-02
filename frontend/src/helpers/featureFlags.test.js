import { afterEach, describe, expect, it, vi } from "vitest";
import { isHomepageRedesignEnabled } from "./featureFlags";

describe("isHomepageRedesignEnabled", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("returns true when VITE_FEATURE_HOMEPAGE_REDESIGN is 'true'", () => {
        vi.stubEnv("VITE_FEATURE_HOMEPAGE_REDESIGN", "true");
        expect(isHomepageRedesignEnabled()).toBe(true);
    });

    it("returns false when VITE_FEATURE_HOMEPAGE_REDESIGN is not set", () => {
        vi.stubEnv("VITE_FEATURE_HOMEPAGE_REDESIGN", "");
        expect(isHomepageRedesignEnabled()).toBe(false);
    });

    it("returns false when VITE_FEATURE_HOMEPAGE_REDESIGN is 'false'", () => {
        vi.stubEnv("VITE_FEATURE_HOMEPAGE_REDESIGN", "false");
        expect(isHomepageRedesignEnabled()).toBe(false);
    });
});
