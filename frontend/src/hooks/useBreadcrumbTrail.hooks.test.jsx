import { act, renderHook } from "@testing-library/react";
import { getProbedTrail, LocationProbe } from "../test-utils";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { buildTrailState } from "../helpers/breadcrumb.helpers";
import {
    useAncestryForChildren,
    useBreadcrumbTrail,
    useForwardedTrailState,
    useListCrumb,
    useListTrailState,
    useTrailNavigate
} from "./useBreadcrumbTrail.hooks";

const renderAt = (hook, url, trail) => {
    const [pathname, search = ""] = url.split("?");
    const entry = {
        pathname,
        search: search ? `?${search}` : "",
        state: trail ? buildTrailState(trail.targetPath, trail.ancestors) : null
    };
    const wrapper = ({ children }) => <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;
    return renderHook(hook, { wrapper });
};

const portfolios = { label: "Portfolios", to: "/portfolios" };
const portfolioA = { label: "Portfolio A", to: "/portfolios/3/funding?fy=2025" };

describe("useBreadcrumbTrail", () => {
    it("returns the trail carried on the location when it applies to the current path", () => {
        const trail = { targetPath: "/cans/1", ancestors: [portfolios] };
        const { result } = renderAt(() => useBreadcrumbTrail(), "/cans/1/spending", trail);
        expect(result.current).toEqual(trail);
    });

    it("ignores a carried trail for a different resource", () => {
        const { result } = renderAt(() => useBreadcrumbTrail(), "/cans/2", { targetPath: "/cans/1", ancestors: [] });
        expect(result.current).toBeNull();
    });

    it("treats a trail with no ancestors as no trail, so the route hierarchy is used", () => {
        const { result } = renderAt(() => useBreadcrumbTrail(), "/cans/1", { targetPath: "/cans/1", ancestors: [] });
        expect(result.current).toBeNull();
    });
});

describe("useForwardedTrailState", () => {
    it("returns location state carrying the applicable trail, for tab navigation", () => {
        const trail = { targetPath: "/cans/1", ancestors: [portfolios] };
        const { result } = renderAt(() => useForwardedTrailState(), "/cans/1", trail);
        expect(result.current).toEqual(buildTrailState(trail.targetPath, trail.ancestors));
    });

    it("returns undefined when there is no trail", () => {
        const { result } = renderAt(() => useForwardedTrailState(), "/cans/1");
        expect(result.current).toBeUndefined();
    });
});

describe("useListCrumb", () => {
    it("links back to the list's current tab when rendered on that list", () => {
        const { result } = renderAt(() => useListCrumb("budgetLines"), "/budget-lines?filter=my-budget-lines");
        expect(result.current).toEqual({ label: "Budget Lines", to: "/budget-lines?filter=my-budget-lines" });
    });
});

describe("useListTrailState", () => {
    it("builds link state whose trail is the list's crumb", () => {
        const { result } = renderAt(() => useListTrailState("agreements"), "/agreements?filter=my-agreements");
        expect(result.current("/agreements/5")).toEqual(
            buildTrailState("/agreements/5", [{ label: "Agreements", to: "/agreements?filter=my-agreements" }])
        );
    });
});

describe("useAncestryForChildren", () => {
    const fallbackCrumb = { label: "CANs", to: "/cans" };

    it("defaults the page's own crumb to the current tab", () => {
        const { result } = renderAt(
            () => useAncestryForChildren({ ownCrumb: { label: "CAN 1" }, fallbackCrumb }),
            "/cans/1/funding?x=1"
        );
        expect(result.current).toEqual([fallbackCrumb, { label: "CAN 1", to: "/cans/1/funding" }]);
    });

    it("adds ?fy= to the own crumb when a fiscalYear is given", () => {
        const { result } = renderAt(
            () => useAncestryForChildren({ ownCrumb: { label: "CAN 1", fiscalYear: 2025 }, fallbackCrumb }),
            "/cans/1/funding"
        );
        expect(result.current).toEqual([fallbackCrumb, { label: "CAN 1", to: "/cans/1/funding?fy=2025" }]);
    });

    it("uses an explicit ownCrumb.to and prepends the carried trail when it applies", () => {
        const { result } = renderAt(
            () => useAncestryForChildren({ ownCrumb: { label: "CAN 1", to: "/cans/1" }, fallbackCrumb }),
            "/cans/1/spending",
            { targetPath: "/cans/1", ancestors: [portfolios, portfolioA] }
        );
        expect(result.current).toEqual([portfolios, portfolioA, { label: "CAN 1", to: "/cans/1" }]);
    });
});

describe("useTrailNavigate", () => {
    const renderWithProbe = (url, trail) => {
        const [pathname] = url.split("?");
        const entry = { pathname, state: trail ? buildTrailState(trail.targetPath, trail.ancestors) : null };
        const wrapper = ({ children }) => (
            <MemoryRouter initialEntries={[entry]}>
                {children}
                <LocationProbe />
            </MemoryRouter>
        );
        return renderHook(() => useTrailNavigate(), { wrapper });
    };
    const trail = { targetPath: "/agreements/5", ancestors: [portfolios] };

    it("carries the trail to another page of the same resource", () => {
        const { result } = renderWithProbe("/agreements/5", trail);
        act(() => result.current("/agreements/5/budget-lines"));
        expect(getProbedTrail()).toEqual(trail);
    });

    it("drops the trail when navigating to another resource", () => {
        const { result } = renderWithProbe("/agreements/5", trail);
        act(() => result.current("/agreements"));
        expect(getProbedTrail()).toBeNull();
    });

    it("leaves an explicit state untouched", () => {
        const { result } = renderWithProbe("/agreements/5", trail);
        act(() => result.current("/agreements/5/budget-lines", { state: { other: true } }));
        expect(getProbedTrail()).toBeNull();
    });

    it("leaves an explicit falsy state untouched", () => {
        const { result } = renderWithProbe("/agreements/5", trail);
        act(() => result.current("/agreements/5/budget-lines", { state: null }));
        expect(getProbedTrail()).toBeNull();
    });
});
