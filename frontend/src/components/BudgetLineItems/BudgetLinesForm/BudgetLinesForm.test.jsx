import { render, screen } from "@testing-library/react";
import {
    useGetAgreementByIdQuery,
    useGetCansQuery,
    useGetUserByIdQuery,
    useGetServicesComponentsListQuery
} from "../../../api/opsAPI";
import { Provider } from "react-redux";
import store from "../../../store";
import BudgetLinesForm from "./BudgetLinesForm";
import { budgetLine, agreement, servicesComponent } from "../../../tests/data";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import { vi } from "vitest";

const mockFn = TestApplicationContext.helpers().mockFn;
const setSelectedCan = mockFn;
const setServicesComponentId = mockFn;
const setEnteredAmount = mockFn;
const setEnteredComments = mockFn;
const setNeedByDate = mockFn;
const handleEditBLI = mockFn;
const handleAddBLI = mockFn;
const handleResetForm = mockFn;

useGetAgreementByIdQuery.mockReturnValue({ data: agreement });
useGetUserByIdQuery.mockReturnValue({ data: { full_name: "John Doe" } });
useGetCansQuery.mockReturnValue({ data: [budgetLine.can] });
useGetServicesComponentsListQuery.mockReturnValue({
    data: [servicesComponent],
    isSuccess: true
});
vi.mock("../../../api/opsAPI");

describe("BudgetLinesForm", () => {
    const defaultProps = {
        agreementId: budgetLine.agreement_id,
        selectedCan: budgetLine.can,
        setSelectedCan,
        servicesComponentId: 1,
        setServicesComponentId,
        enteredAmount: budgetLine.amount,
        setEnteredAmount,
        enteredComments: budgetLine.comments,
        setEnteredComments,
        needByDate: budgetLine.date_needed,
        setNeedByDate,
        handleEditBLI,
        handleAddBLI,
        handleResetForm,
        isEditing: true,
        isReviewMode: true,
        isEditMode: true
    };

    it("should render the component", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );
        screen.debug();

        const amount = screen.getByRole("textbox", { name: /amount/i });
        const needByDate = screen.getByRole("textbox", { name: /need by date/i });
        const comments = screen.getByRole("textbox", { name: /notes/i });
        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        const cans = screen.getByRole("combobox", { name: /can/i });
        const servicesComponent = screen.getByRole("combobox", { name: /services component/i });
        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });
        const selectedCan = screen.getByText(budgetLine.can.number);

        expect(amount).toHaveValue("1,000,000");
        expect(needByDate).toHaveValue("2043-06-13");
        expect(comments).toHaveValue("comment one");
        expect(cans).toBeInTheDocument();
        expect(selectedCan).toBeInTheDocument();
        expect(servicesComponent).toHaveValue("1");
        expect(cancelBtn).not.toBeDisabled();
        expect(updateBudgetLineBtn).not.toBeDisabled();
    });
});
