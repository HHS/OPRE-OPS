import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import CurrentlyDevelopingCard from "./CurrentlyDevelopingCard";

vi.mock("./roadmapData.json", () => ({
    default: [
        { id: 1, title: "Finish Procurement Tracker", status: "Currently Developing" },
        { id: 2, title: "View & Edit Grants", status: "Currently Developing" },
        { id: 3, title: "Staffing/People Teams", status: "Not Started Yet" },
        { id: 4, title: "Award Grants", status: "Not Started Yet" },
        { id: 5, title: "Contract Mods", status: "Not Started Yet" },
        { id: 6, title: "Login", status: "Done" }
    ]
}));

describe("CurrentlyDevelopingCard", () => {
    it("renders the Currently Developing column heading", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("Currently Developing")).toBeInTheDocument();
    });

    it("renders the Next Up column heading", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("Next Up")).toBeInTheDocument();
    });

    it("renders currently developing item tags", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("Finish Procurement Tracker")).toBeInTheDocument();
        expect(screen.getByText("View & Edit Grants")).toBeInTheDocument();
    });

    it("renders next up item tags", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("Staffing/People Teams")).toBeInTheDocument();
        expect(screen.getByText("Award Grants")).toBeInTheDocument();
        expect(screen.getByText("Contract Mods")).toBeInTheDocument();
    });

    it("renders the count of currently developing items", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("excludes Done items from both columns", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.queryByText("Login")).not.toBeInTheDocument();
    });
});
