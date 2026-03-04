import { render, fireEvent, screen } from "@testing-library/react";
import AwardTypeComboBox from "./AwardTypeComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("AwardTypeComboBox", () => {
    const mockSetSelectedAwardTypes = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={mockSetSelectedAwardTypes}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Award Type")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={mockSetSelectedAwardTypes}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("New Award")).toBeInTheDocument();
        expect(screen.getByText("Continuing Agreement")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={mockSetSelectedAwardTypes}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "New" } });
        expect(input).toHaveValue("New");
    });

    it("calls setSelectedAwardTypes when an option is selected", () => {
        const setSelectedAwardTypes = mockFn;
        const { getByText, container } = render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={setSelectedAwardTypes}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("New Award"));
        expect(setSelectedAwardTypes).toHaveBeenCalledWith([{ id: 1, title: "New Award", awardType: "NEW" }]);

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Continuing Agreement"));
        expect(setSelectedAwardTypes).toHaveBeenCalledWith([
            { id: 2, title: "Continuing Agreement", awardType: "CONTINUING" }
        ]);
    });

    it("renders with custom legend class name", () => {
        render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={mockSetSelectedAwardTypes}
                legendClassname="custom-legend-class"
            />
        );

        const label = screen.getByText("Award Type");
        expect(label).toHaveClass("custom-legend-class");
    });

    it("renders with custom default string", () => {
        render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={mockSetSelectedAwardTypes}
                defaultString="Select Award Type"
            />
        );

        expect(screen.getByText("Select Award Type")).toBeInTheDocument();
    });

    it("renders with custom override styles", () => {
        const customStyles = { minWidth: "30rem" };
        const { container } = render(
            <AwardTypeComboBox
                selectedAwardTypes={[]}
                setSelectedAwardTypes={mockSetSelectedAwardTypes}
                overrideStyles={customStyles}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        const selectContainer = container.querySelector(".award-type-combobox__control");
        expect(selectContainer).toHaveStyle({ minWidth: "30rem" });
    });
});
