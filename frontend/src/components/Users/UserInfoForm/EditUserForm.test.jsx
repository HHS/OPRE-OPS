import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, expect } from "vitest";
import EditUserForm from "./EditUserForm";
import { useNavigate } from "react-router-dom";
import * as backendHelper from "../../../helpers/backend";

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn()
}));

vi.mock("../../../helpers/backend", () => ({
    callBackend: vi.fn()
}));

describe("EditUserForm", () => {
    const mockNavigate = vi.fn();
    const mockUser = {
        id: 1,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        division: "Division A",
        oidc_id: "oidc123",
        hhs_id: "hhs456"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it("should render all form fields with labels", () => {
        render(<EditUserForm user={mockUser} />);

        expect(screen.getByLabelText("First or Given Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Last or Family Name")).toHaveValue(mockUser.last_name);
        expect(screen.getByLabelText("Email Address")).toHaveValue(mockUser.email);
        expect(screen.getByLabelText("Division")).toHaveValue(mockUser.division);
        expect(screen.getByLabelText("OIDC ID")).toHaveValue(mockUser.oidc_id);
        expect(screen.getByLabelText("HHS ID")).toHaveValue(mockUser.hhs_id);
    });

    it("should render the save button", () => {
        render(<EditUserForm user={mockUser} />);
        expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
    });

    it("should handle form input changes", () => {
        render(<EditUserForm user={mockUser} />);

        const firstNameInput = screen.getByLabelText("First or Given Name");
        fireEvent.change(firstNameInput, { target: { value: "Jane" } });

        expect(firstNameInput).toHaveValue("Jane");
    });

    it("should handle form submission successfully", async () => {
        const updatedUser = { ...mockUser, first_name: "Jane" };
        backendHelper.callBackend.mockResolvedValue(updatedUser);

        render(<EditUserForm user={mockUser} />);

        const submitButton = screen.getByRole("button", { name: /Save Changes/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(backendHelper.callBackend).toHaveBeenCalledWith(
                `/api/v1/users/${mockUser.id}`,
                "PUT",
                expect.objectContaining({
                    id: mockUser.id,
                    first_name: mockUser.first_name
                })
            );
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(`/users/${updatedUser.id}`);
        });
    });

    it("should render with empty user data", () => {
        render(<EditUserForm user={{}} />);

        expect(screen.getByLabelText("First or Given Name")).toHaveValue("");
        expect(screen.getByLabelText("Last or Family Name")).toHaveValue("");
    });
});
