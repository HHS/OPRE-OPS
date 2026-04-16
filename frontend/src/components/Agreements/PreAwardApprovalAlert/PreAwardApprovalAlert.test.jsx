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
    title: "Pre-Award Approval Approved",
    message: "Your pre-award approval request has been approved by John Doe.",
    is_read: false
};

const declinedNotification = {
    id: 2,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Declined",
    message: "Your pre-award approval request has been declined by Jane Smith.",
    is_read: false
};

const requestNotification = {
    id: 3,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Request",
    message: "A pre-award approval has been requested.",
    is_read: false
};

const readNotification = {
    id: 4,
    notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
    title: "Pre-Award Approval Approved",
    message: "Already read notification.",
    is_read: true
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

        expect(screen.getByText("Pre-Award Approval Approved")).toBeInTheDocument();
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

        expect(screen.getByText("Pre-Award Approval Declined")).toBeInTheDocument();
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

        expect(screen.getByText("Pre-Award Approval Approved")).toBeInTheDocument();
        expect(screen.getByText("Pre-Award Approval Declined")).toBeInTheDocument();
    });
});
