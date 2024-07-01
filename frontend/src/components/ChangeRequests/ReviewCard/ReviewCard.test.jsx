import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { useGetAgreementByIdQuery, useGetBudgetLineItemQuery, useGetCansQuery } from "../../../api/opsAPI";
import { useGetAgreementName, useGetBLIStatus } from "../../../hooks/lookup.hooks";
import { agreement, budgetLine } from "../../../tests/data";
import ReviewCard from "./ReviewCard";

vi.mock("../../../api/opsAPI");
vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: vi.fn(),
    useGetBLIStatus: vi.fn(),
    useGetAgreementName: vi.fn()
}));

describe("ReviewCard", () => {
    useGetBLIStatus.mockReturnValue("Draft");
    useGetAgreementName.mockReturnValue("Agreement Name");

    const handleReviewChangeRequestMock = vi.fn();

    const initialProps = {
        changeRequestId: 1,
        type: "Budget Change",
        agreementId: 1,
        actionIcons: false,
        requesterName: "Jane Doe",
        requestDate: "2024-06-12T21:25:25.744930Z",
        handleReviewChangeRequest: handleReviewChangeRequestMock,
        changeMsg: "change message"
    };

    beforeEach(() => {
        handleReviewChangeRequestMock.mockClear();
    });
    it("should render the ReviewCard component", async () => {
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });
        render(
            <BrowserRouter>
                <ReviewCard {...initialProps}>
                    <p>hello</p>
                </ReviewCard>
            </BrowserRouter>
        );

        const type = screen.getByText("Budget Change");
        const agreementName = await screen.findByText("Agreement Name");
        const requesterName = screen.getByText("Jane Doe");
        const requestDate = screen.getByText("June 12, 2024");
        const actionIcons = screen.queryByText("icons");

        expect(type).toBeInTheDocument();
        expect(agreementName).toBeInTheDocument();
        expect(requesterName).toBeInTheDocument();
        expect(requestDate).toBeInTheDocument();
        expect(actionIcons).not.toBeInTheDocument();
    });
    it("should handle clicking on the action icons", async () => {
        const user = userEvent.setup();

        useGetAgreementName.mockReturnValue("Agreement Name");
        useGetAgreementByIdQuery.mockReturnValue({ data: { agreement } });
        useGetBudgetLineItemQuery.mockReturnValue({ data: { budgetLine } });
        useGetCansQuery.mockReturnValue({ data: [agreement.budget_line_items[0].can] });

        render(
            <BrowserRouter>
                <ReviewCard
                    {...initialProps}
                    actionIcons={true}
                    forceHover={true}
                >
                    <p>hello</p>
                </ReviewCard>
            </BrowserRouter>
        );

        // Ensure the buttons appear
        const approveBtn = await screen.findByRole("button", { name: /approve/i });
        const declineBtn = await screen.findByRole("button", { name: /decline/i });

        // Click approve button and then expect the handleReviewChangeRequest to be called
        await user.click(approveBtn);

        expect(handleReviewChangeRequestMock).toHaveBeenCalledWith(
            1, // changeRequestId
            "APPROVE", // CHANGE_REQUEST_ACTION.APPROVE
            null,
            { agreementName: "Agreement Name", type: "Budget Change", bliToStatus: "", changeMsg: "change message" }
        );

        vi.clearAllMocks();
        await user.click(declineBtn);

        expect(handleReviewChangeRequestMock).toHaveBeenCalledWith(
            1, // changeRequestId
            "REJECT", // CHANGE_REQUEST_ACTION.REJECT
            null,
            { agreementName: "Agreement Name", type: "Budget Change", bliToStatus: "", changeMsg: "change message" }
        );
    });
});
