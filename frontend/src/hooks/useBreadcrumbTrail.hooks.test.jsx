import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { setupStore } from "../store";
import { useAncestryForChildren, useListCrumb } from "./useBreadcrumbTrail.hooks";

const renderAt = (hook, url, preloadedState = {}) => {
    const store = setupStore(preloadedState);
    const wrapper = ({ children }) => (
        <Provider store={store}>
            <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
        </Provider>
    );
    return renderHook(hook, { wrapper });
};

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

    it("uses an explicit ownCrumb.to and prepends the stored trail when it applies", () => {
        const portfolioCrumb = { label: "Portfolio A", to: "/portfolios/3/funding?fy=2025" };
        const { result } = renderAt(
            () => useAncestryForChildren({ ownCrumb: { label: "CAN 1", to: "/cans/1" }, fallbackCrumb }),
            "/cans/1/spending",
            {
                sessionUI: {
                    navContext: {
                        trail: {
                            targetPath: "/cans/1",
                            ancestors: [{ label: "Portfolios", to: "/portfolios" }, portfolioCrumb]
                        }
                    }
                }
            }
        );
        expect(result.current).toEqual([
            { label: "Portfolios", to: "/portfolios" },
            portfolioCrumb,
            { label: "CAN 1", to: "/cans/1" }
        ]);
    });
});
