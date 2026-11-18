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

// Capture the predicate passed to useBlocker so tests can evaluate it directly, and let
// blockerState be toggled per-test to simulate a browser-Back attempt getting blocked.
let blockerCallback;
let blockerState = "unblocked";
const mockReset = vi.fn();
const mockProceed = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useBlocker: (cb) => {
            blockerCallback = cb;
            return { state: blockerState, reset: mockReset, proceed: mockProceed };
        }
    };
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

// Mirror ConfirmationModal's real click wiring (setShowModal(false) before the handler runs)
// closely enough that tests exercise StepSelectProject's handleCloseModal reset logic.
vi.mock("../../components/UI/Modals/ConfirmationModal", () => ({
    default: ({ heading, actionButtonText, secondaryButtonText, handleConfirm, setShowModal }) => (
        <div data-testid="confirmation-modal">
            {heading}
            <button
                type="button"
                onClick={() => {
                    setShowModal(false);
                    handleConfirm();
                }}
            >
                {actionButtonText}
            </button>
            <button
                type="button"
                onClick={() => setShowModal(false)}
            >
                {secondaryButtonText}
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
        blockerState = "unblocked";
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
    // which already have their own navigation blockers. Browser Back reuses the exact same
    // Cancel confirmation as the page's Cancel button, rather than a separate modal/wording.
    describe("Browser-Back guard", () => {
        beforeEach(() => {
            useGetAllProjectsQuery.mockReturnValue({
                data: MOCK_PROJECTS,
                error: undefined,
                isLoading: false
            });
        });

        it("does not block navigation when no project is selected", () => {
            mockSelectedProject = null;
            renderComponent();

            const shouldBlock = blockerCallback({
                currentLocation: { pathname: "/agreements/create" },
                nextLocation: { pathname: "/agreements" }
            });
            expect(shouldBlock).toBe(false);
        });

        it("blocks navigation once a project is selected", () => {
            mockSelectedProject = null;
            const { rerender } = renderComponent();

            // Simulate the user picking a project after mount — the hook's "initial"
            // snapshot was already captured as unselected, so this now reads as a change.
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            rerender(
                <Provider store={store}>
                    <MemoryRouter>
                        <StepSelectProject {...defaultProps} />
                    </MemoryRouter>
                </Provider>
            );

            const shouldBlock = blockerCallback({
                currentLocation: { pathname: "/agreements/create" },
                nextLocation: { pathname: "/agreements" }
            });
            expect(shouldBlock).toBe(true);
        });

        it("does not flag edit mode's pre-populated project selection as changed on mount", () => {
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            renderComponent({ isEditMode: true });

            const shouldBlock = blockerCallback({
                currentLocation: { pathname: "/agreements/edit/1" },
                nextLocation: { pathname: "/agreements" }
            });
            expect(shouldBlock).toBe(false);
        });

        it("does not block again while the Cancel confirmation dialog is already open", async () => {
            const user = userEvent.setup();
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            renderComponent();

            await user.click(screen.getByRole("button", { name: /cancel/i }));

            const shouldBlock = blockerCallback({
                currentLocation: { pathname: "/agreements/create" },
                nextLocation: { pathname: "/agreements" }
            });
            expect(shouldBlock).toBe(false);
        });

        it("opens the same Cancel confirmation modal when browser Back is blocked", () => {
            blockerState = "blocked";
            mockSelectedProject = { id: 1, title: "Child Care Research" };

            renderComponent({ cancelHeading: "Are you sure you want to cancel creating a new agreement?" });

            const modal = screen.getByTestId("confirmation-modal");
            expect(modal).toHaveTextContent("Are you sure you want to cancel creating a new agreement?");
            expect(screen.getByRole("button", { name: "Cancel Agreement" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Continue Editing" })).toBeInTheDocument();
        });

        it("resets the blocked navigation and stays put when Continue Editing is clicked", async () => {
            const user = userEvent.setup();
            blockerState = "blocked";
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            renderComponent();

            await user.click(screen.getByRole("button", { name: "Continue Editing" }));

            expect(mockReset).toHaveBeenCalled();
        });

        it("resets the blocked navigation and bypasses the blocker when Cancel Agreement is confirmed", async () => {
            const user = userEvent.setup();
            blockerState = "blocked";
            mockSelectedProject = { id: 1, title: "Child Care Research" };
            renderComponent();

            await user.click(screen.getByRole("button", { name: "Cancel Agreement" }));

            expect(mockReset).toHaveBeenCalled();
            // isBypassingRef is now set — the predicate must no longer block, even though
            // the project selection (hasProjectChanged) hasn't changed.
            const shouldBlock = blockerCallback({
                currentLocation: { pathname: "/agreements/create" },
                nextLocation: { pathname: "/agreements" }
            });
            expect(shouldBlock).toBe(false);
        });
    });
});
