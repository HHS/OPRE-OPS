import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CanSpending from "./CanSpending";

vi.mock("../../../components/UI/Cards/BudgetCard/BigBudgetCard", () => ({
    default: () => <div>Big budget card</div>
}));

vi.mock("../../../components/UI/Cards/DonutGraphWithLegendCard", () => ({
    default: () => <div>Donut chart</div>
}));

vi.mock("../../../components/UI/Cards/ProjectAgreementBLICard", () => ({
    default: () => <div>Counts card</div>
}));

vi.mock("../../../components/CANs/CANBudgetLineTable", () => ({
    default: () => <div>CAN budget line table</div>
}));

describe("CanSpending", () => {
    const defaultProps = {
        budgetLines: [],
        fiscalYear: 2026,
        projectTypesCount: [],
        budgetLineTypesCount: [],
        agreementTypesCount: [],
        plannedFunding: 40,
        inExecutionFunding: 20,
        inDraftFunding: 10,
        obligatedFunding: 30,
        totalFunding: 100
    };

    it("shows the spending table skeleton during refetches", () => {
        render(
            <CanSpending
                {...defaultProps}
                isTableLoading={true}
            />
        );

        expect(screen.getByText("CAN Spending Summary")).toBeInTheDocument();
        expect(screen.getByText("Big budget card")).toBeInTheDocument();
        expect(screen.getByRole("table", { name: "Loading CAN budget lines" })).toBeInTheDocument();
        expect(screen.queryByText("CAN budget line table")).not.toBeInTheDocument();
    });
});
