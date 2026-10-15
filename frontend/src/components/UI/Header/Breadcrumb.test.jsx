import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { setupStore } from "../../../store";
import Breadcrumb from "./Breadcrumb";

/**
 * Render Breadcrumb inside a data router so both the carried-trail path
 * (needs `useLocation`) and the route-fallback path (needs `useMatches` +
 * `handle.crumb`) are exercisable.
 *
 * @param {Object} options
 * @param {string} [options.initialPath] - Location to render at.
 * @param {Object} [options.trail] - Breadcrumb trail carried on the initial location's state.
 * @param {Object} [options.routeHandle] - `handle` attached to the leaf route (for the fallback path).
 */
const renderBreadcrumb = ({ initialPath = "/agreements/1", trail, routeHandle } = {}) => {
    const router = createMemoryRouter(
        [
            {
                path: "/agreements/:id",
                element: <Breadcrumb currentName="Agreement 1" />,
                handle: routeHandle
            },
            {
                path: "/cans/:id/*",
                element: <Breadcrumb currentName="CAN 1" />,
                handle: routeHandle
            }
        ],
        { initialEntries: [{ pathname: initialPath, state: trail ? { breadcrumbTrail: trail } : null }] }
    );
    return render(
        <Provider store={setupStore()}>
            <RouterProvider router={router} />
        </Provider>
    );
};

const agreementsRouteHandle = {
    crumb: () => (
        <Link
            to="/agreements"
            className="text-primary"
        >
            Agreements
        </Link>
    )
};

describe("Breadcrumb", () => {
    it("always renders Home and the leaf currentName", () => {
        renderBreadcrumb();
        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
        expect(screen.getByText("Agreement 1")).toBeInTheDocument();
    });

    it("renders the carried trail's ancestors when the trail matches the current path", () => {
        renderBreadcrumb({
            initialPath: "/agreements/1",
            trail: {
                targetPath: "/agreements/1",
                ancestors: [
                    { label: "Portfolios", to: "/portfolios" },
                    { label: "Portfolio A", to: "/portfolios/5" }
                ]
            }
        });
        expect(screen.getByRole("link", { name: "Portfolios" })).toHaveAttribute("href", "/portfolios");
        expect(screen.getByRole("link", { name: "Portfolio A" })).toHaveAttribute("href", "/portfolios/5");
        expect(screen.getByText("Agreement 1")).toBeInTheDocument();
    });

    it("falls back to the route hierarchy when the carried trail is for a different resource", () => {
        renderBreadcrumb({
            initialPath: "/agreements/1",
            routeHandle: agreementsRouteHandle,
            trail: {
                targetPath: "/agreements/99",
                ancestors: [{ label: "Portfolios", to: "/portfolios" }]
            }
        });
        // Route-hierarchy crumb is shown; the stale trail's ancestors are not.
        expect(screen.getByRole("link", { name: "Agreements" })).toHaveAttribute("href", "/agreements");
        expect(screen.queryByRole("link", { name: "Portfolios" })).not.toBeInTheDocument();
    });

    it("falls back to the route hierarchy when there is no carried trail", () => {
        renderBreadcrumb({
            initialPath: "/agreements/1",
            routeHandle: agreementsRouteHandle
        });
        expect(screen.getByRole("link", { name: "Agreements" })).toHaveAttribute("href", "/agreements");
    });

    it("keeps the carried trail on a detail-page tab sub-route", () => {
        renderBreadcrumb({
            initialPath: "/cans/1/spending",
            trail: {
                targetPath: "/cans/1",
                ancestors: [{ label: "Portfolios", to: "/portfolios" }]
            }
        });
        expect(screen.getByRole("link", { name: "Portfolios" })).toHaveAttribute("href", "/portfolios");
    });

    it("lets an ancestor crumb carry the crumbs before it, so going back keeps that page's context", async () => {
        renderBreadcrumb({
            initialPath: "/agreements/1",
            trail: {
                targetPath: "/agreements/1",
                ancestors: [
                    { label: "Portfolios", to: "/portfolios" },
                    { label: "Portfolio A", to: "/portfolios/5/funding" },
                    { label: "CAN 1", to: "/cans/1/spending" }
                ]
            }
        });

        await userEvent.click(screen.getByRole("link", { name: "CAN 1" }));

        expect(screen.getByText("CAN 1")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Portfolios" })).toHaveAttribute("href", "/portfolios");
        expect(screen.getByRole("link", { name: "Portfolio A" })).toHaveAttribute("href", "/portfolios/5/funding");
    });
});
