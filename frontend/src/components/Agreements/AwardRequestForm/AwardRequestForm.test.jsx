import { render, screen } from "@testing-library/react";
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
        <div data-testid={`accordion-${heading?.replace(/\s+/g, "-").toLowerCase()}`}>
            {children}
        </div>
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
            expect(screen.getByTestId("bli-accordion-instructions")).toHaveTextContent(
                "click Add CLIN to enter"
            );
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
            expect(screen.getByTestId("bli-accordion-instructions")).toHaveTextContent(
                "click Edit CLIN to edit"
            );
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
            expect(
                screen.getByText("This information is required to submit for approval")
            ).toBeInTheDocument();
        });

        it("does not show error when a BLI is being edited (selector is open)", () => {
            renderForm({ hasMissingCLINs: true, selectedBudgetLineId: 101 });
            expect(
                screen.queryByText("This information is required to submit for approval")
            ).not.toBeInTheDocument();
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
