import { render, screen } from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { buildTrailState } from "../../../helpers/breadcrumb.helpers";
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
 *   "/agreements/review/:id" renders a Change BL Status page whose `parentCrumb` is Agreement 1.
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
                path: "/agreements/review/:id",
                element: (
                    <Breadcrumb
                        currentName="Change BL Status"
                        parentCrumb={{ label: "Agreement 1", to: "/agreements/1" }}
                    />
                ),
                handle: routeHandle
            },
            {
                path: "/cans/:id/*",
                element: <Breadcrumb currentName="CAN 1" />,
                handle: routeHandle
            }
        ],
        {
            initialEntries: [
                { pathname: initialPath, state: trail ? buildTrailState(trail.targetPath, trail.ancestors) : null }
            ]
        }
    );
    return render(<RouterProvider router={router} />);
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

    it("shortens long carried crumbs but keeps their full name accessible, and shows the leaf in full", () => {
        const longName = "Contract #1: African American Child and Family Research Center";
        render(
            <RouterProvider
                router={createMemoryRouter(
                    [{ path: "/agreements/review/:id", element: <Breadcrumb currentName={longName} /> }],
                    {
                        initialEntries: [
                            {
                                pathname: "/agreements/review/1",
                                state: buildTrailState("/agreements/review/1", [
                                    { label: "Projects", to: "/projects" },
                                    { label: longName, to: "/agreements/1" }
                                ])
                            }
                        ]
                    }
                )}
            />
        );

        const crumb = screen.getByRole("link", { name: longName });
        expect(crumb).toHaveTextContent(/^Contract #1: African Amer…$/);
        expect(crumb).toHaveAttribute("title", longName);
        // Short crumbs are untouched and get no extra label.
        expect(screen.getByRole("link", { name: "Projects" })).not.toHaveAttribute("title");
        // The leaf is not shortened.
        expect(screen.getAllByRole("listitem").at(-1)).toHaveTextContent(longName);
    });

    describe("parentCrumb", () => {
        const crumbTexts = () => screen.getAllByRole("listitem").map((item) => item.textContent);

        it("renders the parent between the route hierarchy and the leaf when there is no trail", () => {
            renderBreadcrumb({ initialPath: "/agreements/review/1", routeHandle: agreementsRouteHandle });
            expect(crumbTexts()).toEqual(["Home", "Agreements", "Agreement 1", "Change BL Status"]);
            expect(screen.getByRole("link", { name: "Agreement 1" })).toHaveAttribute("href", "/agreements/1");
        });

        it("does not repeat the parent when the trail already ends with it", () => {
            renderBreadcrumb({
                initialPath: "/agreements/review/1",
                routeHandle: agreementsRouteHandle,
                trail: {
                    targetPath: "/agreements/review/1",
                    ancestors: [
                        { label: "Budget Lines", to: "/budget-lines" },
                        { label: "Agreement 1", to: "/agreements/1/budget-lines" }
                    ]
                }
            });
            expect(crumbTexts()).toEqual(["Home", "Budget Lines", "Agreement 1", "Change BL Status"]);
            expect(screen.getByRole("link", { name: "Agreement 1" })).toHaveAttribute(
                "href",
                "/agreements/1/budget-lines"
            );
        });

        it("appends the parent after a trail that lacks it, and the parent link keeps that trail", async () => {
            renderBreadcrumb({
                initialPath: "/agreements/review/1",
                trail: {
                    targetPath: "/agreements/review/1/edit",
                    ancestors: [{ label: "Budget Lines", to: "/budget-lines" }]
                }
            });
            expect(crumbTexts()).toEqual(["Home", "Budget Lines", "Agreement 1", "Change BL Status"]);

            await userEvent.click(screen.getByRole("link", { name: "Agreement 1" }));

            // On the agreement page, the trail it was handed is still shown.
            expect(screen.getByRole("link", { name: "Budget Lines" })).toHaveAttribute("href", "/budget-lines");
        });
    });
});
