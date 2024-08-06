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
import userEvent from "@testing-library/user-event";

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
        isEditMode: true,
        isBudgetLineNotDraft: false
    };

    it("should render the component", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );

        const amount = screen.getByRole("textbox", { name: /amount/i });
        const needByDate = screen.getByRole("textbox", { name: /obligate by date/i });
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
    it("should call handleResetForm when the cancel button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );

        const cancelBtn = screen.getByRole("button", { name: /cancel/i });
        await user.click(cancelBtn);

        expect(handleResetForm).toHaveBeenCalled();
    });
    it("should call handleEditBLI when the update button is clicked", async () => {
        const user = userEvent.setup();
        render(
            <Provider store={store}>
                <BudgetLinesForm {...defaultProps} />
            </Provider>
        );
        const needByDate = screen.getByRole("textbox", { name: /obligate by date/i });
        expect(needByDate).toHaveValue("2043-06-13");
        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });
        expect(updateBudgetLineBtn).not.toBeDisabled();

        await user.click(updateBudgetLineBtn);

        expect(handleEditBLI).toHaveBeenCalled();
    });
    it("should not allow the user to submit the form if need by date is blank", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    needByDate={null}
                />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it("should not allow the user to submit the form if need by date is not valid string", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    needByDate="tacocat"
                />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it.todo("should not allow the user to submit the form if need by date is in the past", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    needByDate="1982-06-13"
                />
            </Provider>
        );

        const needByDate = screen.getByRole("textbox", { name: /need by date/i });
        expect(needByDate).toHaveValue("1982-06-13");
        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it("should not allow the user to submit the form if the form is not valid in review mode", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    isReviewMode={true}
                    needByDate={null}
                    selectedCan={null}
                    enteredAmount={null}
                />
            </Provider>
        );
        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it("should not allow user to submit the form if the amount is not valid and BLI is not DRAFT", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    isReviewMode={false}
                    enteredAmount={null}
                    isBudgetLineNotDraft={true}
                />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it("should not allow user to submit the form if the date needed is not valid and BLI is not DRAFT", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    isReviewMode={false}
                    needByDate={null}
                    isBudgetLineNotDraft={true}
                />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it("should not allow user to submit the form if the selected CAN is not valid and BLI is not DRAFT", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    isReviewMode={false}
                    selectedCan={null}
                    isBudgetLineNotDraft={true}
                />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
    it("should not allow user to submit the form if the services component is not valid and BLI is not DRAFT", () => {
        render(
            <Provider store={store}>
                <BudgetLinesForm
                    {...defaultProps}
                    isReviewMode={false}
                    servicesComponentId={null}
                    isBudgetLineNotDraft={true}
                />
            </Provider>
        );

        const updateBudgetLineBtn = screen.getByRole("button", { name: /update budget line/i });

        expect(updateBudgetLineBtn).toBeDisabled();
    });
});
