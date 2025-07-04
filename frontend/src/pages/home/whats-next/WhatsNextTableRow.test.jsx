import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WhatsNextTableRow from "./WhatsNextTableRow";
import { useTableRow } from "../../../components/UI/TableRowExpandable/TableRowExpandable.hooks";
import * as helpers from "../../../components/UI/TableRowExpandable/TableRowExpandable.helpers";

// Mock the TableRowExpandable component
vi.mock("../../../components/UI/TableRowExpandable", () => ({
    default: ({ tableRowData, expandedData, isExpanded, setIsExpanded }) => (
        <div data-testid="table-row-expandable">
            <div data-testid="table-row-data">{tableRowData}</div>
            <div
                data-testid="expanded-data"
                style={{ display: isExpanded ? "block" : "none" }}
            >
                {expandedData}
            </div>
            <button
                data-testid="toggle-button"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {isExpanded ? "Collapse" : "Expand"}
            </button>
        </div>
    )
}));

// Mock the helper functions
vi.mock("../../../components/UI/TableRowExpandable/TableRowExpandable.helpers", () => ({
    changeBgColorIfExpanded: vi.fn((isExpanded) => ({
        backgroundColor: isExpanded ? "var(--base-light-variant)" : ""
    })),
    expandedRowBGColor: { backgroundColor: "var(--base-light-variant)" },
    removeBorderBottomIfExpanded: vi.fn((isExpanded) => (isExpanded ? "border-bottom-none" : ""))
}));

// Mock the useTableRow hook
vi.mock("../../../components/UI/TableRowExpandable/TableRowExpandable.hooks");

describe("WhatsNextTableRow Component", () => {
    const mockItem = {
        id: 1,
        priority: 1,
        title: "Test Feature",
        levelOfEffort: "Medium",
        status: "In Progress-Development",
        expandedHeading: "Feature Functionality",
        expandedDescription: "This is a detailed description of the test feature."
    };

    beforeEach(() => {
        vi.mocked(useTableRow).mockReturnValue({
            trId: "test-id",
            isExpanded: false,
            setIsExpanded: vi.fn(),
            isRowActive: false,
            setIsRowActive: vi.fn()
        });
    });

    it("renders all item data in table cells", () => {
        render(<WhatsNextTableRow item={mockItem} />);

        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("Test Feature")).toBeInTheDocument();
        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("In Progress-Development")).toBeInTheDocument();
    });

    it("renders expanded content with heading and description", () => {
        render(<WhatsNextTableRow item={mockItem} />);

        const expandedData = screen.getByTestId("expanded-data");
        expect(expandedData).toBeInTheDocument();

        // Check that the expanded content contains the heading and description
        expect(screen.getByText("Feature Functionality")).toBeInTheDocument();
        expect(screen.getByText("This is a detailed description of the test feature.")).toBeInTheDocument();
    });

    it("renders fallback message when expandedHeading or expandedDescription is missing", () => {
        const itemWithoutExpanded = {
            ...mockItem,
            expandedHeading: "",
            expandedDescription: ""
        };

        render(<WhatsNextTableRow item={itemWithoutExpanded} />);

        expect(screen.getByText("No additional information available.")).toBeInTheDocument();
    });

    it("renders fallback message when expandedDescription is missing", () => {
        const itemWithoutDescription = {
            ...mockItem,
            expandedDescription: ""
        };

        render(<WhatsNextTableRow item={itemWithoutDescription} />);

        expect(screen.getByText("No additional information available.")).toBeInTheDocument();
    });

    it("renders fallback message when expandedHeading is missing", () => {
        const itemWithoutHeading = {
            ...mockItem,
            expandedHeading: ""
        };

        render(<WhatsNextTableRow item={itemWithoutHeading} />);

        expect(screen.getByText("No additional information available.")).toBeInTheDocument();
    });

    it("passes correct props to TableRowExpandable", () => {
        const mockSetIsExpanded = vi.fn();
        const mockSetIsRowActive = vi.fn();

        vi.mocked(useTableRow).mockReturnValue({
            trId: "test-id",
            isExpanded: false,
            setIsExpanded: mockSetIsExpanded,
            isRowActive: false,
            setIsRowActive: mockSetIsRowActive
        });

        render(<WhatsNextTableRow item={mockItem} />);

        expect(screen.getByTestId("table-row-expandable")).toBeInTheDocument();
        expect(screen.getByTestId("table-row-data")).toBeInTheDocument();
        expect(screen.getByTestId("expanded-data")).toBeInTheDocument();
    });

    it("applies correct styling for expanded state", () => {
        vi.mocked(useTableRow).mockReturnValue({
            trId: "test-id",
            isExpanded: true,
            setIsExpanded: vi.fn(),
            isRowActive: false,
            setIsRowActive: vi.fn()
        });

        render(<WhatsNextTableRow item={mockItem} />);

        // Verify that helper functions are called with the expanded state
        expect(vi.mocked(helpers.changeBgColorIfExpanded)).toHaveBeenCalledWith(true);
        expect(vi.mocked(helpers.removeBorderBottomIfExpanded)).toHaveBeenCalledWith(true);
    });

    it("handles expandable functionality correctly", () => {
        const mockSetIsExpanded = vi.fn();

        vi.mocked(useTableRow).mockReturnValue({
            trId: "test-id",
            isExpanded: false,
            setIsExpanded: mockSetIsExpanded,
            isRowActive: false,
            setIsRowActive: vi.fn()
        });

        render(<WhatsNextTableRow item={mockItem} />);

        const toggleButton = screen.getByTestId("toggle-button");
        fireEvent.click(toggleButton);

        expect(mockSetIsExpanded).toHaveBeenCalledWith(true);
    });

    it("sets colSpan correctly for expanded data", () => {
        render(<WhatsNextTableRow item={mockItem} />);

        const expandedData = screen.getByTestId("expanded-data");
        // The expanded data should contain a td with colSpan="9" (rendered as colspan in HTML)
        expect(expandedData.innerHTML).toContain('colspan="9"');
    });

    it("applies correct CSS classes to expanded content", () => {
        render(<WhatsNextTableRow item={mockItem} />);

        // Check that the expanded content has the correct classes
        const expandedContent = screen.getByTestId("expanded-data");
        expect(expandedContent.innerHTML).toContain('class="border-top-none"');
        expect(expandedContent.innerHTML).toContain('class="font-12px"');
    });

    describe("Edge Cases", () => {
        it("handles empty strings for expandedHeading and expandedDescription", () => {
            const itemWithEmptyStrings = {
                ...mockItem,
                expandedHeading: "",
                expandedDescription: ""
            };

            render(<WhatsNextTableRow item={itemWithEmptyStrings} />);

            expect(screen.getByText("No additional information available.")).toBeInTheDocument();
        });

        it("renders correctly with numeric priority", () => {
            const itemWithNumericPriority = {
                ...mockItem,
                priority: 42
            };

            render(<WhatsNextTableRow item={itemWithNumericPriority} />);

            expect(screen.getByText("42")).toBeInTheDocument();
        });

        it("renders correctly with string priority", () => {
            const itemWithStringPriority = {
                ...mockItem,
                priority: "High"
            };

            render(<WhatsNextTableRow item={itemWithStringPriority} />);

            expect(screen.getByText("High")).toBeInTheDocument();
        });
    });
});
