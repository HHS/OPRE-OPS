import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import NotificationCenter from "./NotificationCenter";
import { useNotifications } from "../../../hooks/useNotifications";

vi.mock("../../../hooks/useNotifications");
vi.mock("react-modal", () => ({
    default: ({ children, isOpen }) => (isOpen ? <div role="dialog">{children}</div> : null),
    setAppElement: vi.fn()
}));
vi.mock("../LogItem", () => ({
    default: ({ title }) => <div>{title}</div>
}));

describe("NotificationCenter", () => {
    const mockUser = { oidc_id: "user123" };
    const mockDismissAll = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render loading state", () => {
        useNotifications.mockReturnValue({
            unreadNotifications: [],
            isLoading: true,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render notification bell icon", () => {
        useNotifications.mockReturnValue({
            unreadNotifications: [],
            isLoading: false,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        expect(screen.getByLabelText("View notifications")).toBeInTheDocument();
    });

    it("should open modal when bell icon is clicked", () => {
        useNotifications.mockReturnValue({
            unreadNotifications: [],
            isLoading: false,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        const bellIcon = screen.getByLabelText("View notifications");
        fireEvent.click(bellIcon);

        expect(screen.getByText("Notifications")).toBeInTheDocument();
    });

    it("should display 'no notifications' message when there are none", () => {
        useNotifications.mockReturnValue({
            unreadNotifications: [],
            isLoading: false,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        fireEvent.click(screen.getByLabelText("View notifications"));

        expect(screen.getByText("There are no notifications.")).toBeInTheDocument();
    });

    it("should display notifications when there are unread notifications", () => {
        const mockNotifications = [
            { id: 1, title: "Notification 1", created_on: "2024-01-01", message: "Message 1" },
            { id: 2, title: "Notification 2", created_on: "2024-01-02", message: "Message 2" }
        ];

        useNotifications.mockReturnValue({
            unreadNotifications: mockNotifications,
            isLoading: false,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        fireEvent.click(screen.getByLabelText("View notifications"));

        expect(screen.getByText("Notification 1")).toBeInTheDocument();
        expect(screen.getByText("Notification 2")).toBeInTheDocument();
    });

    it("should call dismissAll when Clear All button is clicked", () => {
        useNotifications.mockReturnValue({
            unreadNotifications: [{ id: 1, title: "Notification 1", created_on: "2024-01-01", message: "Message 1" }],
            isLoading: false,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        fireEvent.click(screen.getByLabelText("View notifications"));

        const clearAllButton = screen.getByText("Clear All");
        fireEvent.click(clearAllButton);

        expect(mockDismissAll).toHaveBeenCalled();
    });

    it("should close modal when close icon is clicked", () => {
        useNotifications.mockReturnValue({
            unreadNotifications: [],
            isLoading: false,
            dismissAll: mockDismissAll
        });

        render(<NotificationCenter user={mockUser} />);
        fireEvent.click(screen.getByLabelText("View notifications"));

        const closeIcon = screen.getByLabelText("Close notifications");
        fireEvent.click(closeIcon);

        expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    });
});
