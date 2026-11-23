import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import constants from "../../../../constants";
import PortfolioFiscalYearSelect from "./PortfolioFiscalYearSelect";

const [firstYear, secondYear] = constants.fiscalYears.map(String);

describe("PortfolioFiscalYearSelect", () => {
    it("shows the given fiscal year as selected", () => {
        render(
            <PortfolioFiscalYearSelect
                fiscalYear={firstYear}
                setSelectedFiscalYear={vi.fn()}
            />
        );

        expect(screen.getByRole("combobox", { name: "Fiscal Year" })).toHaveValue(firstYear);
    });

    it("reports the year the user picks", async () => {
        const user = userEvent.setup();
        const setSelectedFiscalYear = vi.fn();
        render(
            <PortfolioFiscalYearSelect
                fiscalYear={firstYear}
                setSelectedFiscalYear={setSelectedFiscalYear}
            />
        );

        await user.selectOptions(screen.getByRole("combobox", { name: "Fiscal Year" }), secondYear);

        expect(setSelectedFiscalYear).toHaveBeenCalledWith(secondYear);
    });

    it("updates the selection when the fiscal year prop changes", () => {
        const { rerender } = render(
            <PortfolioFiscalYearSelect
                fiscalYear={firstYear}
                setSelectedFiscalYear={vi.fn()}
            />
        );

        rerender(
            <PortfolioFiscalYearSelect
                fiscalYear={secondYear}
                setSelectedFiscalYear={vi.fn()}
            />
        );

        expect(screen.getByRole("combobox", { name: "Fiscal Year" })).toHaveValue(secondYear);
    });
});
