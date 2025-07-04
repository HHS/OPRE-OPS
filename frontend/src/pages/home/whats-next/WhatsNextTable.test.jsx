import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import WhatsNextTable from "./WhatsNextTable";

// Mock the data module
vi.mock("./data", () => ({
    data: [
        {
            id: 1,
            priority: 2,
            title: "Test Feature 1",
            levelOfEffort: "Medium",
            status: "In Progress-Development",
            expandedHeading: "Test Heading 1",
            expandedDescription: "Test Description 1"
        },
        {
            id: 2,
            priority: 1,
            title: "Test Feature 2",
            levelOfEffort: "Large",
            status: "Not Started",
            expandedHeading: "Test Heading 2",
            expandedDescription: "Test Description 2"
        },
        {
            id: 3,
            priority: 3,
            title: "Test Feature 3",
            levelOfEffort: "Small",
            status: "Completed",
            expandedHeading: "Test Heading 3",
            expandedDescription: "Test Description 3"
        }
    ]
}));

// Mock the WhatsNextTableRow component
vi.mock("./WhatsNextTableRow", () => ({
    default: ({ item }) => (
        <tr data-testid={`table-row-${item.id}`}>
            <td>{item.priority}</td>
            <td>{item.title}</td>
            <td>{item.levelOfEffort}</td>
            <td>{item.status}</td>
        </tr>
    )
}));

describe("WhatsNextTable Component", () => {
    it("renders the table with correct headers", () => {
        render(<WhatsNextTable />);

        expect(screen.getByRole("columnheader", { name: "Priority" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Feature" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Level of Effort" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Status" })).toBeInTheDocument();
    });

    it("renders table rows in priority order (ascending)", () => {
        render(<WhatsNextTable />);

        const rows = screen.getAllByTestId(/^table-row-/);
        expect(rows).toHaveLength(3);

        // Check that rows are sorted by priority (1, 2, 3)
        expect(rows[0]).toHaveAttribute("data-testid", "table-row-2"); // priority 1
        expect(rows[1]).toHaveAttribute("data-testid", "table-row-1"); // priority 2
        expect(rows[2]).toHaveAttribute("data-testid", "table-row-3"); // priority 3
    });

    it("renders data in correct order based on priority", () => {
        render(<WhatsNextTable />);

        const priorityCells = screen.getAllByRole("cell").filter((cell, index) => index % 4 === 0);
        expect(priorityCells[0]).toHaveTextContent("1"); // First row should have priority 1
        expect(priorityCells[1]).toHaveTextContent("2"); // Second row should have priority 2
        expect(priorityCells[2]).toHaveTextContent("3"); // Third row should have priority 3
    });

    it("applies correct CSS classes to the table", () => {
        render(<WhatsNextTable />);

        const table = screen.getByRole("table");
        expect(table).toHaveClass("usa-table", "usa-table--borderless", "width-full");
    });

    it("renders all data fields correctly", () => {
        render(<WhatsNextTable />);

        // Check that all expected content is rendered
        expect(screen.getByText("Test Feature 1")).toBeInTheDocument();
        expect(screen.getByText("Test Feature 2")).toBeInTheDocument();
        expect(screen.getByText("Test Feature 3")).toBeInTheDocument();

        expect(screen.getByText("Medium")).toBeInTheDocument();
        expect(screen.getByText("Large")).toBeInTheDocument();
        expect(screen.getByText("Small")).toBeInTheDocument();

        expect(screen.getByText("In Progress-Development")).toBeInTheDocument();
        expect(screen.getByText("Not Started")).toBeInTheDocument();
        expect(screen.getByText("Completed")).toBeInTheDocument();
    });
});

describe("WhatsNextTable Component - Empty Data", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders 'No upcoming features' message when data is empty", async () => {
        // Mock empty data for this test
        vi.doMock("./data", () => ({
            data: []
        }));

        // Import component fresh with new mock
        const module = await import("./WhatsNextTable");
        const WhatsNextTableEmpty = module.default;

        render(<WhatsNextTableEmpty />);

        expect(screen.getByText("No upcoming features")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("renders 'No upcoming features' message when data is null", async () => {
        // Mock null data for this test
        vi.doMock("./data", () => ({
            data: null
        }));

        // Import component fresh with new mock
        const module = await import("./WhatsNextTable");
        const WhatsNextTableNull = module.default;

        render(<WhatsNextTableNull />);

        expect(screen.getByText("No upcoming features")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
});
