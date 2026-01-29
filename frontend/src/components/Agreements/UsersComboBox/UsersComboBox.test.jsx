import { render, screen, fireEvent } from "@testing-library/react";
import { vi, expect, describe, it, beforeEach } from "vitest";
import UsersComboBox from "./UsersComboBox";
import { useGetUsersQuery } from "../../../api/opsAPI";

vi.mock("../../../api/opsAPI");
vi.mock("../../UI/Form/ComboBox", () => ({
    default: ({ selectedData, setSelectedData, isDisabled }) => (
        <div data-testid="combobox">
            <input
                data-testid="combobox-input"
                disabled={isDisabled}
                value={selectedData?.full_name || ""}
                onChange={(e) => {
                    const mockUser = { id: 1, full_name: e.target.value, email: "test@example.com" };
                    setSelectedData(mockUser);
                }}
            />
        </div>
    )
}));

describe("UsersComboBox", () => {
    const mockSetSelectedUser = vi.fn();
    const mockUsers = [
        { id: 1, email: "user1@example.com", full_name: "User One" },
        { id: 2, email: "user2@example.com", full_name: "User Two" },
        { id: 3, email: "user3@example.com", full_name: "User Three" }
    ];
    const mockSelectedUser = mockUsers[0];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading state", () => {
        useGetUsersQuery.mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true
        });

        render(
            <UsersComboBox
                selectedUser={{}}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders error state", () => {
        useGetUsersQuery.mockReturnValue({
            data: undefined,
            error: { message: "Error loading users" },
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={{}}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        expect(screen.getByText("Error loading users.")).toBeInTheDocument();
    });

    it("renders ComboBox when data is loaded", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        expect(screen.getByText("Choose a user")).toBeInTheDocument();
        expect(screen.getByTestId("combobox")).toBeInTheDocument();
    });

    it("renders with custom label", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
                label="Task Completed By"
            />
        );

        expect(screen.getByText("Task Completed By")).toBeInTheDocument();
    });

    it("renders in disabled state", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
                isDisabled={true}
            />
        );

        const fieldset = screen.getByRole("group");
        expect(fieldset).toHaveAttribute("disabled");

        const input = screen.getByTestId("combobox-input");
        expect(input).toBeDisabled();
    });

    it("renders in enabled state by default", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        const fieldset = screen.getByRole("group");
        expect(fieldset).not.toHaveAttribute("disabled");
    });

    it("calls setSelectedUser when user is changed", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        const input = screen.getByTestId("combobox-input");
        fireEvent.change(input, { target: { value: "New User" } });

        expect(mockSetSelectedUser).toHaveBeenCalled();
        expect(mockSetSelectedUser).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 1,
                full_name: "New User",
                email: "test@example.com"
            })
        );
    });

    it("has correct label for attribute", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        const label = screen.getByText("Choose a user");
        // In the DOM, htmlFor becomes 'for'
        expect(label).toHaveAttribute("for", "users-combobox-input");
        expect(label).toHaveAttribute("id", "users-label");
    });
});
