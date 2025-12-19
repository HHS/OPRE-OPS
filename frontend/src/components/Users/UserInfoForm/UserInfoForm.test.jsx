import { renderWithProviders } from "../../../test-utils";
import { screen } from "@testing-library/react";
import UserInfoForm from "./UserInfoForm";

describe("UserInfoForm", () => {
    const mockUser = {
        id: 1,
        oidc_id: "oidc123",
        hhs_id: "hhs456",
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe"
    };

    it("should render the form heading", () => {
        renderWithProviders(<UserInfoForm />, {
            preloadedState: {
                userDetailEdit: { user: mockUser }
            }
        });

        expect(screen.getByText("New User Registration")).toBeInTheDocument();
    });

    it("should render the form description", () => {
        renderWithProviders(<UserInfoForm />, {
            preloadedState: {
                userDetailEdit: { user: mockUser }
            }
        });

        expect(screen.getByText("Confirm / Update your details below.")).toBeInTheDocument();
    });

    it("should render all input fields with correct labels", () => {
        renderWithProviders(<UserInfoForm />, {
            preloadedState: {
                userDetailEdit: { user: mockUser }
            }
        });

        expect(screen.getByLabelText("OIDC ID")).toBeInTheDocument();
        expect(screen.getByLabelText("HHS ID")).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("First Name")).toBeInTheDocument();
        expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    });

    it("should display user data in the form fields", () => {
        renderWithProviders(<UserInfoForm />, {
            preloadedState: {
                userDetailEdit: { user: mockUser }
            }
        });

        expect(screen.getByDisplayValue(mockUser.oidc_id)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.hhs_id)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.first_name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.last_name)).toBeInTheDocument();
    });

    it("should render without user data", () => {
        renderWithProviders(<UserInfoForm />, {
            preloadedState: {
                userDetailEdit: { user: null }
            }
        });

        expect(screen.getByText("New User Registration")).toBeInTheDocument();
    });
});
