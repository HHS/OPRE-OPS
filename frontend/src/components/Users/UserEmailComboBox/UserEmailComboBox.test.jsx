import { render, screen } from "@testing-library/react";
import { vi, expect } from "vitest";
import UserEmailComboBox from "./UserEmailComboBox";
import { useGetUsersQuery } from "../../../api/opsAPI";
import { useNavigate } from "react-router-dom";

vi.mock("../../../api/opsAPI");
vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn()
}));

describe("UserEmailComboBox", () => {
    const mockNavigate = vi.fn();
    const mockSetSelectedUsers = vi.fn();
    const mockUsers = [
        { id: 1, email: "user1@example.com", full_name: "User One" },
        { id: 2, email: "user2@example.com", full_name: "User Two" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it("should render loading state", () => {
        useGetUsersQuery.mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true
        });

        render(<UserEmailComboBox selectedUsers={[]} setSelectedUsers={mockSetSelectedUsers} />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should navigate to error page on error", () => {
        useGetUsersQuery.mockReturnValue({
            data: undefined,
            error: { message: "Error loading users" },
            isLoading: false
        });

        render(<UserEmailComboBox selectedUsers={[]} setSelectedUsers={mockSetSelectedUsers} />);
        expect(mockNavigate).toHaveBeenCalledWith("/error");
    });

    it("should render the ComboBox when data is loaded", () => {
        useGetUsersQuery.mockReturnValue({
            data: mockUsers,
            error: undefined,
            isLoading: false
        });

        render(<UserEmailComboBox selectedUsers={[]} setSelectedUsers={mockSetSelectedUsers} />);
        expect(screen.getByLabelText("User")).toBeInTheDocument();
        expect(screen.getByText("Select all that apply")).toBeInTheDocument();
    });
});
