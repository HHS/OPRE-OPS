import { render, fireEvent, screen } from "@testing-library/react";
import FiscalYearComboBox from "./FiscalYearComboBox";
import TestApplicationContext from "../../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("FiscalYearComboBox", () => {
    const mockSetSelectedFiscalYears = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(
            screen.getByText((content, element) => {
                return element?.tagName?.toLowerCase() === "label" && content.includes("Fiscal Year");
            })
        ).toBeInTheDocument();
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

        expect(screen.getByText("FY 2043")).toBeInTheDocument();
        expect(screen.getByText("FY 2044")).toBeInTheDocument();
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
        const setSelectedFiscalYears = mockFn;
        const { getByText, container } = render(
            <FiscalYearComboBox
                selectedFiscalYears={[]}
                setSelectedFiscalYears={setSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("FY 2043"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("FY 2044"));
        expect(setSelectedFiscalYears).toHaveBeenLastCalledWith([{ id: 2044, title: "FY 2044" }]);
    });
});
