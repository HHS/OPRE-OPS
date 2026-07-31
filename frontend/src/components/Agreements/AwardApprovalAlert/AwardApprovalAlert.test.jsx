import { fireEvent, render, screen, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { vi } from "vitest";
import store from "../../../store";
import AwardApprovalAlert from "./AwardApprovalAlert";
import * as opsAPI from "../../../api/opsAPI";

const mockDismissNotification = vi.fn().mockResolvedValue({});

vi.spyOn(opsAPI, "useDismissNotificationMutation").mockReturnValue([
    mockDismissNotification,
    { isError: false, error: null }
]);

const approvedNotification = {
    id: 1,
    notification_type: "AWARD_APPROVAL_NOTIFICATION",
    title: "Award Approved",
    message: "The award for Agreement Test Agreement has been approved by John Doe.",
    is_read: false,
    procurement_tracker_step: {
        id: 5,
        step_type: "AWARD",
        approval_status: "APPROVED",
        approval_requested: true
    }
};

const requestNotification = {
    id: 3,
    notification_type: "AWARD_APPROVAL_NOTIFICATION",
    title: "Award Approval Request",
    message: "An award approval has been requested.",
    is_read: false,
    procurement_tracker_step: {
        id: 5,
        step_type: "AWARD",
        approval_status: null,
        approval_requested: true
    }
};

const readNotification = {
    id: 4,
    notification_type: "AWARD_APPROVAL_NOTIFICATION",
    title: "Award Approved",
    message: "Already read notification.",
    is_read: true,
    procurement_tracker_step: {
        id: 5,
        step_type: "AWARD",
        approval_status: "APPROVED",
        approval_requested: true
    }
};

describe("AwardApprovalAlert", () => {
    beforeEach(() => {
        mockDismissNotification.mockClear();
    });

    it("should render approved alert with success type", () => {
        render(
            <Provider store={store}>
                <AwardApprovalAlert
                    notifications={[approvedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.getByText("Award Approved")).toBeInTheDocument();
        expect(
            screen.getByText(/The award for Agreement Test Agreement has been approved by John Doe/)
        ).toBeInTheDocument();
    });

    it("should NOT render request alert (only shows Approved)", () => {
        render(
            <Provider store={store}>
                <AwardApprovalAlert
                    notifications={[requestNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        // Request notifications are filtered out - only Approved shows in AwardApprovalAlert
        expect(screen.queryByText("Award Approval Request")).not.toBeInTheDocument();
        expect(screen.queryByText(/An award approval has been requested/)).not.toBeInTheDocument();
    });

    it("should call dismissNotification when close button clicked", () => {
        render(
            <Provider store={store}>
                <AwardApprovalAlert
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
                <AwardApprovalAlert
                    notifications={[approvedNotification]}
                    isVisible={false}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByText("Award Approved")).not.toBeInTheDocument();
    });

    it("should hide component when no notifications", () => {
        render(
            <Provider store={store}>
                <AwardApprovalAlert
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
                <AwardApprovalAlert
                    notifications={[readNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByText("Award Approved")).not.toBeInTheDocument();
    });

    it("should filter out non-award notifications", () => {
        render(
            <Provider store={store}>
                <AwardApprovalAlert
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

    it("should filter out pre-award notifications", () => {
        render(
            <Provider store={store}>
                <AwardApprovalAlert
                    notifications={[
                        {
                            id: 6,
                            notification_type: "PRE_AWARD_APPROVAL_NOTIFICATION",
                            title: "Pre-Award Approval Response",
                            message: "Your pre-award approval request has been approved.",
                            is_read: false,
                            procurement_tracker_step: {
                                id: 5,
                                step_type: "PRE_AWARD",
                                approval_status: "APPROVED",
                                approval_requested: true
                            }
                        }
                    ]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.queryByText("Pre-Award Approval Response")).not.toBeInTheDocument();
    });

    it("should render multiple notifications", () => {
        const secondApprovedNotification = {
            ...approvedNotification,
            id: 2,
            message: "The award for Agreement Second Agreement has been approved by Jane Doe."
        };

        render(
            <Provider store={store}>
                <AwardApprovalAlert
                    notifications={[approvedNotification, secondApprovedNotification]}
                    isVisible={true}
                    setIsVisible={() => {}}
                />
            </Provider>
        );

        expect(screen.getAllByText("Award Approved")).toHaveLength(2);
        expect(
            screen.getByText(/The award for Agreement Test Agreement has been approved by John Doe/)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/The award for Agreement Second Agreement has been approved by Jane Doe/)
        ).toBeInTheDocument();
    });

    describe("Auto-dismiss behavior", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should auto-dismiss approved notifications after 6 seconds", () => {
            render(
                <Provider store={store}>
                    <AwardApprovalAlert
                        notifications={[approvedNotification]}
                        isVisible={true}
                        setIsVisible={() => {}}
                    />
                </Provider>
            );

            // Initially notification is visible
            expect(screen.getByText("Award Approved")).toBeInTheDocument();

            // Dismiss should not have been called yet
            expect(mockDismissNotification).not.toHaveBeenCalled();

            // Fast-forward time by 6 seconds
            act(() => {
                vi.advanceTimersByTime(6000);
            });

            // Dismiss should have been called for the approved notification
            expect(mockDismissNotification).toHaveBeenCalledWith(1);
        });

        it("should preserve existing timers when new notifications arrive", () => {
            const firstNotification = {
                id: 1,
                notification_type: "AWARD_APPROVAL_NOTIFICATION",
                is_read: false,
                procurement_tracker_step: { approval_status: "APPROVED" }
            };
            const secondNotification = {
                id: 2,
                notification_type: "AWARD_APPROVAL_NOTIFICATION",
                is_read: false,
                procurement_tracker_step: { approval_status: "APPROVED" }
            };

            // Start with one notification
            const { rerender } = render(
                <Provider store={store}>
                    <AwardApprovalAlert
                        notifications={[firstNotification]}
                        isVisible={true}
                    />
                </Provider>
            );

            // First notification's timer starts at 0ms
            expect(mockDismissNotification).not.toHaveBeenCalled();

            // Advance timer partway (3 seconds)
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            // Should NOT have dismissed yet
            expect(mockDismissNotification).not.toHaveBeenCalled();

            // Re-render with a second notification added (gets its own 6s timer from now)
            rerender(
                <Provider store={store}>
                    <AwardApprovalAlert
                        notifications={[firstNotification, secondNotification]}
                        isVisible={true}
                    />
                </Provider>
            );

            // Advance 3 more seconds (total 6 seconds for first notification)
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            // First notification should dismiss at 6 seconds total (not restarted to 9s)
            expect(mockDismissNotification).toHaveBeenCalledTimes(1);
            expect(mockDismissNotification).toHaveBeenCalledWith(1);

            // Second notification should still be counting (only 3s elapsed for it)
            // Advance 3 more seconds (total 6s for second notification)
            act(() => {
                vi.advanceTimersByTime(3000);
            });

            // Second notification should now also dismiss
            expect(mockDismissNotification).toHaveBeenCalledTimes(2);
            expect(mockDismissNotification).toHaveBeenCalledWith(2);
        });
    });
});
