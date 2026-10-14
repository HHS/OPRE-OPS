import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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
        Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
        vi.useRealTimers();
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

    it("navigates when a tab is clicked", () => {
        render(<Tabs paths={mockPaths} />);

        const secondTab = screen.getByText("Path 2");
        fireEvent.click(secondTab);

        expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
    });

    it("navigates immediately when scrolled, by default (scrollToTopOnChange not set)", () => {
        render(<Tabs paths={mockPaths} />);
        Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
        const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

        fireEvent.click(screen.getByText("Path 2"));

        expect(scrollToSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
    });

    describe("scrollToTopOnChange", () => {
        it("scrolls to top and waits for the scroll to settle before navigating when scrolled", () => {
            vi.useFakeTimers();
            render(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );
            Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
            const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

            fireEvent.click(screen.getByText("Path 2"));

            expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth", block: "start" });
            expect(mockNavigate).not.toHaveBeenCalled();

            // First poll tick — still scrolled, hasn't settled yet.
            vi.advanceTimersByTime(20);
            expect(mockNavigate).not.toHaveBeenCalled();

            // Simulate the smooth scroll finishing.
            Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
            vi.advanceTimersByTime(20);

            expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
        });

        it("falls back to navigating on a timeout if the scroll never settles", () => {
            vi.useFakeTimers();
            render(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );
            Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
            vi.spyOn(window, "scrollTo").mockImplementation(() => {});

            fireEvent.click(screen.getByText("Path 2"));
            expect(mockNavigate).not.toHaveBeenCalled();

            vi.advanceTimersByTime(2000);

            expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
        });

        it("navigates immediately when already scrolled to the top", () => {
            render(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );
            const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

            fireEvent.click(screen.getByText("Path 2"));

            expect(scrollToSpy).not.toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
        });

        it("cancels the pending transition when a different tab is clicked before it settles", () => {
            vi.useFakeTimers();
            render(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );
            Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
            vi.spyOn(window, "scrollTo").mockImplementation(() => {});

            fireEvent.click(screen.getByText("Path 2"));
            fireEvent.click(screen.getByText("Path 3"));

            Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
            vi.advanceTimersByTime(50);

            expect(mockNavigate).not.toHaveBeenCalledWith("/test/path2");
            expect(mockNavigate).toHaveBeenCalledWith("/test/path3");
        });

        it("does not navigate for a pending transition after the component unmounts", () => {
            vi.useFakeTimers();
            const { unmount } = render(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );
            Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
            vi.spyOn(window, "scrollTo").mockImplementation(() => {});

            fireEvent.click(screen.getByText("Path 2"));
            unmount();
            vi.advanceTimersByTime(2000);

            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it("cancels a pending transition when the route changes some other way while Tabs stays mounted", () => {
            vi.useFakeTimers();
            const { rerender } = render(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );
            Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
            vi.spyOn(window, "scrollTo").mockImplementation(() => {});

            fireEvent.click(screen.getByText("Path 2"));

            // Simulate the browser Back button (or a link elsewhere in the same layout)
            // changing the route without going through this component's own click handler.
            mockUseLocation.mockReturnValue({ pathname: "/elsewhere" });
            rerender(
                <Tabs
                    paths={mockPaths}
                    scrollToTopOnChange
                />
            );

            vi.advanceTimersByTime(2000);

            expect(mockNavigate).not.toHaveBeenCalledWith("/test/path2");
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
