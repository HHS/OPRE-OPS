import { describe, expect, it } from "vitest";
import {
    agreementCrumb,
    buildTrailState,
    getTrailFromState,
    LIST_CRUMBS,
    resourceBasePath,
    trailFor,
    trailIncludesList,
    trailMatchesPath,
    truncateCrumbLabel,
    withListQuery
} from "./breadcrumb.helpers";

const portfolios = { label: "Portfolios", to: "/portfolios" };
const cans = { label: "CANs", to: "/cans" };

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

    it("carries the destination's name when the link provides one", () => {
        expect(getTrailFromState(buildTrailState("/agreements/1", [portfolios], "Agreement X"))).toEqual({
            targetPath: "/agreements/1",
            ancestors: [portfolios],
            targetLabel: "Agreement X"
        });
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

    it("maps agreement action routes to their agreement", () => {
        expect(resourceBasePath("/agreements/review/5")).toBe("/agreements/5");
        expect(resourceBasePath("/agreements/review/5/edit?returnTo=x")).toBe("/agreements/5");
        expect(resourceBasePath("/agreements/approve/5?type=status-change")).toBe("/agreements/5");
        expect(resourceBasePath("/agreements/create")).toBe("/agreements/create");
    });
});

describe("trailIncludesList", () => {
    it("finds a list crumb in the trail, whatever query it carries", () => {
        const trail = { targetPath: "/cans/1", ancestors: [{ label: "Projects", to: "/projects?filter=all" }] };
        expect(trailIncludesList(trail, LIST_CRUMBS.projects)).toBe(true);
    });

    it("is false when the list is not in the trail, or there is no trail", () => {
        const trail = { targetPath: "/cans/1", ancestors: [portfolios, { label: "Portfolio A", to: "/portfolios/3" }] };
        expect(trailIncludesList(trail, LIST_CRUMBS.projects)).toBe(false);
        expect(trailIncludesList(null, LIST_CRUMBS.projects)).toBe(false);
    });
});

describe("truncateCrumbLabel", () => {
    it("keeps a label of up to 25 characters as is", () => {
        expect(truncateCrumbLabel("Portfolios")).toBe("Portfolios");
        expect(truncateCrumbLabel("x".repeat(25))).toBe("x".repeat(25));
    });

    it("cuts a longer label to its first 25 characters and adds an ellipsis", () => {
        expect(truncateCrumbLabel("Contract #1: African American Child and Family")).toBe("Contract #1: African Amer…");
    });

    it("drops trailing spaces before the ellipsis", () => {
        expect(truncateCrumbLabel("Annual Performance Plans and Reports")).toBe("Annual Performance Plans…");
    });
});

describe("agreementCrumb", () => {
    it("links to the agreement, labelled with its name", () => {
        expect(agreementCrumb({ id: 5, name: "Agreement X" })).toEqual({ label: "Agreement X", to: "/agreements/5" });
    });

    it("is undefined until the agreement has loaded", () => {
        expect(agreementCrumb(undefined)).toBeUndefined();
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

    it("ends the trail before the agreement when going from Change BL Status to its edit page", () => {
        const reviewTrail = {
            targetPath: "/agreements/review/5",
            ancestors: [portfolios, { label: "Agreement X", to: "/agreements/5/budget-lines" }]
        };
        expect(trailFor(reviewTrail, "/agreements/review/5/edit")).toEqual({
            targetPath: "/agreements/review/5/edit",
            ancestors: [portfolios]
        });
    });

    it("drops the trail for an unrelated page", () => {
        expect(trailFor(approvalTrail, "/agreements")).toBeNull();
        expect(trailFor(null, "/agreements/5")).toBeNull();
    });
});
