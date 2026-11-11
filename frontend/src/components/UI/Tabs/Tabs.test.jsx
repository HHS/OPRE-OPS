import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { buildTrailState } from "../../../helpers/breadcrumb.helpers";
import Tabs from "./Tabs";

// Mock the router hooks. useLocation is a vi.fn() (rather than a fixed return value) so tests
// can simulate the route changing some other way while Tabs stays mounted.
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn(() => ({ pathname: "/test/path1" }));
vi.mock("react-router-dom", () => ({
    useLocation: () => mockUseLocation(),
    useNavigate: () => mockNavigate
}));

describe("Tabs", () => {
    const mockPaths = [
        {
            label: "Path 1",
            pathName: "/test/path1"
        },
        {
            label: "Path 2",
            pathName: "/test/path2"
        },
        {
            label: "Path 3",
            pathName: "/test/path3"
        }
    ];

    beforeEach(() => {
        mockNavigate.mockClear();
        mockUseLocation.mockReturnValue({ pathname: "/test/path1" });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders all tabs with correct labels", () => {
        render(<Tabs paths={mockPaths} />);

        mockPaths.forEach((path) => {
            expect(screen.getByText(path.label)).toBeInTheDocument();
        });
    });

    it("renders navigation with correct aria-label", () => {
        render(<Tabs paths={mockPaths} />);

        const nav = screen.getByRole("navigation");
        expect(nav).toHaveAttribute("aria-label", "Tab Sections");
    });

    it("applies selected class to active tab", () => {
        render(<Tabs paths={mockPaths} />);

        const selectedButton = screen.getByText("Path 1");
        const notSelectedButton = screen.getByText("Path 2");

        expect(selectedButton.className).toContain("listItemSelected");
        expect(notSelectedButton.className).toContain("listItemNotSelected");
    });

    it("navigates without resetting the page scroll when a tab is clicked", () => {
        render(<Tabs paths={mockPaths} />);

        const secondTab = screen.getByText("Path 2");
        fireEvent.click(secondTab);

        expect(mockNavigate).toHaveBeenCalledWith("/test/path2", { preventScrollReset: true });
    });

    it("does not navigate when clicking the already-active tab", () => {
        render(<Tabs paths={mockPaths} />);

        fireEvent.click(screen.getByText("Path 1"));

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("keeps the breadcrumb trail when switching between tabs of the same resource", () => {
        const trailState = buildTrailState("/cans/1", [{ label: "Portfolios", to: "/portfolios" }]);
        mockUseLocation.mockReturnValue({ pathname: "/cans/1", state: trailState });
        render(
            <Tabs
                paths={[
                    { label: "Details", pathName: "/cans/1" },
                    { label: "Spending", pathName: "/cans/1/spending" }
                ]}
            />
        );

        fireEvent.click(screen.getByText("Spending"));

        expect(mockNavigate).toHaveBeenCalledWith("/cans/1/spending", {
            preventScrollReset: true,
            state: trailState
        });
    });

    describe("keeping the tab bar in view after a tab switch", () => {
        const scrollIntoView = vi.fn();

        beforeEach(() => {
            scrollIntoView.mockClear();
            Element.prototype.scrollIntoView = scrollIntoView;
        });

        afterEach(() => {
            delete Element.prototype.scrollIntoView;
        });

        // Clicks a tab, then re-renders at the new route the way the router would, with the
        // tab bar's top at `navTop` px from the top of the viewport.
        const switchTab = (navTop) => {
            const { rerender } = render(<Tabs paths={mockPaths} />);
            vi.spyOn(screen.getByRole("navigation"), "getBoundingClientRect").mockReturnValue({ top: navTop });

            fireEvent.click(screen.getByText("Path 2"));
            mockUseLocation.mockReturnValue({ pathname: "/test/path2" });
            rerender(<Tabs paths={mockPaths} />);
        };

        it("does not scroll when the tab bar is still in view", () => {
            switchTab(120);

            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("scrolls the tab bar back into view when the new tab leaves it above the viewport", () => {
            switchTab(-300);

            expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: "start" });
        });

        it("does not scroll when the route changes without a tab click (Back/Forward)", () => {
            const { rerender } = render(<Tabs paths={mockPaths} />);
            vi.spyOn(screen.getByRole("navigation"), "getBoundingClientRect").mockReturnValue({ top: -300 });

            mockUseLocation.mockReturnValue({ pathname: "/test/path3" });
            rerender(<Tabs paths={mockPaths} />);

            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("does not scroll on a later Back/Forward after clicking the already-active tab", () => {
            // Regression test: clicking the already-active tab must not leave clickedPathRef
            // stuck on this path, where an unrelated later Back/Forward landing here would
            // wrongly be mistaken for a tab click and trigger scrollIntoView.
            const { rerender } = render(<Tabs paths={mockPaths} />);
            vi.spyOn(screen.getByRole("navigation"), "getBoundingClientRect").mockReturnValue({ top: -300 });

            fireEvent.click(screen.getByText("Path 1"));

            mockUseLocation.mockReturnValue({ pathname: "/test/path2" });
            rerender(<Tabs paths={mockPaths} />);
            mockUseLocation.mockReturnValue({ pathname: "/test/path1" });
            rerender(<Tabs paths={mockPaths} />);

            expect(scrollIntoView).not.toHaveBeenCalled();
        });
    });

    it("renders correct data-cy attributes", () => {
        render(<Tabs paths={mockPaths} />);

        mockPaths.forEach((path) => {
            const button = screen.getByText(path.label);
            expect(button).toHaveAttribute("data-cy", `details-tab-${path.label}`);
        });
    });

    it("renders correct data-value attributes", () => {
        render(<Tabs paths={mockPaths} />);

        mockPaths.forEach((path) => {
            const button = screen.getByText(path.label);
            expect(button).toHaveAttribute("data-value", path.pathName);
        });
    });

    it("renders all tabs as buttons", () => {
        render(<Tabs paths={mockPaths} />);

        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(mockPaths.length);
    });

    it("renders right-side content when provided", () => {
        render(
            <Tabs
                paths={mockPaths}
                rightContent={<a href="/export">Export</a>}
            />
        );

        expect(screen.getByRole("link", { name: "Export" })).toBeInTheDocument();
    });

    // Test empty paths array
    it("renders no buttons when paths array is empty", () => {
        render(<Tabs paths={[]} />);

        const nav = screen.getByRole("navigation");
        const { queryAllByRole } = within(nav);
        const buttons = queryAllByRole("button");

        expect(buttons).toHaveLength(0);
    });
});
