import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AgreementsFilterButton from "./AgreementsFilterButton";

// The domain comboboxes fetch their own options; only the Division & Staffing field is under test here.
vi.mock("../../../../components/UI/Form/FiscalYearComboBox", () => ({ default: () => null }));
vi.mock("../../../../components/Portfolios/PortfoliosComboBox", () => ({ default: () => null }));
vi.mock("../../../../components/Projects/ProjectTitleComboBox", () => ({ default: () => null }));
vi.mock("../../../../components/Agreements/AgreementTypeComboBox", () => ({ default: () => null }));
vi.mock("../../../../components/Agreements/AgreementNameComboBox", () => ({ default: () => null }));
vi.mock("../../../../components/Agreements/ContractNumberComboBox", () => ({ default: () => null }));
vi.mock("../../../../components/Agreements/AwardTypeComboBox", () => ({ default: () => null }));

vi.mock("react-modal", () => {
    const Modal = ({ isOpen, children }) => (isOpen ? <div data-testid="modal">{children}</div> : null);
    Modal.setAppElement = vi.fn();
    return { default: Modal };
});

describe("AgreementsFilterButton - Division & Staffing", () => {
    const filterOptions = {
        cor_divisions: [
            { id: 1, name: "Division A", abbreviation: "DA" },
            { id: 2, name: "Division B", abbreviation: "DB" }
        ],
        cors: [{ id: 21, name: "Hank Smith", division_id: 1 }]
    };
    const emptyFilters = {
        fiscalYear: [],
        portfolio: [],
        projectTitle: [],
        agreementType: [],
        agreementName: [],
        contractNumber: [],
        awardType: [],
        division: [],
        cor: []
    };

    it("lets a keyboard user choose a division and a COR and apply them", async () => {
        const user = userEvent.setup();
        const setFilters = vi.fn();
        render(
            <AgreementsFilterButton
                filters={emptyFilters}
                setFilters={setFilters}
                agreementFilterOptions={filterOptions}
            />
        );

        await user.click(screen.getByRole("button", { name: /filter/i }));
        const input = screen.getByLabelText("Division & Staffing");
        await user.type(input, "Division B");
        await user.keyboard("{Enter}");
        await user.type(input, "Hank");
        await user.keyboard("{Enter}");
        await user.click(screen.getByRole("button", { name: "Apply" }));

        const applied = setFilters.mock.calls.at(-1)[0](emptyFilters);
        expect(applied.division).toEqual([filterOptions.cor_divisions[1]]);
        expect(applied.cor).toEqual([{ ...filterOptions.cors[0], division_abbreviation: "DA" }]);
    });
});
