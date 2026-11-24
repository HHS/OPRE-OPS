import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import StepSelectProject from "./StepSelectProject";
import { useGetAllProjectsQuery, useDeleteAgreementMutation } from "../../api/opsAPI";

// Exercises the REAL ConfirmationModal (unlike StepSelectProject.test.jsx, which stubs it)
// specifically to catch a focus-trap regression: ConfirmationModal's focus-trap effect
// depends, transitively via handleKeyDown, on the identity of the setShowModal prop it's
// given. If StepSelectProject ever passes a function that isn't stable across renders,
// that effect tears down and rebuilds on every re-render while the dialog is open, stealing
// focus back to the first focusable element — even if the user has since tabbed elsewhere.

const mockNavigate = vi.fn();

let blockerState = "unblocked";
const mockReset = vi.fn();
const mockProceed = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useBlocker: () => ({ state: blockerState, reset: mockReset, proceed: mockProceed })
    };
});

vi.mock("../../api/opsAPI", () => ({
    useGetAllProjectsQuery: vi.fn(),
    useDeleteAgreementMutation: vi.fn()
}));

vi.mock("../../components/Projects/ProjectSelectWithSummaryCard", () => ({
    default: () => <div data-testid="project-select" />
}));

vi.mock("../../components/UI/StepIndicator/StepIndicator", () => ({
    default: () => <div data-testid="step-indicator" />
}));

vi.mock("./EditModeTitle", () => ({ default: () => null }));

let mockSelectedProject = { id: 1, title: "Child Care Research" };
vi.mock("../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => ({ selected_project: mockSelectedProject }),
    useSetState: () => vi.fn(),
    useUpdateAgreement: () => vi.fn()
}));

vi.mock("../../hooks/use-alert.hooks", () => ({
    default: () => ({ setAlert: vi.fn() })
}));

const mockStore = configureStore([]);
const store = mockStore({ auth: { activeUser: { id: 1 } }, alert: { isActive: false } });

const defaultProps = {
    goToNext: vi.fn(),
    wizardSteps: ["Project", "Agreement", "Budget Lines"],
    currentStep: 1,
    cancelHeading: "Are you sure you want to cancel?",
    selectedAgreementId: undefined,
    isEditMode: false,
    isReviewMode: false
};

function renderComponent(props = {}) {
    return render(
        <Provider store={store}>
            <MemoryRouter>
                <StepSelectProject
                    {...defaultProps}
                    {...props}
                />
            </MemoryRouter>
        </Provider>
    );
}

describe("StepSelectProject — Cancel confirmation focus trap (real ConfirmationModal)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useDeleteAgreementMutation.mockReturnValue([vi.fn()]);
        useGetAllProjectsQuery.mockReturnValue({ data: [], error: undefined, isLoading: false });
        mockSelectedProject = { id: 1, title: "Child Care Research" };
        blockerState = "unblocked";
    });

    it("does not steal focus back to the first button when the dialog re-renders while open", async () => {
        const user = userEvent.setup();
        const { rerender } = renderComponent();

        await user.click(screen.getByRole("button", { name: /cancel/i }));

        const continueEditingButton = screen.getByRole("button", { name: "Continue Editing" });
        continueEditingButton.focus();
        expect(continueEditingButton).toHaveFocus();

        // Force a re-render of the already-mounted tree while the dialog stays open — e.g. a
        // second blocked browser-Back attempt, or any unrelated state change in the page.
        rerender(
            <Provider store={store}>
                <MemoryRouter>
                    <StepSelectProject {...defaultProps} />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByRole("button", { name: "Continue Editing" })).toHaveFocus();
    });
});
