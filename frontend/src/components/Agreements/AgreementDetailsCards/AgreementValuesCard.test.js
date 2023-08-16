import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgreementValuesCard from "./AgreementValuesCard";

// mocking ResponsiveBar until there's a solution for TypeError: Cannot read properties of null (reading 'width')
jest.mock("@nivo/bar", () => ({
    __esModule: true,
    ResponsiveBar: () => {
        return <div />;
    },
}));

jest.mock("react", () => ({
    ...jest.requireActual("react"),
    useState: () => [null, jest.fn()],
}));

// This will reset all mocks after each test
afterEach(() => {
    jest.resetAllMocks();
});

describe("AgreementValuesCard", () => {
    test("renders correctly", () => {
        const budgetLineItems = [
            {
                agreement_id: 2,
                amount: 1000000,
                comments: "",
                created_by: null,
                created_on: "2023-07-26T16:22:35.470618",
                date_needed: "2043-06-13",
                id: 3,
                line_description: "Line Item 1",
                psc_fee_amount: 0.5,
                status: "PLANNED",
                updated_on: "2023-07-26T16:22:35.470618",
            },
            {
                agreement_id: 2,
                amount: 1000000,
                can_id: 8,
                comments: "",
                created_by: null,
                created_on: "2023-07-26T16:22:35.470618",
                date_needed: "2043-06-13",
                id: 4,
                line_description: "Line Item 2",
                psc_fee_amount: 0.5,
                status: "PLANNED",
                updated_on: "2023-07-26T16:22:35.470618",
            },
            {
                agreement_id: 2,
                amount: 1000000,
                can_id: 9,
                comments: "",
                created_by: null,
                created_on: "2023-07-26T16:22:35.470618",
                date_needed: "2043-06-13",
                id: 5,
                line_description: "Line Item 1",
                psc_fee_amount: 0.5,
                status: "PLANNED",
                updated_on: "2023-07-26T16:22:35.470618",
            },
            {
                agreement_id: 2,
                amount: 1000000,
                can_id: 9,
                comments: "",
                created_by: null,
                created_on: "2023-07-26T16:22:35.470618",
                date_needed: "2043-06-13",
                id: 6,
                line_description: "Line Item 2",
                psc_fee_amount: 0.5,
                status: "PLANNED",
                updated_on: "2023-07-26T16:22:35.470618",
            },
            {
                agreement_id: 2,
                amount: 2000000,
                can_id: 9,
                comments: "",
                created_by: null,
                created_on: "2023-07-26T16:22:35.470618",
                date_needed: "2043-06-13",
                id: 8,
                line_description: "Line Item 2",
                psc_fee_amount: 0.5,
                status: "IN_EXECUTION",
                updated_on: "2023-07-26T16:22:35.470618",
            },
            {
                agreement_id: 2,
                amount: 2000000,
                can_id: 1,
                comments: "",
                created_by: null,
                created_on: "2023-07-26T16:22:35.470618",
                date_needed: "2043-06-13",
                id: 9,
                line_description: "Line Item 2",
                psc_fee_amount: 0.5,
                status: "IN_EXECUTION",
                updated_on: "2023-07-26T16:22:35.470618",
            },
        ];

        render(<AgreementValuesCard budgetLineItems={budgetLineItems} />);

        expect(screen.getByText("Total Agreement Value")).toBeInTheDocument();
    });
});
