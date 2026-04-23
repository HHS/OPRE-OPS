import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { vi } from "vitest";
import store from "../../../store";
import PreAwardApprovalAlert from "./PreAwardApprovalAlert";
import * as opsAPI from "../../../api/opsAPI";

const mockDismissNotification = vi.fn();

vi.spyOn(opsAPI, "useDismissNotificationMutation").mockReturnValue([
    mockDismissNotification,
    { isError: false, error: null }
]);

const approvedNotification = {
    id: 1,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Response",
    message: "Your pre-award approval request has been approved by John Doe.",
    is_read: false,
    procurement_tracker_step: {
        id: 5,
        step_type: "PRE_AWARD",
        approval_status: "APPROVED",
        approval_requested: true
    }
};

const declinedNotification = {
    id: 2,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Response",
    message: "Your pre-award approval request has been declined by Jane Smith.",
    is_read: false,
    procurement_tracker_step: {
        id: 5,
        step_type: "PRE_AWARD",
        approval_status: "DECLINED",
        approval_requested: true
    }
};

const requestNotification = {
    id: 3,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Request",
    message: "A pre-award approval has been requested.",
    is_read: false,
    procurement_tracker_step: {
        id: 5,
        step_type: "PRE_AWARD",
        approval_status: null,
        approval_requested: true
    }
};

const readNotification = {
    id: 4,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Response",
    message: "Already read notification.",
    is_read: true,
    procurement_tracker_step: {
        id: 5,
        step_type: "PRE_AWARD",
        approval_status: "APPROVED",
        approval_requested: true
    }
};

describe("PreAwardApprovalAlert", () => {
    beforeEach(() => {
        mockDismissNotification.mockClear();
    });

    it("should render approved alert with success type", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[approvedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.getByText("Pre-Award Approval Response")).toBeInTheDocument();
        expect(screen.getByText(/Your pre-award approval request has been approved by John Doe/)).toBeInTheDocument();
    });

    it("should render declined alert with error type", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[declinedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.getByText("Pre-Award Approval Response")).toBeInTheDocument();
        expect(screen.getByText(/Your pre-award approval request has been declined by Jane Smith/)).toBeInTheDocument();
    });

    it("should NOT render request alert (only shows Approved/Declined)", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[requestNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        // Request notifications are filtered out - only Approved/Declined show in PreAwardApprovalAlert
        expect(screen.queryByText("Pre-Award Approval Request")).not.toBeInTheDocument();
        expect(screen.queryByText(/A pre-award approval has been requested/)).not.toBeInTheDocument();
    });

    it("should call dismissNotification when close button clicked", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[approvedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        const closeButton = screen.getByRole("img", { name: "close" });
        fireEvent.click(closeButton);

        expect(mockDismissNotification).toHaveBeenCalledWith(1);
    });

    it("should hide component when isVisible is false", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[approvedNotification]}
                    isVisible={false}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByText("Pre-Award Approval Approved")).not.toBeInTheDocument();
    });

    it("should hide component when no notifications", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("should filter out read notifications", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[readNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByText("Pre-Award Approval Approved")).not.toBeInTheDocument();
    });

    it("should filter out non-pre-award notifications", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[
                        {
                            id: 5,
                            notification_type: "CHANGE_REQUEST_NOTIFICATION",
                            title: "Change Request",
                            message: "A change request.",
                            is_read: false
                        }
                    ]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByText("Change Request")).not.toBeInTheDocument();
    });

    it("should render multiple notifications", () => {
        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[approvedNotification, declinedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.getAllByText("Pre-Award Approval Response")).toHaveLength(2);
        expect(screen.getByText(/Your pre-award approval request has been approved by John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Your pre-award approval request has been declined by Jane Smith/)).toBeInTheDocument();
    });
});
