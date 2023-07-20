import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgreementDetails from "./AgreementDetails";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";

const history = createMemoryHistory();

jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => jest.fn(),
}));

jest.mock("react", () => ({
    ...jest.requireActual("react"),
    useState: () => [null, jest.fn()],
}));

// This will reset all mocks after each test
afterEach(() => {
    jest.resetAllMocks();
});

describe("AgreementDetails", () => {
    const agreement = {
        id: 1,
        name: "Test Agreement",
        description: "Test Description",
        research_project: { title: "Test Project" },
        agreement_type: "CONTRACT",
        product_service_code: {
            name: "Test PSC",
            naics: "Test NAICS",
        },

        procurement_shop: {
            abbr: "NIH",
            fee: 0.005,
            name: "National Institute of Health",
        },
        agreement_reason: "RECOMPETE",
        incumbent: "Test Incumbent",
        project_officer: 1,
        team_members: [
            {
                full_name: "Amy Madigan",
                id: 2,
            },
            {
                full_name: "Ivelisse Martinez-Beck",
                id: 3,
            },
        ],
        budget_line_items: [
            { amount: 100, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
            { amount: 200, date_needed: "2023-03-02T11:00:00", status: "UNDER_REVIEW" },
        ],
        created_by: "user1",
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00",
    };

    const projectOfficer = {
        full_name: "Chris Fortunato",
        id: 1,
    };

    test("renders correctly", () => {
        render(
            <Router location={history.location} navigator={history}>
                <table>
                    <tbody>
                        <AgreementDetails agreement={agreement} projectOfficer={projectOfficer} />
                    </tbody>
                </table>
            </Router>
        );

        // expect(screen.getByText("Test Agreement")).toBeInTheDocument();
        // expect(screen.getByText("Test Project")).toBeInTheDocument();
        expect(screen.getByText("Test Description")).toBeInTheDocument();
        expect(screen.getByText("Agreement Type")).toBeInTheDocument();
        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("Product Service Code")).toBeInTheDocument();
        expect(screen.getByText("Test PSC")).toBeInTheDocument();
        expect(screen.getByText("NAICS Code")).toBeInTheDocument();
        expect(screen.getByText("Test NAICS")).toBeInTheDocument();
        expect(screen.getByText("Procurement Shop")).toBeInTheDocument();
        expect(screen.getByText("NIH - Fee Rate: 0.5%")).toBeInTheDocument();
        expect(screen.getByText("Agreement Reason")).toBeInTheDocument();
        expect(screen.getByText("Recompete")).toBeInTheDocument();
        expect(screen.getByText("Incumbent")).toBeInTheDocument();
        expect(screen.getByText("Test Incumbent")).toBeInTheDocument();
        expect(screen.getByText("Project Officer")).toBeInTheDocument();
        expect(screen.getByText("Chris Fortunato")).toBeInTheDocument();
        expect(screen.getByText("Team Members")).toBeInTheDocument();
        expect(screen.getByText("Amy Madigan")).toBeInTheDocument();
        expect(screen.getByText("Ivelisse Martinez-Beck")).toBeInTheDocument();
    });
});
