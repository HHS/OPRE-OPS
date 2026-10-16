import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoadmapStatusCard from "./RoadmapStatusCard";

vi.mock("../roadmapData.json", () => ({
    default: [
        { id: 1, title: "Login", status: "Done" },
        { id: 2, title: "Navigation", status: "Done" },
        { id: 3, title: "Viewing Award & Mod info", status: "Currently Developing" },
        { id: 4, title: "Zebra Feature", status: "Not Started Yet" },
        { id: 5, title: "Apple Feature", status: "Not Started Yet" }
    ]
}));

describe("RoadmapStatusCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders a count for each column", () => {
        render(<RoadmapStatusCard />);

        expect(within(screen.getByTestId("roadmap-column-Done")).getByText("2")).toBeInTheDocument();
        expect(within(screen.getByTestId("roadmap-column-Currently Developing")).getByText("1")).toBeInTheDocument();
        expect(within(screen.getByTestId("roadmap-column-Not Started Yet")).getByText("2")).toBeInTheDocument();
    });

    it("renders column headings using Figma's labels, including the asterisk only on Up Next / Later", () => {
        render(<RoadmapStatusCard />);

        expect(screen.getByRole("heading", { level: 3, name: "Ready to Use" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "In Progress" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Up Next / Later*" })).toBeInTheDocument();
    });

    it("renders Done and Currently Developing items in authored order (not sorted)", () => {
        render(<RoadmapStatusCard />);

        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByText("Navigation")).toBeInTheDocument();
        expect(screen.getByText("Viewing Award & Mod info")).toBeInTheDocument();
    });

    it("renders Not Started Yet items sorted alphabetically", () => {
        render(<RoadmapStatusCard />);

        const column = screen.getByTestId("roadmap-column-Not Started Yet");
        const tagTexts = within(column)
            .getAllByText(/Feature$/)
            .map((el) => el.textContent);

        expect(tagTexts).toEqual(["Apple Feature", "Zebra Feature"]);
    });

    it("renders the alphabetical-order footnote once, below all columns rather than nested under one", () => {
        render(<RoadmapStatusCard />);

        expect(screen.getByText(/Features are listed in alphabetical order/)).toBeInTheDocument();

        const doneColumn = screen.getByTestId("roadmap-column-Done");
        expect(within(doneColumn).queryByText(/Features are listed in alphabetical order/)).not.toBeInTheDocument();

        const currentlyDevelopingColumn = screen.getByTestId("roadmap-column-Currently Developing");
        expect(
            within(currentlyDevelopingColumn).queryByText(/Features are listed in alphabetical order/)
        ).not.toBeInTheDocument();

        const notStartedColumn = screen.getByTestId("roadmap-column-Not Started Yet");
        expect(
            within(notStartedColumn).queryByText(/Features are listed in alphabetical order/)
        ).not.toBeInTheDocument();
    });

    it("renders the Done tag using the corrected can-budget-by-fy-graph-3 green, not the old graph-4", () => {
        render(<RoadmapStatusCard />);

        const doneColumn = screen.getByTestId("roadmap-column-Done");
        expect(within(doneColumn).getByText("Login")).toHaveClass("bg-brand-can-budget-by-fy-graph-3");
        expect(within(doneColumn).getByText("Login")).not.toHaveClass("bg-brand-can-budget-by-fy-graph-4");
    });

    it("renders the In Progress tag text in data-viz-bl-by-status-5, matching Figma, not the generic text-ink", () => {
        render(<RoadmapStatusCard />);

        const inProgressColumn = screen.getByTestId("roadmap-column-Currently Developing");
        const tag = within(inProgressColumn).getByText("Viewing Award & Mod info");
        expect(tag).toHaveClass("text-brand-data-viz-bl-by-status-5");
        expect(tag).not.toHaveClass("text-ink");
    });
});
