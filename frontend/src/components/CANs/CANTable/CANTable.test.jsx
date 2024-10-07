import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useGetCanFundingSummaryQuery, useGetCansQuery } from "../../../api/opsAPI";
import { cans } from "../../../tests/data";
import CANTable from "./CANTable";

// Mock the PaginationNav component
vi.mock("../../UI/PaginationNav", () => ({
    default: () => <div data-testid="pagination-nav" />
}));

// Mock the Tooltip component
vi.mock("../../UI/USWDS/Tooltip", () => ({
    default: ({ children }) => <div data-testid="tooltip">{children}</div>
}));
vi.mock("../../../api/opsAPI");

describe("CANTable", () => {
    useGetCansQuery.mockReturnValue({
        data: cans
    });
    useGetCanFundingSummaryQuery.mockReturnValue({
        data: {
            fundingSummary: {
                available_funding: 1000
            }
        }
    });
    it("renders the table with correct headers", () => {
        render(
            <MemoryRouter>
                <CANTable cans={cans} />
            </MemoryRouter>
        );

        expect(screen.getByText("CAN")).toBeInTheDocument();
        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("FY")).toBeInTheDocument();
        expect(screen.getByText("Active Period")).toBeInTheDocument();
        expect(screen.getByText("Obligate By")).toBeInTheDocument();
        expect(screen.getByText("Transfer")).toBeInTheDocument();
        expect(screen.getByText("FY Budget")).toBeInTheDocument();
        expect(screen.getByText("$ Available")).toBeInTheDocument();
    });

    it("renders the correct number of rows", () => {
        render(
            <MemoryRouter>
                <CANTable cans={cans} />
            </MemoryRouter>
        );

        const rows = screen.getAllByRole("row");
        // +1 for the header row
        expect(rows.length).toBe(cans.length + 1);
    });

    it('displays "No CANs found" when cans array is empty', () => {
        render(
            <MemoryRouter>
                <CANTable cans={[]} />
            </MemoryRouter>
        );

        expect(screen.getByText("No CANs found")).toBeInTheDocument();
    });

    it("renders PaginationNav when there are CANs", () => {
        render(
            <MemoryRouter>
                <CANTable cans={cans} />
            </MemoryRouter>
        );

        expect(screen.getByTestId("pagination-nav")).toBeInTheDocument();
    });

    it("does not render PaginationNav when there are no CANs", () => {
        render(
            <MemoryRouter>
                <CANTable cans={[]} />
            </MemoryRouter>
        );

        expect(screen.queryByTestId("pagination-nav")).not.toBeInTheDocument();
    });
});
