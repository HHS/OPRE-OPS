import { render, fireEvent, screen } from "@testing-library/react";
import FiscalYearComboBox from "./FiscalYearComboBox";

describe("FiscalYearComboBox", () => {
    const mockSetSelectedFiscalYears = jest.fn();

    it("renders the component with the correct label", () => {
        render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Fiscal Year")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("2043")).toBeInTheDocument();
        expect(screen.getByText("2044")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: 2043 } });
        expect(input).toHaveValue("2043");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedFiscalYears = jest.fn();
        const { getByText, container } = render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={setSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("2043"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("2044"));
        expect(setSelectedFiscalYears).toHaveBeenCalledWith([
            { id: 2043, title: 2043 },
            { id: 2044, title: 2044 }
        ]);
    });
});
