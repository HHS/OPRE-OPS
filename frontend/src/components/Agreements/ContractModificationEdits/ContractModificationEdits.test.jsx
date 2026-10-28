import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    useGetAgreementContractModificationEditsByIdQuery,
    useGetAgreementContractModificationsByIdQuery,
    useGetNotificationsByUserIdAndAgreementIdQuery
} from "../../../api/opsAPI";
import ContractModificationEdits from "./ContractModificationEdits";

const mockNavigate = vi.fn();
const mockDismissNotification = vi.fn();

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementContractModificationEditsByIdQuery: vi.fn(),
    useGetAgreementContractModificationsByIdQuery: vi.fn(),
    useGetNotificationsByUserIdAndAgreementIdQuery: vi.fn(),
    useDismissNotificationMutation: () => [mockDismissNotification]
}));

vi.mock("react-redux", () => ({
    useSelector: (selector) => selector({ auth: { activeUser: { oidc_id: "oidc-521" } } })
}));

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate
}));

let mockCanEditByRole = true;
vi.mock("../../../hooks/user.hooks", () => ({
    useCanEditByRole: () => mockCanEditByRole
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

/** True for a DisabledButtonWithTooltip: a disabled button inside a focusable, aria-disabled wrapper. */
const isDisabledWithReachableTooltip = (name) => {
    const matches = screen.getAllByRole("button", { name });
    const button = matches.find((el) => el.tagName === "BUTTON");
    const wrapper = matches.find((el) => el.tagName === "DIV");
    return (
        Boolean(button?.disabled) &&
        wrapper?.getAttribute("tabindex") === "0" &&
        wrapper?.getAttribute("aria-disabled") === "true"
    );
};

// Card definitions, in order: Requested by, Modification Type, BL ID, Change To, From, To.
const cardValues = (card) =>
    within(card)
        .getAllByRole("definition")
        .map((dd) => dd.textContent);

const mockRequests = (requests, isSuccess = true) =>
    useGetAgreementContractModificationsByIdQuery.mockReturnValue({ data: requests, isSuccess });
const mockNotifications = (notifications) =>
    useGetNotificationsByUserIdAndAgreementIdQuery.mockReturnValue({ data: notifications });

const reviewOutcome = (id, status, reviewer_notes = null, requestId = 9) => ({
    id,
    notification_type: "CONTRACT_MODIFICATION_REQUEST_NOTIFICATION",
    title: `Contract Modification ${status === "APPROVED" ? "Approved" : "Declined"}`,
    message: "Outcome message",
    contract_modification_request: { id: requestId, agreement_id: 42, status, reviewer_notes }
});

describe("ContractModificationEdits", () => {
    beforeEach(() => {
        useGetAgreementContractModificationEditsByIdQuery.mockReset();
        mockRequests([]);
        mockNotifications([]);
        mockCanEditByRole = true;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the section heading, intro, and list label", () => {
        mockQuery({ data: [AMOUNT_EDIT] });

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.getByRole("heading", { name: "Contract Modifications" })).toBeInTheDocument();
        expect(screen.getByText(/displayed below as a reference/i)).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Edits That Require a Contract Modification" })).toBeInTheDocument();
        expect(useGetAgreementContractModificationEditsByIdQuery).toHaveBeenCalledWith(42, expect.anything());
    });

    it("starts a modification from the Start modification button", async () => {
        mockQuery({ data: [AMOUNT_EDIT] });

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );
        await userEvent.click(screen.getByRole("button", { name: "Start modification" }));

        expect(mockNavigate).toHaveBeenCalledWith("/agreements/42/start-modification");
    });

    it.each([
        ["isn't on the agreement's team", { isAgreementEditable: false }],
        ["has a read-only role", { isAgreementEditable: true, readOnly: true }]
    ])("disables Start modification when the user %s", (_label, { isAgreementEditable, readOnly }) => {
        mockQuery({ data: [AMOUNT_EDIT] });
        mockCanEditByRole = !readOnly;

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={isAgreementEditable}
            />
        );

        expect(isDisabledWithReachableTooltip("Start modification")).toBe(true);
    });

    it("disables Start modification and marks edits In Review while a modification is in review", () => {
        mockQuery({ data: [{ ...AMOUNT_EDIT, in_review: true }] });
        mockRequests([{ id: 9, status: "IN_REVIEW" }]);

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(isDisabledWithReachableTooltip("Start modification")).toBe(true);
        expect(screen.getByRole("heading", { name: "Contract Modification In Review" })).toBeInTheDocument();
        expect(within(getCards()[0]).getByText("In Review")).toBeInTheDocument();
    });

    it("shows the submitter a declined modification with the Director's notes, and dismisses it", async () => {
        mockQuery({ data: [AMOUNT_EDIT] });
        mockRequests([{ id: 9, status: "DECLINED" }]);
        mockNotifications([reviewOutcome(77, "DECLINED", "Let's talk Tuesday")]);

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.getByRole("heading", { name: "Contract Modification Declined" })).toBeInTheDocument();
        expect(screen.getByText("Let's talk Tuesday")).toBeInTheDocument();
        await userEvent.click(screen.getByLabelText("close"));
        expect(mockDismissNotification).toHaveBeenCalledWith(77);
    });

    it("shows the submitter an approved modification", () => {
        mockQuery({ data: [] });
        mockRequests([{ id: 9, status: "APPROVED" }]);
        mockNotifications([reviewOutcome(78, "APPROVED")]);

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.getByRole("heading", { name: "Contract Modification Approved" })).toBeInTheDocument();
    });

    it("shows only the latest modification's outcome and marks earlier outcomes read", () => {
        mockQuery({ data: [AMOUNT_EDIT] });
        // Newest first: request 11 was declined after request 9 was.
        mockRequests([
            { id: 11, status: "DECLINED" },
            { id: 9, status: "DECLINED" }
        ]);
        mockNotifications([
            reviewOutcome(80, "DECLINED", "Second try", 11),
            reviewOutcome(77, "DECLINED", "First try", 9)
        ]);

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.getAllByRole("heading", { name: "Contract Modification Declined" })).toHaveLength(1);
        expect(screen.getByText("Second try")).toBeInTheDocument();
        expect(mockDismissNotification).toHaveBeenCalledWith(77);
        expect(mockDismissNotification).not.toHaveBeenCalledWith(80);
    });

    it("hides earlier outcomes once a newer modification is in review", () => {
        mockQuery({ data: [{ ...AMOUNT_EDIT, in_review: true }] });
        mockRequests([
            { id: 11, status: "IN_REVIEW" },
            { id: 9, status: "DECLINED" }
        ]);
        mockNotifications([reviewOutcome(77, "DECLINED", "First try", 9)]);

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.queryByRole("heading", { name: "Contract Modification Declined" })).toBeNull();
        expect(mockDismissNotification).toHaveBeenCalledWith(77);
    });

    it("doesn't mark anything read before the modifications have loaded", () => {
        mockQuery({ data: [AMOUNT_EDIT] });
        mockRequests([], false);
        mockNotifications([reviewOutcome(77, "DECLINED", "First try", 9)]);

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(mockDismissNotification).not.toHaveBeenCalled();
    });

    it("renders a card for an amount edit", () => {
        mockQuery({ data: [AMOUNT_EDIT] });

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

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

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        const cards = getCards();
        expect(cards).toHaveLength(3);
        const [, canCard, deleteCard] = cards;
        expect(cardValues(canCard).slice(3)).toEqual(["CAN", "CAN-500", "CAN-501"]);
        expect(cardValues(deleteCard).slice(3)).toEqual(["Deleted", "$600,000.00", "Deleted"]);
    });

    it("still offers Start modification when there are no edits, to execute Planned budget lines as-is", () => {
        mockQuery({ data: [] });

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.queryByRole("heading", { name: "Edits That Require a Contract Modification" })).toBeNull();
        expect(screen.getByRole("button", { name: "Start modification" })).toBeEnabled();
    });

    it("renders nothing while loading", () => {
        mockQuery({ isLoading: true });

        const { container } = render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it("renders an error state", () => {
        mockQuery({ isError: true });

        render(
            <ContractModificationEdits
                agreementId={42}
                isAgreementEditable={true}
            />
        );

        expect(screen.getByText(/error loading edits/i)).toBeInTheDocument();
    });
});
