import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PaginationNav from "./PaginationNav";

describe("PaginationNav", () => {
    it("shows last page number when totalPages prop is not passed", () => {
        const items = Array.from({ length: 80 });
        render(
            <PaginationNav
                currentPage={1}
                setCurrentPage={vi.fn()}
                items={items}
                itemsPerPage={10}
            />
        );
        expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("shows last page number when totalPages prop is explicitly passed", () => {
        render(
            <PaginationNav
                currentPage={1}
                setCurrentPage={vi.fn()}
                totalPages={12}
            />
        );
        expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("does not render pagination slots for fewer than 7 pages", () => {
        const items = Array.from({ length: 30 });
        render(
            <PaginationNav
                currentPage={1}
                setCurrentPage={vi.fn()}
                items={items}
                itemsPerPage={10}
            />
        );
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.queryByText("4")).not.toBeInTheDocument();
    });

    it("navigates to next page when Next button is clicked", async () => {
        const user = userEvent.setup();
        const setCurrentPage = vi.fn();
        render(
            <PaginationNav
                currentPage={1}
                setCurrentPage={setCurrentPage}
                totalPages={5}
            />
        );
        await user.click(screen.getByLabelText("Next page"));
        expect(setCurrentPage).toHaveBeenCalledWith(2);
    });

    it("navigates to previous page when Previous button is clicked", async () => {
        const user = userEvent.setup();
        const setCurrentPage = vi.fn();
        render(
            <PaginationNav
                currentPage={3}
                setCurrentPage={setCurrentPage}
                totalPages={5}
            />
        );
        await user.click(screen.getByLabelText("Previous page"));
        expect(setCurrentPage).toHaveBeenCalledWith(2);
    });

    it("navigates to a specific page when page number is clicked", async () => {
        const user = userEvent.setup();
        const setCurrentPage = vi.fn();
        render(
            <PaginationNav
                currentPage={1}
                setCurrentPage={setCurrentPage}
                totalPages={10}
            />
        );
        await user.click(screen.getByLabelText("Page 4"));
        expect(setCurrentPage).toHaveBeenCalledWith(4);
    });
});
