import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AgreementAwardModifications from "./AgreementAwardModifications";
import { useGetAgreementAwardHistoryByIdQuery, useGetVersionQuery } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";

vi.mock("../../../api/opsAPI", () => ({
    useGetAgreementAwardHistoryByIdQuery: vi.fn(),
    useGetVersionQuery: vi.fn()
}));

vi.mock("../../../hooks/lookup.hooks", () => ({
    useGetNameForCanId: (id) => (id ? `CAN-${id}` : undefined)
}));

// The section has its own tests; here we only check when it is shown.
vi.mock("../../../components/Agreements/ContractModificationEdits", () => ({
    default: ({ agreementId }) => <div data-testid="contract-modification-edits">{agreementId}</div>
}));

// Render the real Accordion's heading + children without USWDS DOM plumbing.
vi.mock("../../../components/UI/Accordion/Accordion", () => ({
    default: ({ heading, children, dataCy }) => (
        <div data-cy={dataCy}>
            <div data-testid="accordion-heading">{heading}</div>
            {children}
        </div>
    )
}));

const CONTRACT_RECORD = {
    fiscal_year_label: "FY 2024 Award",
    award_date: "2024-06-26",
    award_amount: "1000000.00",
    contract_total: "5000000.00",
    contract_number: "CONTRACT-001",
    modification_number: "Base",
    requisition_approval_date: "2024-06-20",
    requisition_number: "REQ-000444",
    vendor_name: "Flexion Inc.",
    vendor_unique_entity_id: "123456789",
    vendor_type: "SMALL_BUSINESS",
    purchase_order_number: "PO-001",
    task_order_number: "TO-001"
};

const MOD_RECORD = {
    ...CONTRACT_RECORD,
    fiscal_year_label: "FY 2025 Contract Modification (01/15/2025)",
    modification_number: "Mod 1"
};

describe("AgreementAwardModifications", () => {
    const agreement = { id: 42 };

    beforeEach(() => {
        useGetAgreementAwardHistoryByIdQuery.mockReset();
        useGetVersionQuery.mockReturnValue({ data: { enable_modified_loe_edits: false } });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders one accordion per record with formatted fields", () => {
        useGetAgreementAwardHistoryByIdQuery.mockReturnValue({
            data: [CONTRACT_RECORD, MOD_RECORD],
            isLoading: false,
            isError: false
        });

        render(<AgreementAwardModifications agreement={agreement} />);

        const headings = screen.getAllByTestId("accordion-heading");
        expect(headings).toHaveLength(2);
        expect(headings[0]).toHaveTextContent("FY 2024 Award");
        expect(headings[1]).toHaveTextContent("FY 2025 Contract Modification (01/15/2025)");

        // Field values render (formatted) — first accordion.
        expect(screen.getAllByText("June 26, 2024").length).toBeGreaterThan(0);
        expect(screen.getAllByText("$1,000,000.00").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Flexion Inc.").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Small Business").length).toBeGreaterThan(0);
        expect(screen.getByText("Base")).toBeInTheDocument();
        expect(screen.getByText("Mod 1")).toBeInTheDocument();
    });

    it("lists a contract mod's edits as label/value pills inside its accordion (OPS-6513)", () => {
        const modWithEdits = {
            ...MOD_RECORD,
            edits: [
                {
                    id: 1,
                    modification_type: "MODIFIED_LOE",
                    budget_line_item_id: 16076,
                    field: "amount",
                    old_value: 100000,
                    new_value: 125000
                },
                {
                    id: 2,
                    modification_type: "ADMIN_CHANGE",
                    budget_line_item_id: null,
                    field: "project_officer_id",
                    old_value: 520,
                    new_value: 522,
                    old_display_name: "Chris Fortunato",
                    new_display_name: "Dave Director"
                },
                {
                    id: 3,
                    modification_type: "MODIFIED_LOE",
                    budget_line_item_id: 16077,
                    field: "can_id",
                    old_value: 504,
                    new_value: 505
                }
            ]
        };
        useGetAgreementAwardHistoryByIdQuery.mockReturnValue({
            data: [{ ...CONTRACT_RECORD, edits: [] }, modWithEdits],
            isLoading: false,
            isError: false
        });

        render(<AgreementAwardModifications agreement={agreement} />);

        // Only the mod's accordion lists edits.
        expect(screen.getAllByTestId("award-mod-edits")).toHaveLength(1);
        const edits = screen.getAllByTestId("award-mod-edit");
        expect(edits).toHaveLength(3);
        const pills = (edit) => {
            const terms = within(edit).getAllByRole("term");
            const definitions = within(edit).getAllByRole("definition");
            return terms.map((term, index) => [term.textContent, definitions[index].textContent]);
        };
        expect(pills(edits[0])).toEqual([
            ["Modification Type", "Modified Level of Effort"],
            ["BL ID", "16076"],
            ["Change To", "Amount"],
            ["From", "$100,000.00"],
            ["To", "$125,000.00"]
        ]);
        expect(pills(edits[1])).toEqual(
            expect.arrayContaining([
                ["From", "Chris Fortunato"],
                ["To", "Dave Director"]
            ])
        );
        expect(pills(edits[2])).toEqual(
            expect.arrayContaining([
                ["From", "CAN-504"],
                ["To", "CAN-505"]
            ])
        );
        expect(screen.getByText("Contract Modification Edits")).toBeInTheDocument();
    });

    it("renders NO_DATA for missing fields", () => {
        const sparse = {
            fiscal_year_label: "Award",
            award_date: null,
            award_amount: null,
            contract_total: null,
            contract_number: null,
            modification_number: "Base",
            requisition_approval_date: null,
            requisition_number: null,
            vendor_name: null,
            vendor_unique_entity_id: null,
            vendor_type: null,
            purchase_order_number: null,
            task_order_number: null
        };
        useGetAgreementAwardHistoryByIdQuery.mockReturnValue({
            data: [sparse],
            isLoading: false,
            isError: false
        });

        render(<AgreementAwardModifications agreement={agreement} />);
        // 11 of 12 fields are null (modification_number is "Base").
        expect(screen.getAllByText(NO_DATA)).toHaveLength(11);
    });

    it("renders an empty state when there are no records", () => {
        useGetAgreementAwardHistoryByIdQuery.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
        });

        render(<AgreementAwardModifications agreement={agreement} />);
        expect(screen.getByText(/no award or modification history/i)).toBeInTheDocument();
        expect(screen.queryByTestId("accordion-heading")).not.toBeInTheDocument();
    });

    it("renders a loading state", () => {
        useGetAgreementAwardHistoryByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false
        });

        render(<AgreementAwardModifications agreement={agreement} />);
        expect(screen.getByText(/loading award/i)).toBeInTheDocument();
    });

    it("renders an error state", () => {
        useGetAgreementAwardHistoryByIdQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true
        });

        render(<AgreementAwardModifications agreement={agreement} />);
        expect(screen.getByText(/error loading award/i)).toBeInTheDocument();
    });

    describe("Contract Modifications section", () => {
        beforeEach(() => {
            useGetAgreementAwardHistoryByIdQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        });

        it("renders above the history for an awarded agreement when enabled", () => {
            useGetVersionQuery.mockReturnValue({ data: { enable_modified_loe_edits: true } });

            render(<AgreementAwardModifications agreement={{ id: 42, is_awarded: true }} />);

            const section = screen.getByTestId("contract-modification-edits");
            expect(section).toHaveTextContent("42");
            const historyHeading = screen.getByRole("heading", { name: /award & modification history/i });
            expect(section.compareDocumentPosition(historyHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        });

        it("is hidden when the agreement is not awarded", () => {
            useGetVersionQuery.mockReturnValue({ data: { enable_modified_loe_edits: true } });

            render(<AgreementAwardModifications agreement={{ id: 42, is_awarded: false }} />);

            expect(screen.queryByTestId("contract-modification-edits")).not.toBeInTheDocument();
        });

        it("is hidden when modified LOE edits are disabled", () => {
            render(<AgreementAwardModifications agreement={{ id: 42, is_awarded: true }} />);

            expect(screen.queryByTestId("contract-modification-edits")).not.toBeInTheDocument();
        });
    });
});
