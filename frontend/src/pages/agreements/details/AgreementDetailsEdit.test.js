import { render, screen } from "@testing-library/react";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import { Provider } from "react-redux";
import { vi } from "vitest";
import AgreementDetailsEdit from "./AgreementDetailsEdit";
import store from "../../../store";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

const productServiceCodesData = [
    {
        id: 1,
        naics: 541690,
        name: "Other Scientific and Technical Consulting Services",
        support_code: "R410 - Research"
    },
    {
        id: 2,
        naics: 561920,
        name: "Convention and Trade Shows",
        support_code: "R706 - Support"
    }
];

vi.mock("../../../api/opsAPI", async () => {
    const actual = await import("../../../api/opsAPI");
    return {
        ...actual,
        useGetProductServiceCodesQuery: () => ({ data: productServiceCodesData })
    };
});

vi.mock("../../../components/UI/Form/ProductServiceCodeSelect", async () => {
    const actual = await vi.importActual("../../../components/UI/Form/ProductServiceCodeSelect");
    return {
        ...actual,
        default: () => <div />
    };
});

// mocking ResponsiveBar until there's a solution for TypeError: Cannot read properties of null (reading 'width')
vi.mock("@nivo/bar", () => ({
    __esModule: true,
    ResponsiveBar: () => {
        return <div />;
    }
}));

vi.mock("react-router-dom", async () => {
    const actual = await import("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockFn
    };
});

vi.mock("react", async () => {
    const actual = await import("react");
    return {
        ...actual,
        useState: () => [null, mockFn]
    };
});

// This will reset all mocks after each test
afterEach(() => {
    vi.resetAllMocks();
});

const history = createMemoryHistory();

describe("AgreementDetailsEdit", () => {
    const agreement = {
        id: 1,
        name: "Test Agreement",
        description: "Test Description",
        project: { title: "Test Project" },
        agreement_type: "CONTRACT",
        product_service_code: {
            name: "Test PSC",
            naics: "Test NAICS"
        },

        procurement_shop: {
            abbr: "NIH",
            fee: 0.005,
            name: "National Institute of Health"
        },
        agreement_reason: "RECOMPETE",
        vendor: "Test Vendor",
        project_officer_id: 1,
        team_members: [
            {
                full_name: "Amy Madigan",
                id: 2
            },
            {
                full_name: "Ivelisse Martinez-Beck",
                id: 3
            }
        ],
        budget_line_items: [
            { amount: 100, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
            { amount: 200, date_needed: "2023-03-02T11:00:00", status: "DRAFT" }
        ],
        created_by: "user1",
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00"
    };

    const projectOfficer = {
        full_name: "Chris Fortunato",
        id: 1
    };

    test("renders correctly", () => {
        // useGetProductServiceCodesQuery.mockReturnValue(productServiceCodesData);

        render(
            <Provider store={store}>
                <Router
                    location={history.location}
                    navigator={history}
                >
                    <AgreementDetailsEdit
                        agreement={agreement}
                        projectOfficer={projectOfficer}
                        isEditMode={true}
                        setIsEditMode={mockFn}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText("Agreement Title")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Vendor")).toBeInTheDocument();
        expect(screen.getByText("Team Members Added")).toBeInTheDocument();
        expect(screen.getByText("Amy Madigan")).toBeInTheDocument();
        expect(screen.getByText("Ivelisse Martinez-Beck")).toBeInTheDocument();
        expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
        expect(screen.getByText("Test notes")).toBeInTheDocument();
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });
});
