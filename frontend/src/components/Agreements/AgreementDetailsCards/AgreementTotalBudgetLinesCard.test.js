import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AgreementTotalBudgetLinesCard from "./AgreementTotalBudgetLinesCard";

jest.mock("react", () => ({
    ...jest.requireActual("react"),
    useState: () => [null, jest.fn()],
}));

// This will reset all mocks after each test
afterEach(() => {
    jest.resetAllMocks();
});

describe("AgreementTotalBudgetLinesCard", () => {
    test("renders correctly", () => {
        const countsByStatus = {
            IN_EXECUTION: 8,
            OBLIGATED: 1,
            PLANNED: 7,
        };
        render(<AgreementTotalBudgetLinesCard numberOfAgreements={16} countsByStatus={countsByStatus} />);

        expect(screen.getByText("0 Draft")).toBeInTheDocument();
        expect(screen.getByText("0 In Review")).toBeInTheDocument();
        expect(screen.getByText("7 Planned")).toBeInTheDocument();
        expect(screen.getByText("8 Executing")).toBeInTheDocument();
        expect(screen.getByText("1 Obligated")).toBeInTheDocument();
    });
});
