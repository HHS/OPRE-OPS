import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgreementHistoryPanel from "./AgreementHistoryPanel";

const mockGetAgreementHistoryByIdAndPage = vi.fn();

vi.mock("../../../api/getAgreementHistory", () => ({
    getAgreementHistoryByIdAndPage: (...args) => mockGetAgreementHistoryByIdAndPage(...args)
}));

let intersectionCallback;

beforeEach(() => {
    mockGetAgreementHistoryByIdAndPage.mockReset();
    intersectionCallback = null;

    global.IntersectionObserver = class {
        constructor(callback) {
            intersectionCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

const triggerIntersection = () => {
    if (intersectionCallback) {
        intersectionCallback([{ isIntersecting: true }]);
    }
};

describe("AgreementHistoryPanel", () => {
    it("renders the history container", () => {
        mockGetAgreementHistoryByIdAndPage.mockResolvedValue({
            data: [],
            count: 0,
            limit: 20,
            offset: 0
        });

        render(<AgreementHistoryPanel agreementId={1} />);
        expect(screen.getByRole("region", { name: "Agreement History" })).toBeInTheDocument();
    });

    it("fetches and displays history items", async () => {
        mockGetAgreementHistoryByIdAndPage.mockResolvedValue({
            data: [
                {
                    id: 1,
                    history_title: "Agreement Created",
                    history_message: "Agreement created by Test User.",
                    timestamp: "2025-01-01T00:00:00.000000Z"
                },
                {
                    id: 2,
                    history_title: "Agreement Updated",
                    history_message: "Description changed.",
                    timestamp: "2025-01-02T00:00:00.000000Z"
                }
            ],
            count: 2,
            limit: 20,
            offset: 0
        });

        render(<AgreementHistoryPanel agreementId={1} />);
        triggerIntersection();

        await waitFor(() => {
            expect(screen.getByText("Agreement Created")).toBeInTheDocument();
            expect(screen.getByText("Agreement Updated")).toBeInTheDocument();
        });
    });

    it("stops scrolling when offset + limit >= count", async () => {
        mockGetAgreementHistoryByIdAndPage.mockResolvedValue({
            data: [
                {
                    id: 1,
                    history_title: "Agreement Created",
                    history_message: "Agreement created by Test User.",
                    timestamp: "2025-01-01T00:00:00.000000Z"
                }
            ],
            count: 1,
            limit: 20,
            offset: 0
        });

        render(<AgreementHistoryPanel agreementId={1} />);
        triggerIntersection();

        await waitFor(() => {
            expect(screen.getByText("Agreement Created")).toBeInTheDocument();
        });

        expect(screen.queryByTestId("infinite-scroll-trigger")).not.toBeInTheDocument();
    });

    it("continues scrolling when more data is available", async () => {
        mockGetAgreementHistoryByIdAndPage.mockResolvedValue({
            data: Array.from({ length: 20 }, (_, i) => ({
                id: i + 1,
                history_title: `Event ${i + 1}`,
                history_message: `Message ${i + 1}`,
                timestamp: `2025-01-${String(i + 1).padStart(2, "0")}T00:00:00.000000Z`
            })),
            count: 40,
            limit: 20,
            offset: 0
        });

        render(<AgreementHistoryPanel agreementId={1} />);
        triggerIntersection();

        await waitFor(() => {
            expect(screen.getByText("Event 1")).toBeInTheDocument();
        });

        expect(mockGetAgreementHistoryByIdAndPage).toHaveBeenCalledWith(1, 1);
    });

    it("passes the correct agreement id and page to the API", async () => {
        mockGetAgreementHistoryByIdAndPage.mockResolvedValue({
            data: [],
            count: 0,
            limit: 20,
            offset: 0
        });

        render(<AgreementHistoryPanel agreementId={42} />);
        triggerIntersection();

        await waitFor(() => {
            expect(mockGetAgreementHistoryByIdAndPage).toHaveBeenCalledWith(42, 1);
        });
    });
});
