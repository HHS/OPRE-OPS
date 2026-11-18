import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSubmitDeObligationMutation } from "../../../api/opsAPI";
import { useEditAgreementDispatch } from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";
import DeObligationModal from "./DeObligationModal";

const mockSubmit = vi.fn();
const mockSetAlert = vi.fn();
const mockDispatch = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useSubmitDeObligationMutation: vi.fn()
}));

vi.mock("../../Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreementDispatch: vi.fn()
}));

vi.mock("../../../hooks/use-alert.hooks", () => ({
    __esModule: true,
    default: () => ({ setAlert: mockSetAlert })
}));

const BUDGET_LINE = {
    id: 123457,
    amount: 500000,
    requested_de_obligation_amount: null
};

const renderModal = (props = {}) =>
    render(
        <DeObligationModal
            budgetLine={BUDGET_LINE}
            isOpen={true}
            onClose={vi.fn()}
            {...props}
        />
    );

describe("DeObligationModal", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders nothing when closed", () => {
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        const { container } = renderModal({ isOpen: false });

        expect(container).toBeEmptyDOMElement();
    });

    it("shows the confirmation step first", () => {
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        renderModal();

        expect(
            screen.getByText(/Editing an obligated budget line can only be completed for de-obligations/i)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Yes, De-obligate Funding" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
    });

    it("closes without submitting when the user clicks Go back", async () => {
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        const onClose = vi.fn();
        renderModal({ onClose });

        await userEvent.click(screen.getByRole("button", { name: "Go back" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("advances to the amount step after confirming", async () => {
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        renderModal();

        await userEvent.click(screen.getByRole("button", { name: "Yes, De-obligate Funding" }));

        expect(screen.getByLabelText(/De-obligated Amount/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Update Budget Line" })).toBeInTheDocument();
    });

    it("blocks submission and shows an error for an out-of-range amount", async () => {
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        renderModal();
        await userEvent.click(screen.getByRole("button", { name: "Yes, De-obligate Funding" }));

        await userEvent.type(screen.getByLabelText(/De-obligated Amount/i), "600000");
        await userEvent.click(screen.getByRole("button", { name: "Update Budget Line" }));

        expect(
            screen.getByText("The de-obligated amount can't be more than the budget line's obligated amount")
        ).toBeInTheDocument();
        expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("submits a valid amount, updates the local draft, and shows a success alert", async () => {
        const updatedBudgetLine = {
            ...BUDGET_LINE,
            requested_de_obligation_amount: 100000,
            net_amount: 400000
        };
        mockSubmit.mockReturnValue({ unwrap: () => Promise.resolve(updatedBudgetLine) });
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        const onClose = vi.fn();
        renderModal({ onClose });
        await userEvent.click(screen.getByRole("button", { name: "Yes, De-obligate Funding" }));

        await userEvent.type(screen.getByLabelText(/De-obligated Amount/i), "100000");
        await userEvent.click(screen.getByRole("button", { name: "Update Budget Line" }));

        expect(mockSubmit).toHaveBeenCalledWith({ id: BUDGET_LINE.id, requestedAmount: 100000 });
        await vi.waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
        expect(mockDispatch).toHaveBeenCalledWith({
            type: "UPDATE_BUDGET_LINE_ITEM",
            payload: { ...BUDGET_LINE, ...updatedBudgetLine }
        });
        expect(mockSetAlert).toHaveBeenCalledWith(expect.objectContaining({ type: "success" }));
    });

    it("shows an error alert when the submission fails", async () => {
        mockSubmit.mockReturnValue({ unwrap: () => Promise.reject(new Error("failed")) });
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        renderModal();
        await userEvent.click(screen.getByRole("button", { name: "Yes, De-obligate Funding" }));

        await userEvent.type(screen.getByLabelText(/De-obligated Amount/i), "100000");
        await userEvent.click(screen.getByRole("button", { name: "Update Budget Line" }));

        await vi.waitFor(() => expect(mockSetAlert).toHaveBeenCalledWith(expect.objectContaining({ type: "error" })));
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("closes without submitting when the user clicks Cancel on the amount step", async () => {
        useSubmitDeObligationMutation.mockReturnValue([mockSubmit, { isLoading: false }]);
        useEditAgreementDispatch.mockReturnValue(mockDispatch);
        const onClose = vi.fn();
        renderModal({ onClose });
        await userEvent.click(screen.getByRole("button", { name: "Yes, De-obligate Funding" }));

        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(mockSubmit).not.toHaveBeenCalled();
    });
});
