import { describe, expect, it } from "vitest";
import { trailMatchesPath, resolveAncestryForChildren } from "./breadcrumb.helpers";

const portfolios = { label: "Portfolios", to: "/portfolios" };
const portfolioA = { label: "Portfolio A", to: "/portfolios/5" };
const cans = { label: "CANs", to: "/cans" };
const can1 = { label: "CAN 1", to: "/cans/1" };

describe("trailMatchesPath", () => {
    const trail = { targetPath: "/cans/1", ancestors: [cans] };

    it("matches the exact base path", () => {
        expect(trailMatchesPath(trail, "/cans/1")).toBe(true);
    });

    it("matches a sub-route (tab) beneath the base path", () => {
        expect(trailMatchesPath(trail, "/cans/1/spending")).toBe(true);
    });

    it("does not match a sibling resource with a shared prefix", () => {
        expect(trailMatchesPath(trail, "/cans/12")).toBe(false);
    });

    it("does not match an unrelated path", () => {
        expect(trailMatchesPath(trail, "/agreements/1")).toBe(false);
    });

    it("returns false for a null trail", () => {
        expect(trailMatchesPath(null, "/cans/1")).toBe(false);
    });

    it("returns false for an empty pathname", () => {
        expect(trailMatchesPath(trail, "")).toBe(false);
    });
});

describe("resolveAncestryForChildren", () => {
    const ownCrumb = can1;
    const fallbackCrumb = cans;

    it("uses the stored trail's ancestors plus own crumb when the trail matches", () => {
        const trail = { targetPath: "/cans/1", ancestors: [portfolios, portfolioA] };
        const result = resolveAncestryForChildren({
            trail,
            pathname: "/cans/1/spending",
            ownCrumb,
            fallbackCrumb
        });
        expect(result).toEqual([portfolios, portfolioA, can1]);
    });

    it("falls back to [fallbackCrumb, ownCrumb] when no trail applies", () => {
        const result = resolveAncestryForChildren({
            trail: null,
            pathname: "/cans/1",
            ownCrumb,
            fallbackCrumb
        });
        expect(result).toEqual([cans, can1]);
    });

    it("falls back when the trail is for a different resource", () => {
        const trail = { targetPath: "/cans/99", ancestors: [portfolios] };
        const result = resolveAncestryForChildren({
            trail,
            pathname: "/cans/1",
            ownCrumb,
            fallbackCrumb
        });
        expect(result).toEqual([cans, can1]);
    });
});
