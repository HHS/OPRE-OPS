import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeObligationAmountModal from "./DeObligationAmountModal";

const BUDGET_LINE = { id: 701, amount: 500000, requested_de_obligation_amount: null };

const renderModal = (props = {}) => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
        <DeObligationAmountModal
            budgetLine={BUDGET_LINE}
            onConfirm={onConfirm}
            onClose={onClose}
            {...props}
        />
    );
    return { onConfirm, onClose };
};

describe("DeObligationAmountModal", () => {
    it("shows the original obligated amount and asks how much to de-obligate", () => {
        renderModal();

        expect(screen.getByRole("dialog", { name: "How much do you need to de-obligate?" })).toBeInTheDocument();
        expect(screen.getByText("The original budget line amount is $500,000.00")).toBeInTheDocument();
        expect(screen.getByLabelText("Amount to De-Obligate")).toHaveFocus();
        expect(screen.getByRole("button", { name: "De-obligate Funding" })).toBeDisabled();
    });

    it("confirms a valid amount", async () => {
        const { onConfirm } = renderModal();
        const user = userEvent.setup();

        await user.type(screen.getByLabelText("Amount to De-Obligate"), "100000");
        await user.click(screen.getByRole("button", { name: "De-obligate Funding" }));

        expect(onConfirm).toHaveBeenCalledWith(100000);
    });

    it("blocks an amount above the obligated amount", async () => {
        const { onConfirm } = renderModal();
        const user = userEvent.setup();

        await user.type(screen.getByLabelText("Amount to De-Obligate"), "600000");

        expect(
            screen.getByText("The de-obligated amount can't be more than the budget line's obligated amount")
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "De-obligate Funding" })).toBeDisabled();
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("prefills a pending de-obligation", () => {
        renderModal({ budgetLine: { ...BUDGET_LINE, requested_de_obligation_amount: 250000 } });

        expect(screen.getByLabelText("Amount to De-Obligate")).toHaveValue("$250,000");
        expect(screen.getByRole("button", { name: "De-obligate Funding" })).toBeEnabled();
    });

    it.each([
        ["Cancel", (user) => user.click(screen.getByRole("button", { name: "Cancel" }))],
        ["the close button", (user) => user.click(screen.getByRole("button", { name: "Close this window" }))],
        ["Escape", (user) => user.keyboard("{Escape}")]
    ])("closes without confirming via %s", async (_label, act) => {
        const { onConfirm, onClose } = renderModal();

        await act(userEvent.setup());

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
