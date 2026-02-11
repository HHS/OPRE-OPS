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
                authorizedUserIds={[1, 2, 3]}
            />
        );

        expect(useGetUsersQuery).toHaveBeenCalledWith({}, { skip: false });
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
                authorizedUserIds={[1, 2, 3]}
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
                authorizedUserIds={[1, 2, 3]}
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
                authorizedUserIds={[1, 2, 3]}
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
                authorizedUserIds={[1, 2, 3]}
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
                authorizedUserIds={[1, 2, 3]}
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
                authorizedUserIds={[1, 2, 3]}
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
                authorizedUserIds={[1, 2, 3]}
            />
        );

        const label = screen.getByText("Choose a user");
        // In the DOM, htmlFor becomes 'for'
        expect(label).toHaveAttribute("for", "users-combobox-input");
        expect(label).toHaveAttribute("id", "users-label");
    });

    it("renders ComboBox with provided users without API call", () => {
        const providedUsers = [{ id: 10, email: "provided@example.com", full_name: "Provided User" }];

        render(
            <UsersComboBox
                selectedUser={providedUsers[0]}
                setSelectedUser={mockSetSelectedUser}
                users={providedUsers}
                authorizedUserIds={[10]}
            />
        );

        // Should call the API with skip: true
        expect(useGetUsersQuery).toHaveBeenCalledWith({}, { skip: true });

        // Should render the combobox
        expect(screen.getByText("Choose a user")).toBeInTheDocument();
        expect(screen.getByTestId("combobox")).toBeInTheDocument();
    });

    it("fetches users from API when users prop not provided", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(
            <UsersComboBox
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
                authorizedUserIds={[1, 2, 3]}
            />
        );

        // Should call the API with skip: false
        expect(useGetUsersQuery).toHaveBeenCalledWith({}, { skip: false });

        // Should render the combobox
        expect(screen.getByText("Choose a user")).toBeInTheDocument();
        expect(screen.getByTestId("combobox")).toBeInTheDocument();
    });

    it("does not show loading state when users are provided", () => {
        const providedUsers = [{ id: 10, email: "provided@example.com", full_name: "Provided User" }];

        // Mock the hook to return loading state
        useGetUsersQuery.mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true // This should be ignored when users provided
        });

        render(
            <UsersComboBox
                selectedUser={providedUsers[0]}
                setSelectedUser={mockSetSelectedUser}
                users={providedUsers}
                authorizedUserIds={[10]}
            />
        );

        // Should NOT show loading state
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        // Should render the combobox
        expect(screen.getByTestId("combobox")).toBeInTheDocument();
    });

    it("filters users by authorizedUserIds when provided", () => {
        const allUsers = [
            { id: 1, email: "user1@example.com", full_name: "User One" },
            { id: 2, email: "user2@example.com", full_name: "User Two" },
            { id: 3, email: "user3@example.com", full_name: "User Three" }
        ];

        // Should render successfully with authorizedUserIds prop
        expect(() => {
            render(
                <UsersComboBox
                    users={allUsers}
                    authorizedUserIds={[1, 3]}
                    selectedUser={null}
                    setSelectedUser={mockSetSelectedUser}
                />
            );
        }).not.toThrow();

        expect(screen.getByTestId("combobox")).toBeInTheDocument();
    });

    it("shows 'No Authorized Users Configured' when authorizedUserIds is empty array", () => {
        const allUsers = [
            { id: 1, email: "user1@example.com", full_name: "User One" },
            { id: 2, email: "user2@example.com", full_name: "User Two" }
        ];

        render(
            <UsersComboBox
                users={allUsers}
                authorizedUserIds={[]}
                selectedUser={null}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        const input = screen.getByDisplayValue("No Authorized Users");
        expect(input).toBeInTheDocument();
        expect(input).toBeDisabled();
    });

    it("shows 'No Authorized Users' when authorizedUserIds is null", () => {
        const allUsers = [
            { id: 1, email: "user1@example.com", full_name: "User One" },
            { id: 2, email: "user2@example.com", full_name: "User Two" }
        ];

        render(
            <UsersComboBox
                users={allUsers}
                authorizedUserIds={null}
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        const input = screen.getByDisplayValue("No Authorized Users");
        expect(input).toBeInTheDocument();
        expect(input).toBeDisabled();
    });

    it("shows 'No Authorized Users' when authorizedUserIds is undefined", () => {
        const allUsers = [
            { id: 1, email: "user1@example.com", full_name: "User One" },
            { id: 2, email: "user2@example.com", full_name: "User Two" }
        ];

        render(
            <UsersComboBox
                users={allUsers}
                authorizedUserIds={undefined}
                selectedUser={mockSelectedUser}
                setSelectedUser={mockSetSelectedUser}
            />
        );

        const input = screen.getByDisplayValue("No Authorized Users");
        expect(input).toBeInTheDocument();
        expect(input).toBeDisabled();
    });
});
