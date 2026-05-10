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

    test("renders Required Information hint under Project Type", () => {
        renderComponent();
        const hints = screen.getAllByText("Required Information*");
        expect(hints.length).toBeGreaterThanOrEqual(2);
    });

    test("renders description hint from Figma spec", () => {
        renderComponent();
        expect(
            screen.getByText(/brief description for internal purposes, not for the opre website/i)
        ).toBeInTheDocument();
    });

    test("suite rejects project_type values outside the allowlist", () => {
        const result = suite.run(
            { title: "t", short_title: "", description: "", project_type: "Bogus" },
            "project_type"
        );
        expect(result.getErrors("project_type")).toContain("Please select a valid project type");
    });

    test("suite accepts Research and Admin & Support as project_type", () => {
        const research = suite.run(
            { title: "t", short_title: "", description: "", project_type: "Research" },
            "project_type"
        );
        expect(research.getErrors("project_type")).toEqual([]);

        const admin = suite.run(
            { title: "t", short_title: "", description: "", project_type: "Admin & Support" },
            "project_type"
        );
        expect(admin.getErrors("project_type")).toEqual([]);
    });

    test("shows placeholder and disables save when projectType is empty", () => {
        renderComponent({ projectType: "" });
        const select = screen.getByLabelText(/project type/i);

        expect(select).toHaveValue("");
        expect(screen.getByText(/- select project type -/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    });

    test("placeholder option is disabled and hidden so users cannot re-select it", () => {
        renderComponent({ projectType: "" });
        const placeholder = screen.getByText(/- select project type -/i);

        expect(placeholder).toBeDisabled();
        expect(placeholder).toHaveAttribute("hidden");
    });

    test("selecting a valid type after empty initial value enables save", async () => {
        renderComponent({ projectType: "" });
        const user = userEvent.setup();
        const select = screen.getByLabelText(/project type/i);

        await user.selectOptions(select, "Research");

        expect(select).toHaveValue("Research");
        expect(screen.getByRole("button", { name: /save changes/i })).toBeEnabled();
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
