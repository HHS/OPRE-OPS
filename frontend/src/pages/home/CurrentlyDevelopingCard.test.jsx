import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test-utils";
import CurrentlyDevelopingCard from "./CurrentlyDevelopingCard";

/*
    NOTE: 8 NOT_STARTED rows, deliberately more than the card's 6-item cap, so the cap and
    the per-card exclude list can both be exercised.

    Row ordering matters: id 25 (the excluded row) sits 4th among the NOT_STARTED rows, i.e.
    comfortably inside the first 6. That way "hides the per-card excluded item" fails if the
    `.filter()` is dropped from the component, instead of passing for free because the cap
    had already truncated that row away.
*/
vi.mock("./roadmapData.json", () => ({
    default: [
        { id: 1, title: "Finish Procurement Tracker", status: "Currently Developing" },
        { id: 2, title: "View & Edit Grants", status: "Currently Developing" },
        { id: 3, title: "Staffing/People Teams", status: "Not Started Yet" },
        { id: 4, title: "Award Grants", status: "Not Started Yet" },
        { id: 5, title: "Contract Mods", status: "Not Started Yet" },
        { id: 25, title: "Other Partner Agreements (IAA, IDDA, IPA)", status: "Not Started Yet" },
        { id: 7, title: "Next Up Five", status: "Not Started Yet" },
        { id: 8, title: "Next Up Six", status: "Not Started Yet" },
        { id: 9, title: "Next Up Seven", status: "Not Started Yet" },
        { id: 10, title: "Next Up Eight", status: "Not Started Yet" },
        { id: 6, title: "Login", status: "Done" }
    ]
}));

describe("CurrentlyDevelopingCard", () => {
    it("renders the In Progress column heading", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("In Progress")).toBeInTheDocument();
    });

    it("renders the Up Next column heading", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        expect(screen.getByText("Up Next")).toBeInTheDocument();
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

    it("renders the In Progress tag text in data-viz-bl-by-status-5, matching Figma, not the generic text-ink", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        const tag = screen.getByText("Finish Procurement Tracker");
        expect(tag).toHaveClass("text-brand-data-viz-bl-by-status-5");
        expect(tag).not.toHaveClass("text-ink");
    });

    it("caps the Up Next column at 6 items even though more Not Started items exist", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);

        // 7 render-eligible Not Started rows remain after the excluded one is filtered out,
        // so the cap must drop the last of them.
        [
            "Staffing/People Teams",
            "Award Grants",
            "Contract Mods",
            "Next Up Five",
            "Next Up Six",
            "Next Up Seven"
        ].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());
        expect(screen.queryByText("Next Up Eight")).not.toBeInTheDocument();
    });

    it("hides the per-card excluded item from Up Next", () => {
        renderWithProviders(<CurrentlyDevelopingCard />);
        // Sits inside the first 6 Not Started rows, so only the exclude list can remove it —
        // this fails if the component stops filtering NEXT_UP_EXCLUDED_IDS.
        expect(screen.queryByText("Other Partner Agreements (IAA, IDDA, IPA)")).not.toBeInTheDocument();
    });
});
