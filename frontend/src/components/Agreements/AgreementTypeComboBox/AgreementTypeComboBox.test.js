import { render, fireEvent, screen } from "@testing-library/react";
import AgreementTypeComboBox from "./AgreementTypeComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("AgreementTypeComboBox", () => {
    const mockSetSelectedAgreementTypes = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <AgreementTypeComboBox
                selectedAgreementTypes={null}
                setSelectedAgreementTypes={mockSetSelectedAgreementTypes}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Agreement Type")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <AgreementTypeComboBox
                selectedAgreementTypes={null}
                setSelectedAgreementTypes={mockSetSelectedAgreementTypes}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("Contract")).toBeInTheDocument();
        expect(screen.getByText("Grant")).toBeInTheDocument();
        expect(screen.getByText("Direct Obligation")).toBeInTheDocument();
        expect(screen.getByText("Partner - IAA")).toBeInTheDocument();
        expect(screen.getByText("Partner - AA")).toBeInTheDocument();
        expect(screen.getByText("Misc")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <AgreementTypeComboBox
                selectedAgreementTypes={null}
                setSelectedAgreementTypes={mockSetSelectedAgreementTypes}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Contract" } });
        expect(input).toHaveValue("Contract");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedAgreementTypes = mockFn;
        const { getByText, container } = render(
            <AgreementTypeComboBox
                selectedAgreementTypes={null}
                setSelectedAgreementTypes={setSelectedAgreementTypes}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Contract"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Grant"));
        expect(setSelectedAgreementTypes).toHaveBeenCalledWith([
            {
                id: 1,
                title: "Contract",
                type: "CONTRACT"
            },
            {
                id: 2,
                title: "Grant",
                type: "GRANT"
            }
        ]);
    });
});
