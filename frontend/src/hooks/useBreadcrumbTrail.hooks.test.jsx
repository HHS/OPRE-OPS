import { renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { buildTrailState } from "../helpers/breadcrumb.helpers";
import {
    useAncestryForChildren,
    useBreadcrumbTrail,
    useForwardedTrailState,
    useListCrumb
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

describe("useAncestryForChildren", () => {
    const fallbackCrumb = { label: "CANs", to: "/cans" };

    it("defaults the page's own crumb to the current tab and query", () => {
        const { result } = renderAt(
            () => useAncestryForChildren({ ownCrumb: { label: "CAN 1" }, fallbackCrumb }),
            "/cans/1/funding?x=1"
        );
        expect(result.current).toEqual([fallbackCrumb, { label: "CAN 1", to: "/cans/1/funding?x=1" }]);
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
