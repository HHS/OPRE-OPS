import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import AgreementBudgetLines from "./AgreementBudgetLines";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { configureStore } from "@reduxjs/toolkit";
import { vi } from "vitest";
import { USER_ROLES } from "../../../components/Users/User.constants";

const history = createMemoryHistory();
const mockFn = TestApplicationContext.helpers().mockFn;
const useGetServicesComponentsListQueryMock = vi.fn();
const useGetGrantNumbersListQueryMock = vi.fn();

// Mock the hooks and API calls
vi.mock("../../../api/opsAPI", () => ({
    useGetServicesComponentsListQuery: (...args) => useGetServicesComponentsListQueryMock(...args),
    useGetGrantNumbersListQuery: (...args) => useGetGrantNumbersListQueryMock(...args),
    useLazyGetServicesComponentByIdQuery: () => [vi.fn(), { data: [], isLoading: false }],
    useLazyGetBudgetLineItemsQuery: () => [vi.fn(), { data: [], isLoading: false }],
    useLazyGetPortfolioByIdQuery: () => [vi.fn(), { data: null, isLoading: false }],
    useLazyGetCansQuery: () => [
        vi.fn().mockResolvedValue({ unwrap: () => Promise.resolve({ cans: [], count: 0 }) }),
        { isLoading: false, isError: false }
    ]
}));

// Mock BudgetLinesTable so column-gating tests assert the showClinColumn prop AgreementBudgetLines
// passes, without pulling in the real table's hook chain (useGetAllCans, procurement shops, users).
vi.mock("../../../components/BudgetLineItems/BudgetLinesTable", () => ({
    default: (props) => <div data-testid="budget-lines-table">show-clin:{String(!!props.showClinColumn)}</div>
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockFn
    };
});

// This will reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

beforeEach(() => {
    useGetServicesComponentsListQueryMock.mockReturnValue({
        data: [],
        isLoading: false
    });
    useGetGrantNumbersListQueryMock.mockReturnValue({
        data: [],
        isLoading: false
    });
});

describe("AgreementBudgetLines", () => {
    const mockAgreement = {
        id: 1,
        name: "Test Agreement",
        description: "Test Description",
        agreement_type: "CONTRACT",
        budget_line_items: [],
        team_leaders: [],
        division_directors: [],
        procurement_shop: null,
        _meta: {
            isEditable: true
        }
    };

    const defaultProps = {
        agreement: mockAgreement,
        budgetLineItems: [],
        isReviewMode: false,
        canUserEditBudgetLines: true,
        allBudgetLinesInReview: false,
        isAgreementNotaContract: false
    };

    test("super user can edit budget lines on GRANT agreements", () => {
        // Create a test store with super user
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [USER_ROLES.SUPER_USER]
                    }
                })
            }
        });

        const grantAgreement = {
            ...mockAgreement,
            agreement_type: "GRANT"
        };

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementBudgetLines
                        {...defaultProps}
                        agreement={grantAgreement}
                        isAgreementNotaContract={true}
                    />
                </Router>
            </Provider>
        );

        // Should render the component without errors
        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    describe("Grant agreements", () => {
        // A real super user so the Edit/Request buttons render (regular users would hide them entirely)
        const superUserStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [{ name: USER_ROLES.SUPER_USER }],
                        is_superuser: true
                    }
                })
            }
        });

        const renderAgreement = (agreement) =>
            render(
                <Provider store={superUserStore}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementBudgetLines
                            {...defaultProps}
                            agreement={agreement}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            isEditMode={false}
                            setIsEditMode={vi.fn()}
                        />
                    </Router>
                </Provider>
            );

        test("enables the Edit button for a grant agreement", () => {
            renderAgreement({ ...mockAgreement, agreement_type: "GRANT" });

            // The clickable Edit button (a real <button>) renders for grants, not the disabled span variant
            const editButton = screen.getByRole("button", { name: /edit/i });
            expect(editButton).not.toHaveAttribute("aria-disabled");
        });

        test("enables the Change BL Status button for a grant agreement", () => {
            renderAgreement({ ...mockAgreement, agreement_type: "GRANT" });

            const requestLink = screen.getByRole("link", { name: "Change BL Status" });
            expect(requestLink).toHaveAttribute("data-cy", "bli-continue-btn");
        });

        test("keeps the Edit and Change BL Status buttons enabled for a contract agreement", () => {
            renderAgreement({ ...mockAgreement, agreement_type: "CONTRACT" });

            const editButton = screen.getByRole("button", { name: /edit/i });
            expect(editButton).not.toHaveAttribute("aria-disabled");

            const requestLink = screen.getByRole("link", { name: "Change BL Status" });
            expect(requestLink).toHaveAttribute("data-cy", "bli-continue-btn");
        });
    });

    describe("Grant number metadata wiring", () => {
        // A real super user so the grant accordion section renders in full.
        const superUserStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [{ name: USER_ROLES.SUPER_USER }],
                        is_superuser: true
                    }
                })
            }
        });

        const renderGrantAgreement = (agreement) =>
            render(
                <Provider store={superUserStore}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementBudgetLines
                            {...defaultProps}
                            agreement={agreement}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            isEditMode={false}
                            setIsEditMode={vi.fn()}
                        />
                    </Router>
                </Provider>
            );

        test("resolves award-time fields from the grant number onto the rendered accordion", () => {
            useGetGrantNumbersListQueryMock.mockReturnValue({
                data: [
                    {
                        id: 10,
                        number: 1,
                        description: "Test grant description",
                        period_start: "2026-01-15",
                        period_end: "2026-06-30",
                        grantee_name: "University of Example",
                        organization_type: "Educational Institution",
                        state: "NY"
                    }
                ],
                isLoading: false
            });

            renderGrantAgreement({
                ...mockAgreement,
                agreement_type: "GRANT",
                budget_line_items: []
            });

            expect(screen.getByText("Test grant description")).toBeInTheDocument();
            expect(screen.getByText("University of Example")).toBeInTheDocument();
            expect(screen.getByText("Educational Institution")).toBeInTheDocument();
            expect(screen.getByText("NY")).toBeInTheDocument();
            expect(screen.getByText("1/15/2026")).toBeInTheDocument();
            expect(screen.getByText("6/30/2026")).toBeInTheDocument();
        });

        test("falls back to TBD when the grant number has no award-time fields yet", () => {
            useGetGrantNumbersListQueryMock.mockReturnValue({
                data: [{ id: 10, number: 1 }],
                isLoading: false
            });

            renderGrantAgreement({
                ...mockAgreement,
                agreement_type: "GRANT",
                budget_line_items: []
            });

            // PoP Start, PoP End, Grantee Recipient, Organization Type, State all fall back to "TBD"
            expect(screen.getAllByText("TBD")).toHaveLength(5);
        });
    });

    describe("Grant lifecycle locks", () => {
        // A super user so the Edit button would render if editing were allowed; the lock, not the
        // user's permission, is what hides it. Regular users would hide the button regardless.
        const superUserStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [{ name: USER_ROLES.SUPER_USER }],
                        is_superuser: true
                    }
                })
            }
        });

        const grantAgreement = { ...mockAgreement, agreement_type: "GRANT", _meta: { isEditable: true } };

        const renderWithLock = (lockProps) =>
            render(
                <Provider store={superUserStore}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementBudgetLines
                            {...defaultProps}
                            agreement={grantAgreement}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={false}
                            isEditMode={false}
                            setIsEditMode={vi.fn()}
                            isPreAwardInReview={false}
                            isAwardInReview={false}
                            isPostPreAwardLocked={false}
                            {...lockProps}
                        />
                    </Router>
                </Provider>
            );

        test("hides the Edit button for a grant when pre-award is in review", () => {
            renderWithLock({ isPreAwardInReview: true });
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByText("Edit")).not.toBeInTheDocument();
        });

        test("hides the Edit button for a grant when award is in review", () => {
            renderWithLock({ isAwardInReview: true });
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByText("Edit")).not.toBeInTheDocument();
        });

        test("hides the Edit button for a grant when post-pre-award locked", () => {
            renderWithLock({ isPostPreAwardLocked: true });
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByText("Edit")).not.toBeInTheDocument();
        });

        test("enables the Edit button for a grant when no lifecycle lock is active", () => {
            renderWithLock({});
            const editButton = screen.getByRole("button", { name: /edit/i });
            expect(editButton).not.toHaveAttribute("aria-disabled");
        });
    });

    test("shows the grouped table skeleton while services components are loading", () => {
        useGetServicesComponentsListQueryMock.mockReturnValue({
            data: undefined,
            isLoading: true
        });

        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Regular User",
                        email: "user@example.com",
                        roles: [USER_ROLES.VIEWER_EDITOR]
                    }
                })
            }
        });

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementBudgetLines
                        {...defaultProps}
                        agreement={{
                            ...mockAgreement,
                            budget_line_items: [
                                {
                                    id: 1,
                                    amount: 100,
                                    fees: 5,
                                    date_needed: "2026-02-01",
                                    status: "PLANNED",
                                    services_component_id: 101,
                                    line_description: "Test budget line",
                                    can: { number: "CAN-001" },
                                    _meta: { isEditable: true }
                                }
                            ]
                        }}
                        isAgreementNotDeveloped={false}
                        isAgreementAwarded={false}
                        isEditMode={false}
                        setIsEditMode={vi.fn()}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByRole("table", { name: "Loading budget lines" })).toBeInTheDocument();
        expect(screen.queryByText("You have not added any Budget Lines yet.")).not.toBeInTheDocument();
    });

    test("super user can edit budget lines when agreement is not editable", () => {
        // Create a test store with super user
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [USER_ROLES.SUPER_USER]
                    }
                })
            }
        });

        const nonEditableAgreement = {
            ...mockAgreement,
            _meta: {
                isEditable: false
            }
        };

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementBudgetLines
                        {...defaultProps}
                        agreement={nonEditableAgreement}
                        isAgreementNotaContract={false}
                    />
                </Router>
            </Provider>
        );

        // Should render the component without errors
        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    test("regular user cannot edit budget lines on non-contract agreements", () => {
        // Create a test store with regular user (no super user role)
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Regular User",
                        email: "user@example.com",
                        roles: [USER_ROLES.VIEWER_EDITOR]
                    }
                })
            }
        });

        const grantAgreement = {
            ...mockAgreement,
            agreement_type: "GRANT"
        };

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementBudgetLines
                        {...defaultProps}
                        agreement={grantAgreement}
                        isAgreementNotaContract={true}
                    />
                </Router>
            </Provider>
        );

        // Should render the component but without edit capabilities for regular users
        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    test("regular user cannot edit budget lines when agreement is not editable", () => {
        // Create a test store with regular user (no super user role)
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Regular User",
                        email: "user@example.com",
                        roles: [USER_ROLES.VIEWER_EDITOR]
                    }
                })
            }
        });

        const nonEditableAgreement = {
            ...mockAgreement,
            _meta: {
                isEditable: false
            }
        };

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementBudgetLines
                        {...defaultProps}
                        agreement={nonEditableAgreement}
                        isAgreementNotaContract={false}
                    />
                </Router>
            </Provider>
        );

        // Should render the component but without edit capabilities for regular users
        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    describe("Read-Only User Permissions", () => {
        const readOnlyStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Read Only User",
                        email: "readonly@example.com",
                        roles: [{ name: USER_ROLES.READ_ONLY }]
                    }
                })
            }
        });

        const renderReadOnly = (props = {}) =>
            render(
                <Provider store={readOnlyStore}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementBudgetLines
                            {...defaultProps}
                            {...props}
                        />
                    </Router>
                </Provider>
            );

        test("does not show the Edit button for a read-only user on an editable agreement", () => {
            renderReadOnly();

            expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
        });

        test("does not show the Change BL Status button for a read-only user", () => {
            renderReadOnly({ canUserEditBudgetLines: true });

            expect(screen.queryByText("Change BL Status")).not.toBeInTheDocument();
        });

        test("does not show the disabled Change BL Status button for a read-only user on a non-editable agreement", () => {
            renderReadOnly({
                agreement: { ...mockAgreement, _meta: { isEditable: false } }
            });

            expect(screen.queryByText("Change BL Status")).not.toBeInTheDocument();
        });
    });

    test("super user permissions override agreement restrictions", () => {
        // Create a test store with super user
        const testStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [USER_ROLES.SUPER_USER]
                    }
                })
            }
        });

        const restrictedAgreement = {
            ...mockAgreement,
            agreement_type: "GRANT",
            _meta: {
                isEditable: false
            }
        };

        render(
            <Provider store={testStore}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementBudgetLines
                        {...defaultProps}
                        agreement={restrictedAgreement}
                        isAgreementNotaContract={true}
                    />
                </Router>
            </Provider>
        );

        // Should render the component for super users even with restrictions
        expect(screen.getByText("Budget Lines")).toBeInTheDocument();
    });

    describe("post-pre-award lock", () => {
        const regularUserStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Regular User",
                        email: "user@example.com",
                        roles: [{ name: USER_ROLES.VIEWER_EDITOR }]
                    }
                })
            }
        });
        const superUserStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Super User",
                        email: "super@example.com",
                        roles: [{ name: USER_ROLES.SUPER_USER }],
                        is_superuser: true
                    }
                })
            }
        });
        const defaultProps = {
            agreement: { ...mockAgreement, _meta: { isEditable: true } },
            isEditMode: false,
            setIsEditMode: vi.fn(),
            isAgreementNotDeveloped: false,
            isAgreementAwarded: false,
            isPreAwardInReview: false,
            isAwardInReview: false,
            isPostPreAwardLocked: true
        };
        const renderWith = (store, props = {}) =>
            render(
                <Provider store={store}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementBudgetLines
                            {...defaultProps}
                            {...props}
                        />
                    </Router>
                </Provider>
            );

        test("Edit button is hidden for regular user when isPostPreAwardLocked is true", () => {
            renderWith(regularUserStore);
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByText("Edit")).not.toBeInTheDocument();
        });

        test("Change BL Status button is disabled for regular user when isPostPreAwardLocked is true", () => {
            renderWith(regularUserStore);
            const requestButton = screen.getByText("Change BL Status");
            expect(requestButton).toHaveAttribute("aria-disabled", "true");
            expect(requestButton).toHaveAttribute("data-cy", "bli-continue-btn-disabled");
        });

        test("super user is also locked when isPostPreAwardLocked is true", () => {
            renderWith(superUserStore);
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.queryByText("Edit")).not.toBeInTheDocument();
        });
    });

    describe("CLIN column", () => {
        const editorStore = configureStore({
            reducer: {
                auth: () => ({
                    activeUser: {
                        id: 1,
                        full_name: "Regular User",
                        email: "user@example.com",
                        roles: [{ name: USER_ROLES.VIEWER_EDITOR }]
                    }
                })
            }
        });

        const budgetLineWithClin = {
            id: 5,
            amount: 1000,
            fees: 0,
            date_needed: "2044-02-01",
            status: "PLANNED",
            services_component_id: 101,
            line_description: "Test budget line",
            can: { number: "CAN-001" },
            clin: { id: 9, number: 42 },
            _meta: { isEditable: true }
        };

        const renderContract = ({ agreementType = "CONTRACT", isAgreementAwarded = true } = {}) => {
            useGetServicesComponentsListQueryMock.mockReturnValue({
                data: [{ id: 101, number: 1, sub_component: null }],
                isLoading: false
            });

            return render(
                <Provider store={editorStore}>
                    <Router
                        location={history.location}
                        navigator={history}
                    >
                        <AgreementBudgetLines
                            {...defaultProps}
                            agreement={{
                                ...mockAgreement,
                                agreement_type: agreementType,
                                budget_line_items: [budgetLineWithClin]
                            }}
                            isAgreementNotDeveloped={false}
                            isAgreementAwarded={isAgreementAwarded}
                            isEditMode={false}
                            setIsEditMode={vi.fn()}
                        />
                    </Router>
                </Provider>
            );
        };

        test("passes showClinColumn=true to the table for an awarded contract agreement", () => {
            renderContract({ agreementType: "CONTRACT", isAgreementAwarded: true });

            expect(screen.getByText("show-clin:true")).toBeInTheDocument();
        });

        test("passes showClinColumn=false for a contract agreement that is not awarded", () => {
            renderContract({ agreementType: "CONTRACT", isAgreementAwarded: false });

            expect(screen.getByText("show-clin:false")).toBeInTheDocument();
        });

        test("passes showClinColumn=false for an awarded grant agreement", () => {
            renderContract({ agreementType: "GRANT", isAgreementAwarded: true });

            expect(screen.getByText("show-clin:false")).toBeInTheDocument();
        });
    });
});
