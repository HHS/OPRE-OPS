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
        fireEvent.click(getByText("2043"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("2044"));
        expect(setSelectedFiscalYears).toHaveBeenLastCalledWith([{ id: 2044, title: 2044 }]);
    });

    it("renders with custom label when label prop is provided", () => {
        render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
                label="Compare Fiscal Years"
            />
        );
        expect(screen.getByText("Compare Fiscal Years")).toBeInTheDocument();
        expect(screen.queryByText("Fiscal Year")).not.toBeInTheDocument();
    });

    it("renders with 'All FYs' option when includeAllOption is true", () => {
        const { container } = render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
                includeAllOption={true}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("All FYs")).toBeInTheDocument();
        expect(screen.getByText("2043")).toBeInTheDocument();
        expect(screen.getByText("2044")).toBeInTheDocument();
    });

    it("does not render 'All FYs' option when includeAllOption is false", () => {
        const { container } = render(
            <FiscalYearComboBox
                selectedFiscalYears={null}
                setSelectedFiscalYears={mockSetSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
                includeAllOption={false}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.queryByText("All FYs")).not.toBeInTheDocument();
        expect(screen.getByText("2043")).toBeInTheDocument();
        expect(screen.getByText("2044")).toBeInTheDocument();
    });

    it("allows selection of 'All FYs' option", () => {
        const setSelectedFiscalYears = mockFn;
        const { getByText, container } = render(
            <FiscalYearComboBox
                selectedFiscalYears={[]}
                setSelectedFiscalYears={setSelectedFiscalYears}
                budgetLinesFiscalYears={[2043, 2044]}
                includeAllOption={true}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("All FYs"));
        expect(setSelectedFiscalYears).toHaveBeenCalledWith([{ id: "all", title: "All FYs" }]);
    });
});
