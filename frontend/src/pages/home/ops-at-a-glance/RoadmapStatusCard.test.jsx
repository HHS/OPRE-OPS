import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RoadmapStatusCard from "./RoadmapStatusCard";

vi.mock("./data", () => ({
    data: [
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

    it("renders column headings, including the asterisk only on Not Started Yet", () => {
        render(<RoadmapStatusCard />);

        expect(screen.getByRole("heading", { level: 3, name: "Done" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Currently Developing" })).toBeInTheDocument();
        expect(screen.getByRole("heading", { level: 3, name: "Not Started Yet *" })).toBeInTheDocument();
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

    it("renders the alphabetical-order footnote only under Not Started Yet", () => {
        render(<RoadmapStatusCard />);

        const notStartedColumn = screen.getByTestId("roadmap-column-Not Started Yet");
        expect(within(notStartedColumn).getByText(/Features are listed in alphabetical order/)).toBeInTheDocument();

        const doneColumn = screen.getByTestId("roadmap-column-Done");
        expect(within(doneColumn).queryByText(/Features are listed in alphabetical order/)).not.toBeInTheDocument();
    });
});
