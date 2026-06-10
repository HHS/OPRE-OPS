import { fireEvent, render, screen, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { vi } from "vitest";
import store from "../../../store";
import PreAwardApprovalAlert from "./PreAwardApprovalAlert";
import * as opsAPI from "../../../api/opsAPI";

const mockDismissNotification = vi.fn().mockResolvedValue({});

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
    message:
        "This agreement has been declined for Pre-Award. Please do not upload the Final Consensus Memo to the HHS Consolidated Acquisition Solution (HCAS) until changes have been made and re-submitted for approval.",
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
        expect(screen.getByText(/This agreement has been declined for Pre-Award/)).toBeInTheDocument();
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
        expect(screen.getByText(/This agreement has been declined for Pre-Award/)).toBeInTheDocument();
    });

    it("should auto-dismiss approved notifications after 6 seconds", () => {
        vi.useFakeTimers();

        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[approvedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        // Initially notification is visible
        expect(screen.getByText("Pre-Award Approval Response")).toBeInTheDocument();

        // Dismiss should not have been called yet
        expect(mockDismissNotification).not.toHaveBeenCalled();

        // Fast-forward time by 6 seconds
        act(() => {
            vi.advanceTimersByTime(6000);
        });

        // Dismiss should have been called for the approved notification
        expect(mockDismissNotification).toHaveBeenCalledWith(1);

        vi.useRealTimers();
    });

    it("should NOT auto-dismiss declined notifications", () => {
        vi.useFakeTimers();

        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[declinedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        // Initially notification is visible
        expect(screen.getByText("Pre-Award Approval Response")).toBeInTheDocument();

        // Fast-forward time by 6 seconds
        act(() => {
            vi.advanceTimersByTime(6000);
        });

        // Dismiss should NOT have been called for declined notification
        expect(mockDismissNotification).not.toHaveBeenCalled();

        vi.useRealTimers();
    });

    it("should auto-dismiss only approved notifications when both types present", () => {
        vi.useFakeTimers();

        render(
            <Provider store={store}>
                <PreAwardApprovalAlert
                    notifications={[approvedNotification, declinedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        // Fast-forward time by 6 seconds
        act(() => {
            vi.advanceTimersByTime(6000);
        });

        // Dismiss should only be called for the approved notification (id: 1)
        expect(mockDismissNotification).toHaveBeenCalledTimes(1);
        expect(mockDismissNotification).toHaveBeenCalledWith(1);
        expect(mockDismissNotification).not.toHaveBeenCalledWith(2);

        vi.useRealTimers();
    });
});
