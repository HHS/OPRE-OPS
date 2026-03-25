import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TagList from "./TagList";

describe("TagList", () => {
    it("renders TBD when items are empty", () => {
        render(<TagList items={[]} />);

        expect(screen.getByText("TBD")).toBeInTheDocument();
    });

    it("renders one tag per item", () => {
        render(<TagList items={["Alpha", "Beta", "Gamma"]} />);

        expect(screen.getByText("Alpha")).toBeInTheDocument();
        expect(screen.getByText("Beta")).toBeInTheDocument();
        expect(screen.getByText("Gamma")).toBeInTheDocument();
    });

    it("uses vertical-first columns with five rows per column by default", () => {
        render(<TagList items={["One", "Two", "Three", "Four", "Five", "Six"]} />);
        const root = screen.getByTestId("tag-list-root");
        const columns = screen.getAllByTestId("tag-list-column");

        expect(root).toHaveStyle({
            display: "flex",
            flexDirection: "row"
        });

        expect(columns).toHaveLength(2);
    });

    it("caps at two columns and keeps vertical-first ordering when more than ten exist", () => {
        const items = Array.from({ length: 11 }, (_, index) => `Item ${index + 1}`);
        render(<TagList items={items} />);
        const columns = screen.getAllByTestId("tag-list-column");

        expect(columns).toHaveLength(2);
        expect(columns[0]).toHaveTextContent("Item 1");
        expect(columns[0]).toHaveTextContent("Item 5");
        expect(columns[0]).not.toHaveTextContent("Item 6");
        expect(columns[1]).toHaveTextContent("Item 6");
        expect(columns[1]).toHaveTextContent("Item 9");
        expect(columns[1]).toHaveTextContent("Item 10");
        expect(columns[1]).not.toHaveTextContent("Item 11");
    });
});
