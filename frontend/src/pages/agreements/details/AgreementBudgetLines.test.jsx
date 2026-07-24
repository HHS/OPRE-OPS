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

        test("disables the Edit button for a grant agreement", () => {
            renderAgreement({ ...mockAgreement, agreement_type: "GRANT" });

            // The clickable Edit button (a real <button>) is replaced by the disabled span variant
            expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
            expect(screen.getByText("Edit")).toBeInTheDocument();
        });

        test("disables the Request BL Status Change button for a grant agreement", () => {
            renderAgreement({ ...mockAgreement, agreement_type: "GRANT" });

            const requestButton = screen.getByText("Request BL Status Change");
            expect(requestButton).toHaveAttribute("aria-disabled", "true");
            expect(requestButton).toHaveAttribute("data-cy", "bli-continue-btn-disabled");
            expect(screen.queryByRole("link", { name: "Request BL Status Change" })).not.toBeInTheDocument();
        });

        test("keeps the Edit and Request BL Status Change buttons enabled for a contract agreement", () => {
            renderAgreement({ ...mockAgreement, agreement_type: "CONTRACT" });

            const editButton = screen.getByRole("button", { name: /edit/i });
            expect(editButton).not.toHaveAttribute("aria-disabled");

            const requestLink = screen.getByRole("link", { name: "Request BL Status Change" });
            expect(requestLink).toHaveAttribute("data-cy", "bli-continue-btn");
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

        test("does not show the Request BL Status Change button for a read-only user", () => {
            renderReadOnly({ canUserEditBudgetLines: true });

            expect(screen.queryByText("Request BL Status Change")).not.toBeInTheDocument();
        });

        test("does not show the disabled Request BL Status Change button for a read-only user on a non-editable agreement", () => {
            renderReadOnly({
                agreement: { ...mockAgreement, _meta: { isEditable: false } }
            });

            expect(screen.queryByText("Request BL Status Change")).not.toBeInTheDocument();
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
});
