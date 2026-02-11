import { render, fireEvent, screen } from "@testing-library/react";
import ContractNumberComboBox from "./ContractNumberComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

const sampleAgreementFilterOptions = {
    contract_numbers: ["CN-001", "CN-002", "CN-003"]
};

describe("ContractNumberComboBox", () => {
    const mockSetSelectedContractNumbers = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Contract #")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("CN-001")).toBeInTheDocument();
        expect(screen.getByText("CN-002")).toBeInTheDocument();
        expect(screen.getByText("CN-003")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "CN-001" } });
        expect(input).toHaveValue("CN-001");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedContractNumbers = mockFn;
        const { getByText, container } = render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={setSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("CN-001"));
        expect(setSelectedContractNumbers).toHaveBeenCalledWith([{ id: "CN-001", title: "CN-001" }]);

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("CN-002"));
        expect(setSelectedContractNumbers).toHaveBeenCalledWith([{ id: "CN-002", title: "CN-002" }]);
    });

    it("handles empty contract_numbers list", () => {
        const emptyOptions = {
            contract_numbers: []
        };
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={emptyOptions}
            />
        );

        expect(screen.getByText("Contract #")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles undefined agreementFilterOptions", () => {
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={undefined}
            />
        );

        expect(screen.getByText("Contract #")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("handles null contract_numbers", () => {
        const nullOptions = {
            contract_numbers: null
        };
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={nullOptions}
            />
        );

        expect(screen.getByText("Contract #")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders with custom legend class name", () => {
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
                legendClassname="custom-legend-class"
            />
        );

        const label = screen.getByText("Contract #");
        expect(label).toHaveClass("custom-legend-class");
    });

    it("renders with custom default string", () => {
        render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
                defaultString="Select a Contract Number"
            />
        );

        expect(screen.getByText("Select a Contract Number")).toBeInTheDocument();
    });

    it("renders with custom override styles", () => {
        const customStyles = { minWidth: "30rem", backgroundColor: "red" };
        const { container } = render(
            <ContractNumberComboBox
                selectedContractNumbers={[]}
                setSelectedContractNumbers={mockSetSelectedContractNumbers}
                agreementFilterOptions={sampleAgreementFilterOptions}
                overrideStyles={customStyles}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        const selectContainer = container.querySelector(".contract-number-combobox__control");
        expect(selectContainer).toHaveStyle({ minWidth: "30rem" });
    });
});
