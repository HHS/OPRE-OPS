import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ProjectDetailForm from "./ProjectDetailForm";
import suite from "./suite";

const mockProject = {
    id: 1000,
    title: "Human Services Interoperability Support",
    short_title: "HSS",
    description: "Interoperability activities description.",
    project_type: "RESEARCH"
};

const mockToggleEditMode = vi.fn();
const mockSetAlert = vi.fn();
const mockUpdateProject = vi.fn();

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: mockSetAlert })
}));

vi.mock("../../../api/opsAPI", () => ({
    useUpdateProjectMutation: () => [mockUpdateProject, { isLoading: false }]
}));

vi.mock("../../../helpers/scrollToTop.helper", () => ({
    scrollToTop: vi.fn()
}));

const renderComponent = (overrides = {}) => {
    return render(
        <ProjectDetailForm
            projectId={mockProject.id}
            projectTitle={mockProject.title}
            projectShortTitle={mockProject.short_title}
            projectDescription={mockProject.description}
            projectType={mockProject.project_type}
            toggleEditMode={mockToggleEditMode}
            {...overrides}
        />
    );
};

describe("ProjectDetailForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        suite.reset();
        mockUpdateProject.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    });

    test("renders form with initial values", () => {
        renderComponent();

        expect(screen.getByLabelText(/project title/i)).toHaveValue(mockProject.title);
        expect(screen.getByLabelText(/project nickname/i)).toHaveValue(mockProject.short_title);
        expect(screen.getByLabelText(/description/i)).toHaveValue(mockProject.description);
    });

    test("converts API project type to display format", () => {
        renderComponent();
        const select = screen.getByLabelText(/project type/i);
        expect(select).toHaveValue("Research");
    });

    test("converts ADMINISTRATIVE_AND_SUPPORT to display format", () => {
        renderComponent({ projectType: "ADMINISTRATIVE_AND_SUPPORT" });
        const select = screen.getByLabelText(/project type/i);
        expect(select).toHaveValue("Admin & Support");
    });

    test("validates required title field", async () => {
        renderComponent();
        const titleInput = screen.getByLabelText(/project title/i);

        await userEvent.clear(titleInput);
        fireEvent.blur(titleInput);

        expect(await screen.findByText("This is required information")).toBeInTheDocument();
    });

    test("shows confirmation modal when canceling", async () => {
        renderComponent();

        const cancelButton = screen.getByText(/cancel/i);
        await userEvent.click(cancelButton);

        expect(screen.getByText(/are you sure you want to cancel editing/i)).toBeInTheDocument();
    });

    test("disables save button when title is empty", async () => {
        renderComponent();
        const titleInput = screen.getByLabelText(/project title/i);

        await userEvent.clear(titleInput);

        expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    });

    test("enables save button when title has a value", () => {
        renderComponent();

        expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
    });

    test("submits form with correct payload including API type format", async () => {
        renderComponent();
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateProject).toHaveBeenCalledWith({
                id: 1000,
                data: {
                    title: "Human Services Interoperability Support",
                    short_title: "HSS",
                    description: "Interoperability activities description.",
                    project_type: "RESEARCH"
                }
            });
        });
    });

    test("shows success alert and calls toggleEditMode after successful submission", async () => {
        renderComponent();
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "success",
                heading: "Project Updated",
                message: "The project has been successfully updated."
            });
            expect(mockToggleEditMode).toHaveBeenCalled();
        });
    });

    test("shows error alert when submission fails", async () => {
        mockUpdateProject.mockReturnValue({
            unwrap: () => Promise.reject(new Error("Server error"))
        });
        renderComponent();
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(mockSetAlert).toHaveBeenCalledWith({
                type: "error",
                heading: "Error Updating Project",
                message: "There was an error updating the project. Please try again."
            });
        });
        expect(mockToggleEditMode).not.toHaveBeenCalled();
    });

    test("does not call toggleEditMode when submission fails", async () => {
        mockUpdateProject.mockReturnValue({
            unwrap: () => Promise.reject(new Error("Server error"))
        });
        renderComponent();
        const user = userEvent.setup();

        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(mockSetAlert).toHaveBeenCalled();
        });
        expect(mockToggleEditMode).not.toHaveBeenCalled();
    });

    test("updates project type selection", async () => {
        renderComponent();
        const user = userEvent.setup();
        const select = screen.getByLabelText(/project type/i);

        await user.selectOptions(select, "Admin & Support");

        expect(select).toHaveValue("Admin & Support");
    });

    test("submits with updated project type in API format", async () => {
        renderComponent();
        const user = userEvent.setup();
        const select = screen.getByLabelText(/project type/i);

        await user.selectOptions(select, "Admin & Support");
        await user.click(screen.getByRole("button", { name: /save changes/i }));

        await waitFor(() => {
            expect(mockUpdateProject).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        project_type: "ADMINISTRATIVE_AND_SUPPORT"
                    })
                })
            );
        });
    });
});
