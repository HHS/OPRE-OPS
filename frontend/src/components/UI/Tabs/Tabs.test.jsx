import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Tabs from "./Tabs";

// Mock the router hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useLocation: () => ({ pathname: "/test/path1" }),
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

    it("scrolls to top and waits for scrollend before navigating when scrolled", () => {
        render(<Tabs paths={mockPaths} />);
        Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
        const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

        fireEvent.click(screen.getByText("Path 2"));

        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
        expect(mockNavigate).not.toHaveBeenCalled();

        window.dispatchEvent(new Event("scrollend"));

        expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
    });

    it("falls back to navigating on a timeout if scrollend never fires", () => {
        vi.useFakeTimers();
        render(<Tabs paths={mockPaths} />);
        Object.defineProperty(window, "scrollY", { value: 500, configurable: true });
        vi.spyOn(window, "scrollTo").mockImplementation(() => {});

        fireEvent.click(screen.getByText("Path 2"));
        expect(mockNavigate).not.toHaveBeenCalled();

        vi.advanceTimersByTime(500);

        expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
    });

    it("navigates immediately when already scrolled to the top", () => {
        render(<Tabs paths={mockPaths} />);
        const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

        fireEvent.click(screen.getByText("Path 2"));

        expect(scrollToSpy).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/test/path2");
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
