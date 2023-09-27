import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgreementDetailsEdit from "./AgreementDetailsEdit";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";
import store from "../../../store";
import { Provider } from "react-redux";
// import { useGetProductServiceCodesQuery } from "../../../api/opsAPI";
// import ProductServiceCodeSelect from "../../../components/UI/Form/ProductServiceCodeSelect"

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

jest.mock("../../../api/opsAPI", () => ({
    ...jest.requireActual("../../../api/opsAPI"),
    useGetProductServiceCodesQuery: () => jest.fn(() => ({ data: productServiceCodesData }))
}));

// eslint-disable-next-line react/display-name
jest.mock("../../../components/UI/Form/ProductServiceCodeSelect", () => () => {
    return <div />;
});

// mocking ResponsiveBar until there's a solution for TypeError: Cannot read properties of null (reading 'width')
jest.mock("@nivo/bar", () => ({
    __esModule: true,
    ResponsiveBar: () => {
        return <div />;
    }
}));

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => jest.fn()
}));

jest.mock("react", () => ({
    ...jest.requireActual("react"),
    useState: () => [null, jest.fn()]
}));

// This will reset all mocks after each test
afterEach(() => {
    jest.resetAllMocks();
});

const history = createMemoryHistory();

describe("AgreementDetailsEdit", () => {
    const agreement = {
        id: 1,
        name: "Test Agreement",
        description: "Test Description",
        research_project: { title: "Test Project" },
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
        incumbent: "Test Incumbent",
        project_officer: 1,
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
            { amount: 200, date_needed: "2023-03-02T11:00:00", status: "UNDER_REVIEW" }
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
                        setIsEditMode={jest.fn()}
                    />
                </Router>
            </Provider>
        );

        expect(screen.getByText("Agreement Title")).toBeInTheDocument();
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Incumbent")).toBeInTheDocument();
        expect(screen.getByText("Team Members Added")).toBeInTheDocument();
        expect(screen.getByText("Amy Madigan")).toBeInTheDocument();
        expect(screen.getByText("Ivelisse Martinez-Beck")).toBeInTheDocument();
        expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
        expect(screen.getByText("Test notes")).toBeInTheDocument();
        expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });
});
