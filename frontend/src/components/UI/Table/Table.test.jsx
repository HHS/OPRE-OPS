import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Table from "./Table";

const headings = [
    { heading: "BL ID #", value: "ID_NUMBER" },
    { heading: "Notes", value: "" }
];

describe("Table", () => {
    it("does not render a sort button for a header with an empty value", () => {
        render(<Table tableHeadings={headings} />);

        expect(screen.getByRole("button", { name: /BL ID #/ })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Notes" })).not.toBeInTheDocument();
        expect(screen.getByText("Notes")).toBeInTheDocument();
    });

    it("keeps aria-sort none on a non-sortable header even when selectedHeader matches its empty value", () => {
        render(
            <Table
                tableHeadings={headings}
                selectedHeader=""
                sortDescending={false}
            />
        );

        expect(screen.getByRole("columnheader", { name: "Notes" })).toHaveAttribute("aria-sort", "none");
    });

    it("does not call onClickHeader when a non-sortable header is clicked", () => {
        const onClickHeader = vi.fn();
        render(
            <Table
                tableHeadings={headings}
                onClickHeader={onClickHeader}
            />
        );

        fireEvent.click(screen.getByText("Notes"));

        expect(onClickHeader).not.toHaveBeenCalled();
    });

    it("renders a screen-reader label for a non-sortable header with an empty heading", () => {
        render(<Table tableHeadings={[...headings, { heading: "", value: "" }]} />);

        // Guards the empty-table-header a11y violation: an empty <th> must still
        // expose discernible text (the expand column) for screen readers.
        expect(screen.getByRole("columnheader", { name: "Expand row" })).toBeInTheDocument();
    });

    it("still supports sorting and shows the arrow on a sortable selected header", () => {
        render(
            <Table
                tableHeadings={headings}
                selectedHeader="ID_NUMBER"
                sortDescending={false}
                onClickHeader={vi.fn()}
            />
        );

        expect(screen.getByRole("columnheader", { name: "BL ID #" })).toHaveAttribute("aria-sort", "ascending");
    });
});
