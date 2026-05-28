import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import CANHistoryPanel from "./CANHistoryPanel";
import { useGetCanHistoryQuery } from "../../../api/opsAPI";

vi.mock("../../../api/opsAPI");

describe("CANHistoryPanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders history items when data is returned", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: {
                items: [
                    {
                        id: 1,
                        history_title: "CAN Created",
                        history_message: "CAN was created by admin",
                        timestamp: "2025-03-01T10:00:00Z"
                    },
                    {
                        id: 2,
                        history_title: "Budget Updated",
                        history_message: "Budget changed to $50,000",
                        timestamp: "2025-03-02T12:00:00Z"
                    }
                ],
                count: 2
            },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("CAN Created")).toBeInTheDocument();
        expect(screen.getByText("Budget Updated")).toBeInTheDocument();
    });

    it("renders 'No History' when no items are returned", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: {
                items: [],
                count: 0
            },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("No History")).toBeInTheDocument();
    });

    it("stops infinite scroll when offset + limit >= count", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: {
                items: [
                    {
                        id: 1,
                        history_title: "CAN Created",
                        history_message: "CAN was created",
                        timestamp: "2025-03-01T10:00:00Z"
                    }
                ],
                count: 1
            },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("CAN Created")).toBeInTheDocument();
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("renders 'No History' when data is undefined (loading)", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: undefined,
            isError: false,
            isLoading: true,
            isFetching: true
        });

        render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("No History")).toBeInTheDocument();
    });

    it("stops scrolling on error", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: undefined,
            isError: true,
            isLoading: false,
            isFetching: false
        });

        render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("No History")).toBeInTheDocument();
    });

    it("passes correct params to the query hook", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: { items: [], count: 0 },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        render(
            <CANHistoryPanel
                canId={501}
                fiscalYear={2026}
            />
        );

        expect(useGetCanHistoryQuery).toHaveBeenCalledWith({
            canId: 501,
            limit: 5,
            offset: 0,
            fiscalYear: 2026
        });
    });

    it("resets history when fiscal year changes", () => {
        useGetCanHistoryQuery.mockReturnValue({
            data: {
                items: [
                    {
                        id: 1,
                        history_title: "FY 2025 Event",
                        history_message: "Something happened",
                        timestamp: "2025-03-01T10:00:00Z"
                    }
                ],
                count: 1
            },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        const { rerender } = render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getByText("FY 2025 Event")).toBeInTheDocument();

        useGetCanHistoryQuery.mockReturnValue({
            data: {
                items: [
                    {
                        id: 2,
                        history_title: "FY 2026 Event",
                        history_message: "New year event",
                        timestamp: "2026-01-15T10:00:00Z"
                    }
                ],
                count: 1
            },
            isError: false,
            isLoading: false,
            isFetching: false
        });

        rerender(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2026}
            />
        );

        expect(screen.getByText("FY 2026 Event")).toBeInTheDocument();
        expect(screen.queryByText("FY 2025 Event")).not.toBeInTheDocument();
    });

    it("does not duplicate items on re-render with same data", () => {
        const mockData = {
            data: {
                items: [
                    {
                        id: 1,
                        history_title: "CAN Created",
                        history_message: "CAN was created",
                        timestamp: "2025-03-01T10:00:00Z"
                    }
                ],
                count: 1
            },
            isError: false,
            isLoading: false,
            isFetching: false
        };

        useGetCanHistoryQuery.mockReturnValue(mockData);

        const { rerender } = render(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getAllByText("CAN Created")).toHaveLength(1);

        rerender(
            <CANHistoryPanel
                canId={500}
                fiscalYear={2025}
            />
        );

        expect(screen.getAllByText("CAN Created")).toHaveLength(1);
    });
});
