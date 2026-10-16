import { describe, expect, it } from "vitest";
import {
    buildTrailState,
    getTrailFromState,
    LIST_CRUMBS,
    resolveAncestryForChildren,
    resourceBasePath,
    trailFor,
    trailMatchesPath,
    withListQuery
} from "./breadcrumb.helpers";

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

    it("matches a sibling tab of a trail targeted at a tab", () => {
        expect(trailMatchesPath({ targetPath: "/cans/1/spending?fy=2025", ancestors: [] }, "/cans/1/funding")).toBe(
            true
        );
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

    it("uses the carried trail's ancestors plus own crumb when the trail matches", () => {
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

describe("withListQuery", () => {
    it("appends the current query when on the list page, so the crumb restores the tab", () => {
        expect(
            withListQuery(LIST_CRUMBS.agreements, { pathname: "/agreements", search: "?filter=my-agreements" })
        ).toEqual({
            label: "Agreements",
            to: "/agreements?filter=my-agreements"
        });
    });

    it("returns the canonical crumb when not on the list page", () => {
        expect(withListQuery(LIST_CRUMBS.agreements, { pathname: "/agreements/5", search: "?x=1" })).toBe(
            LIST_CRUMBS.agreements
        );
    });
});

describe("buildTrailState / getTrailFromState", () => {
    it("round-trips a trail through location state", () => {
        const state = buildTrailState("/cans/1", [cans]);
        expect(state).toEqual({ breadcrumbTrail: { targetPath: "/cans/1", ancestors: [cans] } });
        expect(getTrailFromState(state)).toEqual({ targetPath: "/cans/1", ancestors: [cans] });
    });

    it("returns null when the location carries no trail", () => {
        expect(getTrailFromState(null)).toBeNull();
        expect(getTrailFromState({ other: true })).toBeNull();
    });
});

describe("resourceBasePath", () => {
    it("keeps the first two segments and drops the query", () => {
        expect(resourceBasePath("/cans/1/spending?fy=2025")).toBe("/cans/1");
        expect(resourceBasePath("/agreements")).toBe("/agreements");
    });
});

describe("trailFor", () => {
    const agreementCrumb = { label: "Agreement X", to: "/agreements/5/procurement-tracker" };
    const approvalTrail = { targetPath: "/agreements/5/award-approval", ancestors: [portfolios, agreementCrumb] };

    it("ends the trail before an ancestor when navigating back to it", () => {
        expect(trailFor(approvalTrail, "/agreements/5/procurement-tracker")).toEqual({
            targetPath: "/agreements/5/procurement-tracker",
            ancestors: [portfolios]
        });
    });

    it("keeps the trail for another page of the same resource", () => {
        const trail = { targetPath: "/agreements/5", ancestors: [portfolios] };
        expect(trailFor(trail, "/agreements/5/budget-lines")).toBe(trail);
    });

    it("drops the trail for an unrelated page", () => {
        expect(trailFor(approvalTrail, "/agreements")).toBeNull();
        expect(trailFor(null, "/agreements/5")).toBeNull();
    });
});
