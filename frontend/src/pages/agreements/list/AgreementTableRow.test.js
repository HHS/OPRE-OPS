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
            { amount: 100, date_needed: "2024-05-02", status: "DRAFT" },
            { amount: 200, date_needed: "2023-03-02", status: "UNDER_REVIEW" },
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
        expect(screen.getByText("3/1/2023")).toBeInTheDocument();
        expect(screen.getByText("In Review")).toBeInTheDocument();
    });
});
// test("expands row when chevron is clicked", () => {
//     render(<AgreementTableRow agreement={agreement} />);
//     fireEvent.click(screen.getByLabelText("expand row"));

//     expect(screen.getByLabelText("expandable row")).toBeInTheDocument();
// });

// test.skip("edit button triggers function", () => {
//     const mockHandleEdit = jest.fn();
//     render(<AgreementTableRow agreement={agreement} handleEditAgreement={mockHandleEdit} />);
//     fireEvent.click(screen.getByTitle("edit"));

//     expect(mockHandleEdit).toBeCalled();
// });

// test.skip("delete button triggers function", () => {
//     const mockHandleDelete = jest.fn();
//     render(<AgreementTableRow agreement={agreement} handleDeleteAgreement={mockHandleDelete} />);
//     fireEvent.click(screen.getByTitle("delete"));

//     expect(mockHandleDelete).toBeCalled();
// });

// test("approve button triggers function", () => {
//     const mockHandleSubmit = jest.fn();
//     render(<AgreementTableRow agreement={agreement} handleSubmitAgreementForApproval={mockHandleSubmit} />);
//     fireEvent.click(screen.getByTitle("submit for approval"));

//     expect(mockHandleSubmit).toBeCalled();
// });
//});
