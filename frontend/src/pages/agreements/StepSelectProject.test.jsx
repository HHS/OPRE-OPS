import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import StepSelectProject from "./StepSelectProject";
import { useGetResearchProjectsQuery, useDeleteAgreementMutation } from "../../api/opsAPI";

// ── Mock dependencies ────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../api/opsAPI", () => ({
    useGetResearchProjectsQuery: vi.fn(),
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
    default: ({ heading }) => <div data-testid="confirmation-modal">{heading}</div>
}));

vi.mock("./EditModeTitle", () => ({ default: () => null }));

// Stub the AgreementEditorContext hooks — provide minimal state
vi.mock("../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => ({ selected_project: null }),
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
    });

    describe("RTK Query – cache-bust option", () => {
        it("calls useGetResearchProjectsQuery with refetchOnMountOrArgChange: true", () => {
            useGetResearchProjectsQuery.mockReturnValue({
                data: MOCK_PROJECTS,
                error: undefined,
                isLoading: false
            });

            renderComponent();

            expect(useGetResearchProjectsQuery).toHaveBeenCalledWith({}, { refetchOnMountOrArgChange: true });
        });
    });

    describe("loading state", () => {
        it("shows a loading indicator while projects are being fetched", () => {
            useGetResearchProjectsQuery.mockReturnValue({
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
            useGetResearchProjectsQuery.mockReturnValue({
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
            useGetResearchProjectsQuery.mockReturnValue({
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
            useGetResearchProjectsQuery.mockReturnValue({
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
            useGetResearchProjectsQuery.mockReturnValue({
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
});
