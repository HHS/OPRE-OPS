import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import AgreementSelect from "./AgreementSelect";

const mockFn = TestApplicationContext.helpers().mockFn;

vi.mock("../../../hooks/user.hooks");

describe("AgreementSelect", () => {
    const agreementsMock = [
        {
            id: 1,
            name: "Agreement 1",
            description: "Description 1",
            project_officer: "John Doe",
            period_of_performance_start: "2022-01-01",
            period_of_performance_end: "2022-12-31",
            budget_line_items: [
                {
                    id: 1,
                    description: "Budget Line 1",
                    comments: "Comments 1",
                    can: {
                        id: 1,
                        code: "CAN 1",
                        name: "CAN 1"
                    }
                },
                {
                    id: 2,
                    description: "Budget Line 2",
                    comments: "Comments 2",
                    can: {
                        id: 2,
                        code: "CAN 2",
                        name: "CAN 2"
                    }
                }
            ],
            procurement_shop: null
        },
        {
            id: 2,
            name: "Agreement 2",
            description: "Description 2",
            project_officer: "Jane Smith",
            period_of_performance_start: "2022-01-01",
            period_of_performance_end: "2022-12-31",
            budget_line_items: [],
            procurement_shop: null
        }
    ];

    it("renders without crashing", () => {
        render(<AgreementSelect agreements={agreementsMock} />);
    });

    it("renders correct number of agreement options", () => {
        render(<AgreementSelect agreements={agreementsMock} />);
        const selectInput = screen.getByTestId("agreement-select");
        const options = within(selectInput).getAllByRole("option");
        expect(options.length).toBe(agreementsMock.length + 1); // "+ 1" for the default empty option
    });

    it("calls onChangeAgreementSelection when an agreement is selected", () => {
        const setSelectedAgreementMock = mockFn;
        const setSelectedProcurementShopMock = mockFn;
        const setBudgetLinesAddedMock = mockFn;
        render(
            <AgreementSelect
                agreements={agreementsMock}
                setSelectedAgreement={setSelectedAgreementMock}
                setSelectedProcurementShop={setSelectedProcurementShopMock}
                setBudgetLinesAdded={setBudgetLinesAddedMock}
            />
        );

        const selectInput = screen.getByTestId("agreement-select");
        fireEvent.change(selectInput, { target: { value: 1 } });

        expect(setSelectedAgreementMock).toHaveBeenCalled();
        expect(setBudgetLinesAddedMock).toHaveBeenCalled();
        expect(setSelectedProcurementShopMock).toHaveBeenCalled();
    });

    it("displays the correct agreement information in the summary card", () => {
        const selectedAgreementMock = agreementsMock[0];
        useGetUserFullNameFromId.mockReturnValue("John Doe");
        render(
            <AgreementSelect
                selectedAgreement={selectedAgreementMock}
                agreements={agreementsMock}
            />
        );

        const summaryCard = screen.getByTestId("agreement-summary-card");

        expect(summaryCard).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("does not display the summary card when no agreement is selected", () => {
        render(<AgreementSelect agreements={agreementsMock} />);
        const summaryCard = screen.queryByTestId("agreement-summary-card");
        expect(summaryCard).not.toBeInTheDocument();
    });
});
