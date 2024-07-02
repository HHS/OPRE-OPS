import { Provider } from "react-redux";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AgreementsTable from "./AgreementsTable";
import configureStore from "redux-mock-store";
import { vi } from "vitest";

const mockStore = configureStore([]);
const agreements = [
    {
        id: 1,
        name: "Test Agreement",
        display_name: "Test Agreement",
        project: { title: "Test Project" },
        agreement_type: "GRANT",
        project_officer_id: 1,
        team_members: [{ id: 1 }],
        procurement_shop: { fee: 0.05 },
        budget_line_items: [
            { amount: 100, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
            { amount: 200, date_needed: "2023-03-02T11:00:00", status: "DRAFT" },
            { amount: 300, date_needed: "2043-03-04T11:00:00", status: "PLANNED", proc_shop_fee_percentage: 0.05 }
        ],
        created_by: 1,
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00"
    }
];
const userData = {
    id: 500,
    full_name: "Test User"
};

vi.mock("../../../api/opsAPI", async () => {
    const actual = await vi.importActual("../../../api/opsAPI");
    return {
        ...actual,
        useGetUserByIdQuery: () => ({ data: userData }),
        useGetAgreementByIdQuery: () => ({ data: agreements[0] })
    };
});

const initialState = {
    auth: {
        activeUser: {
            id: 500,
            name: "Test User"
        }
    },
    alert: {
        isActive: false
    }
};
const store = mockStore(initialState);

it("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BrowserRouter>
                <AgreementsTable agreements={agreements} />
            </BrowserRouter>
        </Provider>
    );
    expect(screen.getByText("Test Agreement")).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Grant")).toBeInTheDocument();
    expect(screen.getByText("$630.00")).toBeInTheDocument();
    expect(screen.getByText("$315.00")).toBeInTheDocument();
    expect(screen.getByText("3/4/2043")).toBeInTheDocument();
});
