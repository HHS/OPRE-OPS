import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import ProjectHistoryPanel from "./ProjectHistoryPanel";
import { getProjectHistoryByIdAndPage } from "../../../api/getProjectHistory";

vi.mock("../../../api/getProjectHistory");

// Capture each InfiniteScroll's fetchMoreData so the test can drive pagination directly.
let capturedFetchMoreData;
vi.mock("../../Agreements/AgreementDetails/InfiniteScroll", () => ({
    default: ({ fetchMoreData }) => {
        capturedFetchMoreData = fetchMoreData;
        return <div data-testid="infinite-scroll-sentinel" />;
    }
}));

describe("ProjectHistoryPanel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedFetchMoreData = undefined;
    });

    it("renders 'No History' before the first fetch resolves", () => {
        getProjectHistoryByIdAndPage.mockResolvedValue({
            items: [],
            count: 0,
            limit: 20,
            offset: 0
        });
        render(<ProjectHistoryPanel projectId={1000} />);
        expect(screen.getByText("No History")).toBeInTheDocument();
    });

    it("renders history items after fetchMoreData resolves", async () => {
        getProjectHistoryByIdAndPage.mockResolvedValue({
            items: [
                {
                    id: 1,
                    history_title: "Project Created",
                    history_message: "Project created by Amelia.",
                    timestamp: "2026-01-01T00:00:00.000000Z"
                },
                {
                    id: 2,
                    history_title: "Change to Project Title",
                    history_message: "Amelia changed the Project Title from A to B.",
                    timestamp: "2026-01-02T00:00:00.000000Z"
                }
            ],
            count: 2,
            limit: 20,
            offset: 0
        });

        render(<ProjectHistoryPanel projectId={1000} />);
        await capturedFetchMoreData();

        expect(await screen.findByText("Project Created")).toBeInTheDocument();
        expect(await screen.findByText("Change to Project Title")).toBeInTheDocument();
    });

    it("calls the helper with page 1 on first fetch and page 2 on second", async () => {
        getProjectHistoryByIdAndPage
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 1,
                        history_title: "Title A",
                        history_message: "msg A",
                        timestamp: "2026-01-01T00:00:00.000000Z"
                    }
                ],
                count: 50,
                limit: 20,
                offset: 0
            })
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 2,
                        history_title: "Title B",
                        history_message: "msg B",
                        timestamp: "2026-01-02T00:00:00.000000Z"
                    }
                ],
                count: 50,
                limit: 20,
                offset: 20
            });

        render(<ProjectHistoryPanel projectId={1000} />);
        await capturedFetchMoreData();
        expect(await screen.findByText("Title A")).toBeInTheDocument();
        await capturedFetchMoreData();
        expect(await screen.findByText("Title B")).toBeInTheDocument();

        expect(getProjectHistoryByIdAndPage).toHaveBeenNthCalledWith(1, 1000, 1);
        expect(getProjectHistoryByIdAndPage).toHaveBeenNthCalledWith(2, 1000, 2);
    });

    it("stops fetching once offset + limit >= count", async () => {
        getProjectHistoryByIdAndPage.mockResolvedValue({
            items: [
                {
                    id: 1,
                    history_title: "Only one",
                    history_message: "msg",
                    timestamp: "2026-01-01T00:00:00.000000Z"
                }
            ],
            count: 1,
            limit: 20,
            offset: 0
        });

        render(<ProjectHistoryPanel projectId={1000} />);
        await capturedFetchMoreData();
        expect(await screen.findByText("Only one")).toBeInTheDocument();

        // After stopping, the InfiniteScroll sentinel should be gone.
        expect(screen.queryByTestId("infinite-scroll-sentinel")).not.toBeInTheDocument();
    });

    it("stops scrolling on error", async () => {
        getProjectHistoryByIdAndPage.mockRejectedValue(new Error("boom"));
        render(<ProjectHistoryPanel projectId={1000} />);
        await capturedFetchMoreData();
        // Empty state still rendered; sentinel removed because stopped is true.
        expect(await screen.findByText("No History")).toBeInTheDocument();
        expect(screen.queryByTestId("infinite-scroll-sentinel")).not.toBeInTheDocument();
    });

    it("deduplicates items returned across pages", async () => {
        getProjectHistoryByIdAndPage
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 1,
                        history_title: "Title A",
                        history_message: "msg A",
                        timestamp: "2026-01-01T00:00:00.000000Z"
                    }
                ],
                count: 50,
                limit: 20,
                offset: 0
            })
            .mockResolvedValueOnce({
                items: [
                    {
                        id: 1,
                        history_title: "Title A",
                        history_message: "msg A",
                        timestamp: "2026-01-01T00:00:00.000000Z"
                    }
                ],
                count: 50,
                limit: 20,
                offset: 20
            });

        render(<ProjectHistoryPanel projectId={1000} />);
        await capturedFetchMoreData();
        expect(await screen.findByText("Title A")).toBeInTheDocument();
        await capturedFetchMoreData();
        // Same id returned twice: only one row should be visible.
        expect(screen.getAllByText("Title A")).toHaveLength(1);
    });
});
