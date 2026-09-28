import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { STATUSES } from "./constants";
import PrioritiesSummaryCard from "./PrioritiesSummaryCard";

const priorities = [
    { id: 1, priority: 3, title: "Third", status: STATUSES.NOT_STARTED, levelOfEffort: "Small" },
    { id: 2, priority: 1, title: "First", status: STATUSES.DEVELOPMENT, levelOfEffort: "Medium" },
    { id: 3, priority: 2, title: "Second", status: STATUSES.RESEARCH, levelOfEffort: "Large" },
    { id: 4, priority: 4, title: "Fourth", status: STATUSES.COMPLETED, levelOfEffort: "Small" }
];

describe("PrioritiesSummaryCard", () => {
    it("renders a heading for each column", () => {
        render(<PrioritiesSummaryCard priorities={priorities} />);

        expect(screen.getByRole("heading", { level: 3, name: "Currently Developing" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Next Up" })).toBeInTheDocument();
    });

    it("groups in-progress priorities under Currently Developing", () => {
        render(<PrioritiesSummaryCard priorities={priorities} />);

        expect(screen.getByText("First")).toBeInTheDocument();
        expect(screen.getByText("Second")).toBeInTheDocument();
    });

    it("groups not-started priorities under Next Up", () => {
        render(<PrioritiesSummaryCard priorities={priorities} />);

        expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("excludes priorities that are neither in progress nor not started", () => {
        render(<PrioritiesSummaryCard priorities={priorities} />);

        expect(screen.queryByText("Fourth")).not.toBeInTheDocument();
    });

    it("orders priorities ascending by priority", () => {
        render(<PrioritiesSummaryCard priorities={priorities} />);

        const developing = screen.getAllByRole("listitem").map((item) => item.textContent);

        expect(developing).toEqual(["First", "Second", "Third"]);
    });

    it("renders an empty state for a column with no priorities", () => {
        render(<PrioritiesSummaryCard priorities={[priorities[1]]} />);

        expect(screen.getByText("Nothing at this time")).toBeInTheDocument();
    });

    it("defaults to the static roadmap data", () => {
        render(<PrioritiesSummaryCard />);

        expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
    });
});
