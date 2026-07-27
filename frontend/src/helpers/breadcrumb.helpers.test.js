import { describe, expect, it } from "vitest";
import { buildTrail, toBasePath, trailMatchesPath, resolveAncestryForChildren } from "./breadcrumb.helpers";

const portfolios = { label: "Portfolios", to: "/portfolios" };
const portfolioA = { label: "Portfolio A", to: "/portfolios/5" };
const cans = { label: "CANs", to: "/cans" };
const can1 = { label: "CAN 1", to: "/cans/1" };
const agreements = { label: "Agreements", to: "/agreements" };

describe("buildTrail", () => {
    it("appends the current page's own crumb to the parent ancestors", () => {
        const trail = buildTrail({
            targetPath: "/agreements/1",
            parentAncestors: [portfolios],
            ownCrumb: portfolioA
        });
        expect(trail).toEqual({
            targetPath: "/agreements/1",
            ancestors: [portfolios, portfolioA]
        });
    });

    it("composes multi-level drill-down chains", () => {
        // Portfolios > Portfolio A already stored; user is on the CAN page which
        // carries [Portfolios, Portfolio A, CAN 1]; clicking an agreement keeps it.
        const trail = buildTrail({
            targetPath: "/agreements/1",
            parentAncestors: [portfolios, portfolioA, can1]
        });
        expect(trail.ancestors).toEqual([portfolios, portfolioA, can1]);
        expect(trail.targetPath).toEqual("/agreements/1");
    });

    it("omits the own crumb when not provided (list-page entry)", () => {
        const trail = buildTrail({
            targetPath: "/cans/1",
            parentAncestors: [cans]
        });
        expect(trail.ancestors).toEqual([cans]);
    });

    it("defaults parentAncestors to an empty array", () => {
        const trail = buildTrail({ targetPath: "/agreements/1", ownCrumb: agreements });
        expect(trail.ancestors).toEqual([agreements]);
    });

    it("does not mutate the passed parentAncestors array", () => {
        const parents = [portfolios];
        buildTrail({ targetPath: "/x/1", parentAncestors: parents, ownCrumb: portfolioA });
        expect(parents).toEqual([portfolios]);
    });
});

describe("toBasePath", () => {
    it("returns the base for a two-segment path unchanged", () => {
        expect(toBasePath("/cans/1")).toBe("/cans/1");
    });

    it("strips a trailing tab segment", () => {
        expect(toBasePath("/cans/1/spending")).toBe("/cans/1");
        expect(toBasePath("/agreements/123/budget-lines")).toBe("/agreements/123");
    });

    it("handles a single-segment (list) path", () => {
        expect(toBasePath("/cans")).toBe("/cans");
    });

    it("returns empty string for empty input", () => {
        expect(toBasePath("")).toBe("");
    });
});

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
