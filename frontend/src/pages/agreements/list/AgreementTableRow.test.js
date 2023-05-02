import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AgreementTableRow } from "./AgreementTableRow";

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

describe("AgreementTableRow", () => {
    const agreement = {
        id: 1,
        name: "Test Agreement",
        research_project: { title: "Test Project" },
        agreement_type: "GRANT",
        procurement_shop: { fee: 0.05 },
        budget_line_items: [
            { amount: 100, date_needed: "2024-05-02T11:00:00", status: "DRAFT" },
            { amount: 200, date_needed: "2023-03-02T11:00:00", status: "UNDER_REVIEW" },
        ],
        created_by: "user1",
        notes: "Test notes",
        created_on: "2021-10-21T03:24:00",
    };

    test("renders correctly", () => {
        render(<AgreementTableRow agreement={agreement} />);

        expect(screen.getByText("Test Agreement")).toBeInTheDocument();
        expect(screen.getByText("Test Project")).toBeInTheDocument();
        expect(screen.getByText("Grant")).toBeInTheDocument();
        expect(screen.getByText("$315.00")).toBeInTheDocument();
        expect(screen.getByText("3/2/2023")).toBeInTheDocument();
        expect(screen.getByText("In Review")).toBeInTheDocument();
    });
});
