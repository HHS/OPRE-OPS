import { render, fireEvent, screen } from "@testing-library/react";
import FiscalYearComboBox from "./FiscalYearComboBox";

describe("FiscalYearComboBox", () => {
    const mockSetSelectedFiscalYears = jest.fn();

    it("renders the component with the correct label", () => {
        render(<FiscalYearComboBox selectedFiscalYears={null} setSelectedFiscalYears={mockSetSelectedFiscalYears} />);
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Fiscal Year")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <FiscalYearComboBox selectedFiscalYears={null} setSelectedFiscalYears={mockSetSelectedFiscalYears} />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("2020")).toBeInTheDocument();
        expect(screen.getByText("2021")).toBeInTheDocument();
        expect(screen.getByText("2022")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(<FiscalYearComboBox selectedFiscalYears={null} setSelectedFiscalYears={mockSetSelectedFiscalYears} />);
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "2020" } });
        expect(input).toHaveValue("2020");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedProject = jest.fn();
        const { getByText, container } = render(
            <FiscalYearComboBox selectedFiscalYears={null} setSelectedFiscalYears={setSelectedProject} />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("2020"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("2021"));
        expect(setSelectedProject).toHaveBeenCalledWith([
            { id: 2020, title: 2020 },
            { id: 2021, title: 2021 },
        ]);
    });
});
