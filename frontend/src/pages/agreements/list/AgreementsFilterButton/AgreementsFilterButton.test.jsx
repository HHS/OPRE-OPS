import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AgreementsFilterButton from "./AgreementsFilterButton";

// The domain comboboxes fetch their own options; only the COR's division field is under test here.
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

describe("AgreementsFilterButton - COR's division", () => {
    const corDivisions = [
        { id: 1, name: "Division A", abbreviation: "DA" },
        { id: 2, name: "Division B", abbreviation: "DB" }
    ];
    const emptyFilters = {
        fiscalYear: [],
        portfolio: [],
        projectTitle: [],
        agreementType: [],
        agreementName: [],
        contractNumber: [],
        awardType: [],
        division: []
    };

    it("lets a keyboard user choose a COR's division from the filter options and apply it", async () => {
        const user = userEvent.setup();
        const setFilters = vi.fn();
        render(
            <AgreementsFilterButton
                filters={emptyFilters}
                setFilters={setFilters}
                agreementFilterOptions={{ cor_divisions: corDivisions }}
            />
        );

        await user.click(screen.getByRole("button", { name: /filter/i }));
        const input = screen.getByLabelText("COR's Division");
        await user.type(input, "Division B");
        await user.keyboard("{Enter}");
        await user.click(screen.getByRole("button", { name: "Apply" }));

        const updater = setFilters.mock.calls.at(-1)[0];
        expect(updater(emptyFilters).division).toEqual([corDivisions[1]]);
    });
});
