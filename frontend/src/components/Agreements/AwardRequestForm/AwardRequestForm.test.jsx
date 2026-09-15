import { render, screen, fireEvent, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { setupStore } from "../../../store";
import AwardRequestForm from "./AwardRequestForm";

// Mock heavy sub-components that have their own data-fetching / complex rendering
vi.mock("../AgreementBLIAccordion", () => ({
    default: ({ title, instructions, children }) => (
        <div data-testid="bli-accordion">
            <span data-testid="bli-accordion-title">{title}</span>
            <span data-testid="bli-accordion-instructions">{instructions}</span>
            {children}
        </div>
    )
}));

vi.mock("../../ServicesComponents/ServicesComponentAccordion", () => ({
    default: ({ children }) => <div data-testid="sc-accordion">{children}</div>
}));

vi.mock("../../BudgetLineItems/BLIReviewTable", () => ({
    default: ({ clin, budgetLines }) => (
        <div
            data-testid="bli-review-table"
            data-clin-show-column={String(clin?.showColumn ?? false)}
            data-clin-has-add-click={String(typeof clin?.onAddClick === "function")}
            data-clin-has-assignments={String(clin?.assignments != null)}
        >
            {budgetLines?.map((bl) => (
                <span
                    key={bl.id}
                    data-testid={`bli-row-${bl.id}`}
                />
            ))}
        </div>
    )
}));

vi.mock("../../BudgetLineItems/CLINSelector", () => ({
    default: () => <div data-testid="clin-selector" />
}));

vi.mock("../SummaryBox", () => ({
    default: () => <div data-testid="summary-box" />
}));

vi.mock("../../UI/Button/FileUploadButton", () => ({
    default: () => <div data-testid="file-upload-button" />
}));

vi.mock("../../UI/Form/CurrencyInput", () => ({
    default: ({ label }) => <input aria-label={label} />
}));

vi.mock("../../UI/Accordion", () => ({
    default: ({ heading, children }) => (
        <div data-testid={`accordion-${heading?.replace(/\s+/g, "-").toLowerCase()}`}>{children}</div>
    )
}));

vi.mock("../../UI/Form/TextArea", () => ({
    default: ({ label }) => <textarea aria-label={label} />
}));

const mockValidationResult = {
    getErrors: vi.fn(() => []),
    hasErrors: vi.fn(() => false)
};

const mockMemoizedDatePicker = ({ label }) => <input aria-label={label} />;

const buildGroup = (scNumber, blis) => ({
    servicesComponentNumber: scNumber,
    serviceComponentGroupingLabel: null,
    budgetLines: blis
});

const buildBLI = (id, clinId = null) => ({
    id,
    status: "PLANNED",
    clin_id: clinId,
    amount: 100000,
    can_id: 504
});

const defaultProps = {
    agreement: { budget_line_items: [], service_requirement_type: "SEVERABLE" },
    vendors: [{ id: 1, name: "Flexion Inc.", duns: "123456789", vendor_type: "SMALL_BUSINESS" }],
    selectedVendor: null,
    onVendorChange: vi.fn(),
    contractNumber: "",
    onContractNumberChange: vi.fn(),
    awardAmount: "",
    onAwardAmountChange: vi.fn(),
    awardDate: "",
    onAwardDateChange: vi.fn(),
    agreementTitle: "",
    onAgreementTitleChange: vi.fn(),
    modificationNumber: "Base",
    onModificationNumberChange: vi.fn(),
    purchaseOrderNumber: "",
    onPurchaseOrderNumberChange: vi.fn(),
    taskOrderNumber: "",
    onTaskOrderNumberChange: vi.fn(),
    MemoizedDatePicker: mockMemoizedDatePicker,
    groupedBudgetLinesByServicesComponent: [],
    servicesComponentLookup: new Map(),
    selectedBudgetLineId: null,
    setSelectedBudgetLineId: vi.fn(),
    clinAssignments: {},
    handleAddCLIN: vi.fn(),
    hasMissingCLINs: false,
    clinSelectorRef: { current: null },
    notes: "",
    setNotes: vi.fn(),
    validationResult: mockValidationResult,
    runValidate: vi.fn()
};

const renderForm = (overrides = {}) => {
    const store = setupStore();
    return render(
        <Provider store={store}>
            <MemoryRouter>
                <AwardRequestForm
                    {...defaultProps}
                    {...overrides}
                />
            </MemoryRouter>
        </Provider>
    );
};

describe("AwardRequestForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockValidationResult.getErrors.mockReturnValue([]);
    });

    describe("CLIN column — clin prop shape (regression for flat-props bug)", () => {
        it("passes clin.showColumn=true to BLIReviewTable", () => {
            const group = buildGroup(1, [buildBLI(101)]);
            renderForm({ groupedBudgetLinesByServicesComponent: [group] });

            const table = screen.getByTestId("bli-review-table");
            expect(table).toHaveAttribute("data-clin-show-column", "true");
        });

        it("passes clin.onAddClick as a function to BLIReviewTable", () => {
            const group = buildGroup(1, [buildBLI(101)]);
            renderForm({ groupedBudgetLinesByServicesComponent: [group] });

            const table = screen.getByTestId("bli-review-table");
            expect(table).toHaveAttribute("data-clin-has-add-click", "true");
        });

        it("passes clin.assignments to BLIReviewTable", () => {
            const group = buildGroup(1, [buildBLI(101)]);
            const clinAssignments = { 101: 1 };
            renderForm({
                groupedBudgetLinesByServicesComponent: [group],
                clinAssignments
            });

            const table = screen.getByTestId("bli-review-table");
            expect(table).toHaveAttribute("data-clin-has-assignments", "true");
        });

        it("renders a BLIReviewTable for each services component group", () => {
            const groups = [buildGroup(1, [buildBLI(101)]), buildGroup(2, [buildBLI(201)])];
            renderForm({ groupedBudgetLinesByServicesComponent: groups });

            expect(screen.getAllByTestId("bli-review-table")).toHaveLength(2);
        });
    });

    describe("mode: request (default)", () => {
        it("uses Add CLIN instruction text", () => {
            renderForm();
            expect(screen.getByTestId("bli-accordion-instructions")).toHaveTextContent("click Add CLIN to enter");
        });

        it("shows Notes textarea", () => {
            renderForm();
            expect(screen.getByRole("textbox", { name: "Notes (Optional)" })).toBeInTheDocument();
        });

        it("uses Add vendor instruction text", () => {
            renderForm();
            expect(screen.getByText("Add the vendor information for this contract.")).toBeInTheDocument();
        });

        it("uses Add award instruction text", () => {
            renderForm();
            expect(screen.getByText("Add the award information for this contract.")).toBeInTheDocument();
        });
    });

    describe("mode: edit", () => {
        it("uses Edit CLIN instruction text", () => {
            renderForm({ mode: "edit" });
            expect(screen.getByTestId("bli-accordion-instructions")).toHaveTextContent("click Edit CLIN to edit");
        });

        it("hides Notes textarea", () => {
            renderForm({ mode: "edit" });
            expect(screen.queryByRole("textbox", { name: "Notes (Optional)" })).not.toBeInTheDocument();
        });

        it("uses Edit vendor instruction text", () => {
            renderForm({ mode: "edit" });
            expect(screen.getByText("Edit the vendor information for this contract.")).toBeInTheDocument();
        });

        it("uses Edit award instruction text", () => {
            renderForm({ mode: "edit" });
            expect(screen.getByText("Edit the award information for this contract.")).toBeInTheDocument();
        });
    });

    describe("CLIN selector", () => {
        it("shows CLINSelector when a BLI is selected", () => {
            renderForm({ selectedBudgetLineId: 101 });
            expect(screen.getByTestId("clin-selector")).toBeInTheDocument();
        });

        it("does not show CLINSelector when no BLI is selected", () => {
            renderForm({ selectedBudgetLineId: null });
            expect(screen.queryByTestId("clin-selector")).not.toBeInTheDocument();
        });
    });

    describe("missing CLINs error", () => {
        it("shows error message when CLINs are missing and no BLI is being edited", () => {
            renderForm({ hasMissingCLINs: true, selectedBudgetLineId: null });
            expect(screen.getByText("This information is required to submit for approval")).toBeInTheDocument();
        });

        it("does not show error when a BLI is being edited (selector is open)", () => {
            renderForm({ hasMissingCLINs: true, selectedBudgetLineId: 101 });
            expect(screen.queryByText("This information is required to submit for approval")).not.toBeInTheDocument();
        });
    });

    describe("Update Agreement Title accordion (OPS-5892)", () => {
        it("renders the accordion with the instructional copy and title input", () => {
            renderForm();
            expect(screen.getByTestId("accordion-update-agreement-title")).toBeInTheDocument();
            expect(
                screen.getByText(/Enter the Agreement Title to match the signed award exactly/i)
            ).toBeInTheDocument();
            expect(screen.getByLabelText("Agreement Title")).toBeInTheDocument();
        });

        it("renders the title accordion in edit mode too", () => {
            renderForm({ mode: "edit" });
            expect(screen.getByTestId("accordion-update-agreement-title")).toBeInTheDocument();
            expect(screen.getByLabelText("Agreement Title")).toBeInTheDocument();
        });

        it("calls onAgreementTitleChange and runValidate when the title changes", () => {
            const onAgreementTitleChange = vi.fn();
            const runValidate = vi.fn();
            renderForm({ onAgreementTitleChange, runValidate });
            fireEvent.change(screen.getByLabelText("Agreement Title"), { target: { value: "New Title" } });
            expect(onAgreementTitleChange).toHaveBeenCalledWith("New Title");
            expect(runValidate).toHaveBeenCalledWith("agreementTitle", "New Title");
        });

        it("caps the title input at 200 characters, matching the agreement editor's name field", () => {
            // This value is written straight into agreement.name on approval, so it carries the
            // same maxLength the agreement editor puts on that field.
            renderForm();
            expect(screen.getByLabelText("Agreement Title")).toHaveAttribute("maxlength", "200");
        });
    });

    describe("Current Award Information — new fields (OPS-5892)", () => {
        it("renders the Modification # select defaulting to Base with P00001..P00020 options", () => {
            renderForm();
            const select = screen.getByLabelText("Modification #");
            expect(select).toBeInTheDocument();
            // 1 Base + 20 P-numbered options
            expect(within(select).getAllByRole("option")).toHaveLength(21);
            expect(select).toHaveValue("Base");
            expect(screen.getByRole("option", { name: "P00001" })).toBeInTheDocument();
            expect(screen.getByRole("option", { name: "P00020" })).toBeInTheDocument();
        });

        it("renders Purchase Order # and Task Order # inputs", () => {
            renderForm();
            expect(screen.getByLabelText("Purchase Order #")).toBeInTheDocument();
            expect(screen.getByLabelText("Task Order #")).toBeInTheDocument();
        });

        it("calls onModificationNumberChange when a modification option is selected", () => {
            const onModificationNumberChange = vi.fn();
            renderForm({ onModificationNumberChange });
            fireEvent.change(screen.getByLabelText("Modification #"), { target: { value: "P00003" } });
            expect(onModificationNumberChange).toHaveBeenCalledWith("P00003");
        });

        it("renders a Modification # error with the same form-group pattern as the text fields", () => {
            // Error message before the control, inside an errored form group with errored label/control —
            // matching Contract # / Purchase Order # / Task Order # in this same form.
            mockValidationResult.getErrors.mockImplementation((field) =>
                field === "modificationNumber" ? ["This is required information"] : []
            );
            renderForm();

            const select = screen.getByLabelText("Modification #");
            const label = screen.getByText("Modification #");
            // eslint-disable-next-line testing-library/no-node-access
            const formGroup = select.closest(".usa-form-group");
            const errorMessage = screen.getByRole("alert");

            expect(formGroup).toHaveClass("usa-form-group--error");
            expect(label).toHaveClass("usa-label--error");
            expect(select).toHaveClass("usa-input--error");
            expect(errorMessage).toHaveTextContent("This is required information");
            // Error precedes the control in the DOM, as with every other field in this form.
            expect(errorMessage.compareDocumentPosition(select)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        });
    });

    describe("vendor section", () => {
        it("shows vendor select", () => {
            renderForm();
            expect(screen.getByRole("combobox", { name: /vendor/i })).toBeInTheDocument();
        });

        it("shows SummaryBox with UEI when vendor is selected", () => {
            renderForm({ selectedVendor: { id: 1, name: "Flexion Inc.", duns: "123", vendor_type: "SMALL_BUSINESS" } });
            expect(screen.getByTestId("summary-box")).toBeInTheDocument();
        });

        it("does not show SummaryBox when no vendor is selected", () => {
            renderForm({ selectedVendor: null });
            expect(screen.queryByTestId("summary-box")).not.toBeInTheDocument();
        });
    });
});
