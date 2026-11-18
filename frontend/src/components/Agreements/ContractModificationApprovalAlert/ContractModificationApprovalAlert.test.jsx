import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { vi } from "vitest";
import store from "../../../store";
import ContractModificationApprovalAlert from "./ContractModificationApprovalAlert";
import * as opsAPI from "../../../api/opsAPI";

const mockDismissNotification = vi.fn().mockResolvedValue({});

vi.spyOn(opsAPI, "useDismissNotificationMutation").mockReturnValue([
    mockDismissNotification,
    { isError: false, error: null }
]);

const mockGetAgreementContractModificationsById = vi.spyOn(opsAPI, "useGetAgreementContractModificationsByIdQuery");

const mockRequests = (requests, isSuccess = true) =>
    mockGetAgreementContractModificationsById.mockReturnValue({ data: requests, isSuccess });

const reviewOutcome = (id, status, reviewer_notes = null, requestId = 9) => ({
    id,
    notification_type: "CONTRACT_MODIFICATION_REQUEST_NOTIFICATION",
    title: `Contract Modification ${status === "APPROVED" ? "Approved" : "Declined"}`,
    message: "Outcome message",
    contract_modification_request: { id: requestId, agreement_id: 42, status, reviewer_notes }
});

const renderAlert = (notifications, isVisible = true) =>
    render(
        <Provider store={store}>
            <ContractModificationApprovalAlert
                agreementId={42}
                notifications={notifications}
                isVisible={isVisible}
            />
        </Provider>
    );

describe("ContractModificationApprovalAlert", () => {
    beforeEach(() => {
        mockDismissNotification.mockClear();
        mockRequests([]);
    });

    it("shows an approved modification", () => {
        mockRequests([{ id: 9, status: "APPROVED" }]);
        renderAlert([reviewOutcome(78, "APPROVED")]);

        expect(screen.getByRole("heading", { name: "Contract Modification Approved" })).toBeInTheDocument();
    });

    it("shows a declined modification with the Director's notes, and dismisses it", () => {
        mockRequests([{ id: 9, status: "DECLINED" }]);
        renderAlert([reviewOutcome(77, "DECLINED", "Let's talk Tuesday")]);

        expect(screen.getByRole("heading", { name: "Contract Modification Declined" })).toBeInTheDocument();
        expect(screen.getByText("Let's talk Tuesday")).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText("close"));
        expect(mockDismissNotification).toHaveBeenCalledWith(77);
    });

    it("shows only the latest modification's outcome and marks earlier outcomes read", () => {
        // Newest first: request 11 was declined after request 9 was.
        mockRequests([
            { id: 11, status: "DECLINED" },
            { id: 9, status: "DECLINED" }
        ]);
        renderAlert([reviewOutcome(80, "DECLINED", "Second try", 11), reviewOutcome(77, "DECLINED", "First try", 9)]);

        expect(screen.getAllByRole("heading", { name: "Contract Modification Declined" })).toHaveLength(1);
        expect(screen.getByText("Second try")).toBeInTheDocument();
        expect(mockDismissNotification).toHaveBeenCalledWith(77);
        expect(mockDismissNotification).not.toHaveBeenCalledWith(80);
    });

    it("hides an earlier outcome once a newer modification supersedes it", () => {
        mockRequests([
            { id: 11, status: "IN_REVIEW" },
            { id: 9, status: "DECLINED" }
        ]);
        renderAlert([reviewOutcome(77, "DECLINED", "First try", 9)]);

        expect(screen.queryByRole("heading", { name: "Contract Modification Declined" })).toBeNull();
        expect(mockDismissNotification).toHaveBeenCalledWith(77);
    });

    it("doesn't mark anything read before the modifications have loaded", () => {
        mockRequests([], false);
        renderAlert([reviewOutcome(77, "DECLINED", "First try", 9)]);

        expect(mockDismissNotification).not.toHaveBeenCalled();
    });

    it("renders nothing when not visible", () => {
        mockRequests([{ id: 9, status: "APPROVED" }]);
        renderAlert([reviewOutcome(78, "APPROVED")], false);

        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("renders nothing when there's no outcome notification", () => {
        renderAlert([]);

        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
});
