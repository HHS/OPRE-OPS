import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BudgetLinesReviewAccordion } from "./PreAwardBudgetLinesReviewAccordion";

// Mock child components
vi.mock("../../../../components/Agreements/AgreementBLIAccordion", () => ({
    default: ({ title, instructions, children }) => (
        <div data-testid="agreement-bli-accordion">
            <h2>{title}</h2>
            <p>{instructions}</p>
            {children}
        </div>
    )
}));

vi.mock("../../../../components/BudgetLineItems/BLIReviewTable", () => ({
    default: ({ budgetLines, errorStatuses }) => (
        <div
            data-testid="bli-review-table"
            data-error-statuses={errorStatuses ? JSON.stringify(errorStatuses) : undefined}
        >
            {budgetLines.map((bli) => (
                <div key={bli.id}>{bli.id}</div>
            ))}
        </div>
    )
}));

vi.mock("../../../../components/ServicesComponents/ServicesComponentAccordion", () => ({
    default: ({ servicesComponentNumber, children }) => (
        <div data-testid="services-component-accordion">
            <h3>Service Component {servicesComponentNumber}</h3>
            {children}
        </div>
    )
}));

vi.mock("../../../../components/BudgetLineItems/ReviewExecutingTotalAccordion/ReviewExecutingTotalAccordion", () => ({
    default: ({ executingTotal }) => (
        <div data-testid="review-executing-total-accordion">Executing Total: ${executingTotal}</div>
    )
}));

vi.mock("../../../../helpers/servicesComponent.helpers", () => ({
    findDescription: vi.fn(),
    findIfOptional: vi.fn(),
    findPeriodEnd: vi.fn(),
    findPeriodStart: vi.fn()
}));

describe("BudgetLinesReviewAccordion", () => {
    const mockAgreement = {
        id: 1,
        name: "Test Agreement",
        service_requirement_type: "SEVERABLE"
    };

    const mockBudgetLineItems = [
        { id: 1, status: "IN_EXECUTION" },
        { id: 2, status: "IN_EXECUTION" }
    ];

    const mockServicesComponents = [
        { id: 1, number: "SC-1" },
        { id: 2, number: "SC-2" }
    ];

    const mockGroupedBudgetLines = [
        {
            servicesComponentNumber: "SC-1",
            serviceComponentGroupingLabel: null,
            budgetLines: [{ id: 1, status: "IN_EXECUTION" }]
        },
        {
            servicesComponentNumber: "SC-2",
            serviceComponentGroupingLabel: null,
            budgetLines: [{ id: 2, status: "IN_EXECUTION" }]
        }
    ];

    const defaultProps = {
        budgetLineItems: mockBudgetLineItems,
        agreement: mockAgreement,
        servicesComponents: mockServicesComponents,
        groupedBudgetLines: mockGroupedBudgetLines,
        executingTotal: 100000
    };

    it("renders the budget lines accordion with correct title", () => {
        render(<BudgetLinesReviewAccordion {...defaultProps} />);

        expect(screen.getByText("Review Budget Lines")).toBeInTheDocument();
    });

    it("displays standard instructions text", () => {
        render(<BudgetLinesReviewAccordion {...defaultProps} />);

        expect(
            screen.getByText(
                "Please review the Services Components and Budget Lines below to ensure everything is up to date."
            )
        ).toBeInTheDocument();
    });

    it("renders services component accordions for grouped budget lines", () => {
        render(<BudgetLinesReviewAccordion {...defaultProps} />);

        const serviceComponents = screen.getAllByTestId("services-component-accordion");
        expect(serviceComponents).toHaveLength(2);
    });

    it("renders BLI review tables for each service component", () => {
        render(<BudgetLinesReviewAccordion {...defaultProps} />);

        const reviewTables = screen.getAllByTestId("bli-review-table");
        expect(reviewTables).toHaveLength(2);
    });

    it("displays message when service component has no budget lines", () => {
        const propsWithEmptyGroup = {
            ...defaultProps,
            groupedBudgetLines: [
                {
                    servicesComponentNumber: "SC-1",
                    serviceComponentGroupingLabel: null,
                    budgetLines: []
                }
            ]
        };

        render(<BudgetLinesReviewAccordion {...propsWithEmptyGroup} />);

        expect(screen.getByText("No budget lines in this services component.")).toBeInTheDocument();
    });

    it("renders the executing total accordion", () => {
        render(<BudgetLinesReviewAccordion {...defaultProps} />);

        expect(screen.getByTestId("review-executing-total-accordion")).toBeInTheDocument();
        expect(screen.getByText(/Executing Total: \$100000/)).toBeInTheDocument();
    });

    it("handles empty grouped budget lines array", () => {
        const propsWithEmptyGroups = {
            ...defaultProps,
            groupedBudgetLines: []
        };

        render(<BudgetLinesReviewAccordion {...propsWithEmptyGroups} />);

        expect(screen.getByTestId("agreement-bli-accordion")).toBeInTheDocument();
        expect(screen.queryByTestId("services-component-accordion")).not.toBeInTheDocument();
    });

    it("passes errorStatuses to BLI tables when showBudgetLineErrors is true", () => {
        render(
            <BudgetLinesReviewAccordion
                {...defaultProps}
                showBudgetLineErrors={true}
            />
        );

        const tables = screen.getAllByTestId("bli-review-table");
        tables.forEach((table) => {
            expect(table).toHaveAttribute("data-error-statuses");
            const statuses = JSON.parse(table.getAttribute("data-error-statuses"));
            expect(statuses).toContain("PLANNED");
            expect(statuses).toContain("IN_EXECUTION");
        });
    });

    it("does not pass errorStatuses to BLI tables when showBudgetLineErrors is false (default)", () => {
        render(<BudgetLinesReviewAccordion {...defaultProps} />);

        const tables = screen.getAllByTestId("bli-review-table");
        tables.forEach((table) => {
            expect(table).not.toHaveAttribute("data-error-statuses");
        });
    });

    it("handles null grouped budget lines", () => {
        const propsWithNullGroups = {
            ...defaultProps,
            groupedBudgetLines: null
        };

        render(<BudgetLinesReviewAccordion {...propsWithNullGroups} />);

        expect(screen.getByTestId("agreement-bli-accordion")).toBeInTheDocument();
        expect(screen.queryByTestId("services-component-accordion")).not.toBeInTheDocument();
    });

    it("uses service component grouping label when available", () => {
        const propsWithLabel = {
            ...defaultProps,
            groupedBudgetLines: [
                {
                    servicesComponentNumber: "SC-1",
                    serviceComponentGroupingLabel: "Custom Label",
                    budgetLines: [{ id: 1, status: "IN_EXECUTION" }]
                }
            ]
        };

        render(<BudgetLinesReviewAccordion {...propsWithLabel} />);

        const serviceComponents = screen.getAllByTestId("services-component-accordion");
        expect(serviceComponents).toHaveLength(1);
    });
});
