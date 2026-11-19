import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import StepSelectProject from "./StepSelectProject";
import { useGetAllProjectsQuery, useDeleteAgreementMutation } from "../../api/opsAPI";

// ── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../api/opsAPI", () => ({
    useGetAllProjectsQuery: vi.fn(),
    useDeleteAgreementMutation: vi.fn()
}));

// Stub heavy child components to keep tests fast and focused
vi.mock("../../components/Projects/ProjectSelectWithSummaryCard", () => ({
    default: ({ researchProjects }) => (
        <div data-testid="project-select">
            {researchProjects?.map((p) => (
                <div
                    key={p.id}
                    data-testid="project-option"
                >
                    {p.title}
                </div>
            ))}
        </div>
    )
}));

vi.mock("../../components/UI/StepIndicator/StepIndicator", () => ({
    default: () => <div data-testid="step-indicator" />
}));

vi.mock("../../components/UI/Modals/ConfirmationModal", () => ({
    default: ({ heading, actionButtonText, handleConfirm }) => (
        <div data-testid="confirmation-modal">
            {heading}
            <button
                type="button"
                onClick={handleConfirm}
            >
                {actionButtonText}
            </button>
        </div>
    )
}));

vi.mock("./EditModeTitle", () => ({ default: () => null }));

// Stub the AgreementEditorContext hooks — provide minimal state
let mockSelectedProject = null;
vi.mock("../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => ({ selected_project: mockSelectedProject }),
    useSetState: () => vi.fn(),
    useUpdateAgreement: () => vi.fn()
}));

vi.mock("../../hooks/use-alert.hooks", () => ({
    default: () => ({ setAlert: vi.fn() })
}));

// Declare the blocker spy with vi.hoisted() so it is available inside the vi.mock() factory,
// which is hoisted to the top of the file above all const declarations.
const mockUseUnsavedChangesBlocker = vi.hoisted(() => vi.fn());

// Mock the navigation blocker hook so tests don't need a data router
const mockBlockerReturn = {
    showBlockerModal: false,
    setShowBlockerModal: vi.fn(),
    blockerModalProps: {},
    isBypassingRef: { current: false }
};

vi.mock("../../hooks/useUnsavedChangesBlocker.hooks", () => ({
    default: (...args) => mockUseUnsavedChangesBlocker(...args)
}));

// Mock SaveChangesAndExitModal so blocker modal tests work without USWDS modal plumbing.
vi.mock("../../components/UI/Modals/SaveChangesAndExitModal", () => {
    const Mock = ({ heading }) => <div data-testid="save-changes-modal">{heading}</div>;
    return { default: Mock, SaveChangesAndExitModal: Mock };
});

// ── Test helpers ─────────────────────────────────────────────────────────────

const mockStore = configureStore([]);
const store = mockStore({ auth: { activeUser: { id: 1 } }, alert: { isActive: false } });

const MOCK_PROJECTS = [
    { id: 1, title: "Child Care Research", short_title: "CCR", project_type: "RESEARCH" },
    { id: 2, title: "Head Start Study", short_title: "HSS", project_type: "RESEARCH" }
];

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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("StepSelectProject", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useDeleteAgreementMutation.mockReturnValue([vi.fn()]);
        mockSelectedProject = null;
        mockBlockerReturn.isBypassingRef.current = false;
        mockUseUnsavedChangesBlocker.mockReturnValue(mockBlockerReturn);
    });

    describe("RTK Query – cache-bust option", () => {
        it("calls useGetAllProjectsQuery with refetchOnMountOrArgChange: true", () => {
            useGetAllProjectsQuery.mockReturnValue({
                data: MOCK_PROJECTS,
                error: undefined,
                isLoading: false
            });

            renderComponent();

            expect(useGetAllProjectsQuery).toHaveBeenCalledWith(undefined, { refetchOnMountOrArgChange: true });
        });
    });

    describe("loading state", () => {
        it("shows a loading indicator while projects are being fetched", () => {
            useGetAllProjectsQuery.mockReturnValue({
                data: undefined,
                error: undefined,
                isLoading: true
            });

            renderComponent();

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });
    });

    describe("error state", () => {
        it("navigates to /error when the query fails", () => {
            useGetAllProjectsQuery.mockReturnValue({
                data: undefined,
                error: { status: 500 },
                isLoading: false
            });

            renderComponent();

            expect(mockNavigate).toHaveBeenCalledWith("/error");
        });
    });

    describe("success state", () => {
        beforeEach(() => {
            useGetAllProjectsQuery.mockReturnValue({
                data: MOCK_PROJECTS,
                error: undefined,
                isLoading: false
            });
        });

        it("renders the step indicator and heading", () => {
            renderComponent();

            expect(screen.getByTestId("step-indicator")).toBeInTheDocument();
            expect(screen.getByRole("heading", { name: /select a project/i })).toBeInTheDocument();
        });

        it("passes all research projects to ProjectSelectWithSummaryCard", () => {
            renderComponent();

            const options = screen.getAllByTestId("project-option");
            expect(options).toHaveLength(MOCK_PROJECTS.length);
            expect(options[0]).toHaveTextContent("Child Care Research");
            expect(options[1]).toHaveTextContent("Head Start Study");
        });

        it("renders the Add New Project button", () => {
            renderComponent();

            expect(screen.getByRole("button", { name: /add new project/i })).toBeInTheDocument();
        });

        it("navigates to /projects/create when Add New Project is clicked", async () => {
            const user = userEvent.setup();
            renderComponent();

            await user.click(screen.getByRole("button", { name: /add new project/i }));

            expect(mockNavigate).toHaveBeenCalledWith("/projects/create");
        });

        it("renders an empty project list gracefully when data is an empty array", () => {
            useGetAllProjectsQuery.mockReturnValue({
                data: [],
                error: undefined,
                isLoading: false
            });

            renderComponent();

            expect(screen.getByTestId("project-select")).toBeInTheDocument();
            expect(screen.queryAllByTestId("project-option")).toHaveLength(0);
        });
    });

    describe("Cancel button", () => {
        beforeEach(() => {
            useGetAllProjectsQuery.mockReturnValue({
                data: MOCK_PROJECTS,
                error: undefined,
                isLoading: false
            });
        });

        it("shows a confirmation modal when Cancel is clicked", async () => {
            const user = userEvent.setup();
            renderComponent();

            await user.click(screen.getByRole("button", { name: /cancel/i }));

            expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
        });
    });

    // Browser-Back guard (OPS-1081): selecting a project here is local context state with
    // nothing else protecting it against browser back — unlike steps 2/3 of the wizard,
    // which already have their own navigation blockers.
    describe("Browser-Back guard", () => {
        beforeEach(() => {
            useGetAllProjectsQuery.mockReturnValue({
                data: MOCK_PROJECTS,
                error: undefined,
                isLoading: false
            });
        });

        it("passes hasChanged: false to useUnsavedChangesBlocker when no project is selected", () => {
            mockSelectedProject = null;
            renderComponent();

            const lastCall = mockUseUnsavedChangesBlocker.mock.calls.at(-1)[0];
            expect(lastCall.hasChanged).toBe(false);
        });

        it("passes hasChanged: true to useUnsavedChangesBlocker once a project is selected", () => {
            mockSelectedProject = null;
            const { rerender } = renderComponent();

            // Simulate the user picking a project after mount — the hook's "initial" snapshot
            // was already captured as unselected, so this now reads as a real change.
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            rerender(
                <Provider store={store}>
                    <MemoryRouter>
                        <StepSelectProject {...defaultProps} />
                    </MemoryRouter>
                </Provider>
            );

            const lastCall = mockUseUnsavedChangesBlocker.mock.calls.at(-1)[0];
            expect(lastCall.hasChanged).toBe(true);
        });

        it("does not flag edit mode's pre-populated project selection as changed on mount", () => {
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            renderComponent({ isEditMode: true });

            const lastCall = mockUseUnsavedChangesBlocker.mock.calls.at(-1)[0];
            expect(lastCall.hasChanged).toBe(false);
        });

        it("renders the unsaved-changes modal when the blocker reports showBlockerModal: true", () => {
            mockUseUnsavedChangesBlocker.mockReturnValue({
                ...mockBlockerReturn,
                showBlockerModal: true,
                blockerModalProps: { heading: "Leave without finishing?" }
            });
            mockSelectedProject = { id: 1, title: "Child Care Research" };

            renderComponent();

            expect(screen.getByTestId("save-changes-modal")).toHaveTextContent("Leave without finishing?");
        });

        it("suppresses hasChanged while the Cancel confirmation dialog is open", async () => {
            const user = userEvent.setup();
            mockSelectedProject = null;
            const { rerender } = renderComponent();

            // Select a project after mount, so hasProjectChanged is genuinely true.
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            rerender(
                <Provider store={store}>
                    <MemoryRouter>
                        <StepSelectProject {...defaultProps} />
                    </MemoryRouter>
                </Provider>
            );

            // Sanity: the blocker would be live before Cancel is clicked.
            expect(mockUseUnsavedChangesBlocker.mock.calls.at(-1)[0].hasChanged).toBe(true);

            await user.click(screen.getByRole("button", { name: /cancel/i }));

            // With the Cancel dialog now open, browser Back must not stack a second modal
            // on top of it — ConfirmationModal and SaveChangesAndExitModal share hardcoded
            // DOM ids and each registers its own keydown trap.
            const lastCall = mockUseUnsavedChangesBlocker.mock.calls.at(-1)[0];
            expect(lastCall.hasChanged).toBe(false);
        });

        it("sets isBypassingRef once Cancel is confirmed, so a same-tick navigate isn't blocked", async () => {
            const user = userEvent.setup();
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            renderComponent();

            expect(mockBlockerReturn.isBypassingRef.current).toBe(false);

            await user.click(screen.getByRole("button", { name: /cancel/i }));
            await user.click(screen.getByRole("button", { name: "Cancel Agreement" }));

            expect(mockBlockerReturn.isBypassingRef.current).toBe(true);
        });
    });
});
