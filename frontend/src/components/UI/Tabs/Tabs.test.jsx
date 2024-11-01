import { describe, it, expect, vi } from "vitest";
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

    it("renders all tabs with correct labels", () => {
        render(<Tabs paths={mockPaths} />);

        mockPaths.forEach((path) => {
            expect(screen.getByText(path.label)).toBeInTheDocument();
        });
    });

    it("renders navigation with correct aria-label", () => {
        render(<Tabs paths={mockPaths} />);

        const nav = screen.getByRole("navigation");
        expect(nav).toHaveAttribute("aria-label", "Agreement Tab Sections");
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

    // Test empty paths array
    it("renders no buttons when paths array is empty", () => {
        render(<Tabs paths={[]} />);

        const nav = screen.getByRole("navigation");
        const { queryAllByRole } = within(nav);
        const buttons = queryAllByRole("button");

        expect(buttons).toHaveLength(0);
    });
});
