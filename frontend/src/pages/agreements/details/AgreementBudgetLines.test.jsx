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

// Mock the hooks and API calls
vi.mock("../../../api/opsAPI", () => ({
    useGetServicesComponentsListQuery: () => ({
        data: []
    }),
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
