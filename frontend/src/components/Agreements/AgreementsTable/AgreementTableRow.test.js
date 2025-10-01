import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgreementTableRow } from "./AgreementTableRow";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { vi } from "vitest";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { opsApi } from "../../../api/opsAPI";
import { configureStore } from "@reduxjs/toolkit";
import { USER_ROLES } from "../../Users/User.constants";

const mockFn = TestApplicationContext.helpers().mockFn;
const history = createMemoryHistory();

vi.mock("react", async () => {
    const actual = await vi.importActual("react");
    return {
        ...actual,
        useState: () => [null, mockFn]
    };
});

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

const userData = {
    id: 500,
    full_name: "Test User"
};

// Create a mock that can be changed per test
let mockAgreementData = null;

vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");

    return {
        ...actual,
        useGetUserByIdQuery: () => ({ data: userData }),
        useLazyGetUserByIdQuery: () => [vi.fn().mockResolvedValue({ data: userData })],
        useGetAgreementByIdQuery: () => ({
            data: mockAgreementData,
            isLoading: false,
            isSuccess: true
        })
    };
});

const baseAgreement = {
    id: 1,
    name: "Test Agreement",
    display_name: "Test Agreement",
    project: { title: "Test Project" },
    agreement_type: "CONTRACT", // CONTRACT is a developed type
    project_officer_id: 1,
    team_members: [{ id: 500 }], // Include test user as team member
    procurement_shop: { fee_percentage: 5.0 },
    budget_line_items: [
        { amount: 100, fees: 5, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
        { amount: 200, fees: 10, date_needed: "2023-03-02T11:00:00", status: "DRAFT" },
        { amount: 300, fees: 15, date_needed: "2043-03-04T11:00:00", status: "PLANNED", proc_shop_fee_percentage: 5.0 }
    ],
    created_by: 1,
    notes: "Test notes",
    created_on: "2021-10-21T03:24:00",
    _meta: {
        isEditable: true
    }
};

const createMockStore = (userRoles = [USER_ROLES.VIEWER_EDITOR]) => {
    const initialState = {
        auth: {
            activeUser: {
                id: 500,
                name: "Test User",
                roles: userRoles
            }
        },
        alert: {
            isActive: false
        }
    };

    return configureStore({
        reducer: {
            [opsApi.reducerPath]: opsApi.reducer,
            auth: (state = initialState.auth) => state,
            alert: (state = initialState.alert) => state
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(opsApi.middleware),
        preloadedState: initialState
    });
};

const renderComponent = (userRoles = [USER_ROLES.VIEWER_EDITOR], agreementData = baseAgreement) => {
    // Set the mock data for this test
    mockAgreementData = agreementData;

    const store = createMockStore(userRoles);

    return render(
        <Provider store={store}>
            <Router
                location={history.location}
                navigator={history}
            >
                <table>
                    <tbody>
                        <AgreementTableRow agreementId={agreementData.id} />
                    </tbody>
                </table>
            </Router>
        </Provider>
    );
};

describe("AgreementTableRow", () => {
    test("renders correctly", () => {
        renderComponent();

        expect(screen.getAllByText("Test Agreement")[0]).toBeInTheDocument();
        expect(screen.getByText("Test Project")).toBeInTheDocument();
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getAllByText("$315.00")).toHaveLength(2);
    });

    describe("Super User Edit Permissions", () => {
        test("super user can edit agreements regardless of isEditable status", async () => {
            const nonEditableAgreement = {
                ...baseAgreement,
                _meta: { isEditable: false }
            };

            renderComponent([USER_ROLES.SUPER_USER], nonEditableAgreement);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            // Should see edit button that is not disabled
            const editButton = screen.getByTestId("edit-row");
            expect(editButton).toBeInTheDocument();
            expect(editButton).not.toBeDisabled();
        });

        test("super user can edit agreements with not developed agreement type", async () => {
            const notDevelopedAgreement = {
                ...baseAgreement,
                agreement_type: "IAA", // IAA is not developed yet
                _meta: { isEditable: true }
            };

            renderComponent([USER_ROLES.SUPER_USER], notDevelopedAgreement);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            // Should see edit button that is not disabled
            const editButton = screen.getByTestId("edit-row");
            expect(editButton).toBeInTheDocument();
            expect(editButton).not.toBeDisabled();
        });

        test("super user sees no locked message tooltip", async () => {
            const nonEditableAgreement = {
                ...baseAgreement,
                _meta: { isEditable: false }
            };

            renderComponent([USER_ROLES.SUPER_USER], nonEditableAgreement);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            const editButton = screen.getByTestId("edit-row");

            // For super users, the edit button should be enabled (not disabled)
            expect(editButton).not.toBeDisabled();
        });

        test("super user can delete agreements regardless of budget line status", async () => {
            const agreementWithPlannedBudgetLines = {
                ...baseAgreement,
                budget_line_items: [
                    { amount: 100, fees: 5, date_needed: "2024-05-02T11:00:00", status: "PLANNED" }
                ],
                _meta: { isEditable: false }
            };

            renderComponent([USER_ROLES.SUPER_USER], agreementWithPlannedBudgetLines);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            // Should see delete button that is not disabled
            const deleteButton = screen.getByTestId("delete-row");
            expect(deleteButton).toBeInTheDocument();
            expect(deleteButton).not.toBeDisabled();
        });
    });

    describe("Regular User Edit Permissions", () => {
        test("regular user cannot edit non-editable agreements", async () => {
            const nonEditableAgreement = {
                ...baseAgreement,
                _meta: { isEditable: false }
            };

            renderComponent([USER_ROLES.VIEWER_EDITOR], nonEditableAgreement);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            // Should see edit button that is disabled
            const editButton = screen.getByTestId("edit-row");
            expect(editButton).toBeInTheDocument();
            expect(editButton).toBeDisabled();
        });

        test("regular user cannot edit agreements with not developed type", async () => {
            const notDevelopedAgreement = {
                ...baseAgreement,
                agreement_type: "IAA", // IAA is not developed yet
                _meta: { isEditable: true }
            };

            renderComponent([USER_ROLES.VIEWER_EDITOR], notDevelopedAgreement);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            // Should see edit button that is disabled
            const editButton = screen.getByTestId("edit-row");
            expect(editButton).toBeInTheDocument();
            expect(editButton).toBeDisabled();
        });

        test("regular user can edit editable agreements of developed type when user is on team", async () => {
            renderComponent([USER_ROLES.VIEWER_EDITOR], baseAgreement);

            const user = userEvent.setup();

            // Hover over the table row to activate it and show ChangeIcons in the hover area
            const tableRow = screen.getByTestId("agreement-table-row-1");
            await user.hover(tableRow);

            // Should see edit button that is not disabled (in the last cell when hovered)
            const editButton = screen.getByTestId("edit-row");
            expect(editButton).toBeInTheDocument();
            expect(editButton).not.toBeDisabled();
        });
    });
});
