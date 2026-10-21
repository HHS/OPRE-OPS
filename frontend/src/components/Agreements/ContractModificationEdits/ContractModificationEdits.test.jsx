import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGetAgreementContractModificationEditsByIdQuery } from "../../../api/opsAPI";
import ContractModificationEdits from "./ContractModificationEdits";

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementContractModificationEditsByIdQuery: vi.fn()
}));

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: (id) => (id ? `CAN-${id}` : "unknown")
}));

const AMOUNT_EDIT = {
    id: 1,
    agreement_id: 42,
    modification_type: "MODIFIED_LOE",
    budget_line_item_id: 123458,
    field: "amount",
    old_value: 600000.0,
    new_value: 500000.0,
    requested_by: { id: 521, full_name: "First Last Name" },
    requested_on: "2024-12-01T14:03:00",
    change_request_id: 512,
    agreement_mod_id: null
};

const mockQuery = (result) =>
    useGetAgreementContractModificationEditsByIdQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
        ...result
    });

const getCards = () => screen.queryAllByRole("listitem");

// Card definitions, in order: Requested by, Modification Type, BL ID, Change To, From, To.
const cardValues = (card) =>
    within(card)
        .getAllByRole("definition")
        .map((dd) => dd.textContent);

describe("ContractModificationEdits", () => {
    beforeEach(() => {
        useGetAgreementContractModificationEditsByIdQuery.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the section heading, intro, and list label", () => {
        mockQuery({ data: [AMOUNT_EDIT] });

        render(<ContractModificationEdits agreementId={42} />);

        expect(screen.getByRole("heading", { name: "Contract Modifications" })).toBeInTheDocument();
        expect(screen.getByText(/displayed below as a reference/i)).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Edits That Require a Contract Modification" })).toBeInTheDocument();
        expect(useGetAgreementContractModificationEditsByIdQuery).toHaveBeenCalledWith(42, expect.anything());
    });

    it("does not render a Start modification button", () => {
        mockQuery({ data: [AMOUNT_EDIT] });

        render(<ContractModificationEdits agreementId={42} />);

        expect(screen.queryByRole("button", { name: /start modification/i })).not.toBeInTheDocument();
    });

    it("renders a card for an amount edit", () => {
        mockQuery({ data: [AMOUNT_EDIT] });

        render(<ContractModificationEdits agreementId={42} />);

        const [card] = getCards();
        expect(within(card).getByText("December 1, 2024")).toBeInTheDocument();
        expect(cardValues(card)).toEqual([
            "First Last Name",
            "Modified Level of Effort",
            "123458",
            "Amount",
            "$600,000.00",
            "$500,000.00"
        ]);
    });

    it("renders one card per edit, including CAN and delete edits", () => {
        mockQuery({
            data: [
                AMOUNT_EDIT,
                { ...AMOUNT_EDIT, id: 2, field: "can_id", old_value: 500, new_value: 501 },
                { ...AMOUNT_EDIT, id: 3, field: "delete", old_value: 600000.0, new_value: "Deleted" }
            ]
        });

        render(<ContractModificationEdits agreementId={42} />);

        const cards = getCards();
        expect(cards).toHaveLength(3);
        const [, canCard, deleteCard] = cards;
        expect(cardValues(canCard).slice(3)).toEqual(["CAN", "CAN-500", "CAN-501"]);
        expect(cardValues(deleteCard).slice(3)).toEqual(["Deleted", "$600,000.00", "Deleted"]);
    });

    it("renders nothing when there are no edits", () => {
        mockQuery({ data: [] });

        const { container } = render(<ContractModificationEdits agreementId={42} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing while loading", () => {
        mockQuery({ isLoading: true });

        const { container } = render(<ContractModificationEdits agreementId={42} />);

        expect(container).toBeEmptyDOMElement();
    });

    it("renders an error state", () => {
        mockQuery({ isError: true });

        render(<ContractModificationEdits agreementId={42} />);

        expect(screen.getByText(/error loading edits/i)).toBeInTheDocument();
    });
});
