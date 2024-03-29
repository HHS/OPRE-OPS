import { render, fireEvent, screen } from "@testing-library/react";
import BLIStatusComboBox from "./BLIStatusComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";

const mockFn = TestApplicationContext.helpers().mockFn;

describe("BLIStatusComboBox", () => {
    const mockSetSelectedBLIStatus = mockFn;

    it("renders the component with the correct label", () => {
        render(
            <BLIStatusComboBox
                selectedBLIStatus={null}
                setSelectedBLIStatus={mockSetSelectedBLIStatus}
            />
        );
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByText("Budget Lines Status")).toBeInTheDocument();
    });

    it("renders the component with the correct options", () => {
        const { container } = render(
            <BLIStatusComboBox
                selectedBLIStatus={null}
                setSelectedBLIStatus={mockSetSelectedBLIStatus}
            />
        );

        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Planned")).toBeInTheDocument();
        expect(screen.getByText("Executing")).toBeInTheDocument();
        expect(screen.getByText("Obligated")).toBeInTheDocument();
    });

    it("updates the input value when the user types in the input field", () => {
        render(
            <BLIStatusComboBox
                selectedBLIStatus={null}
                setSelectedBLIStatus={mockSetSelectedBLIStatus}
            />
        );
        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "Draft" } });
        expect(input).toHaveValue("Draft");
    });

    it("updates the selected item when multiple options are selected", () => {
        const setSelectedBLIStatus = mockFn;
        const { getByText, container } = render(
            <BLIStatusComboBox
                selectedBLIStatus={null}
                setSelectedBLIStatus={setSelectedBLIStatus}
            />
        );
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.focus(container.querySelector("input"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Draft"));
        // eslint-disable-next-line testing-library/no-container,testing-library/no-node-access
        fireEvent.keyDown(container.querySelector("input"), { key: "ArrowDown", code: 40 });

        // eslint-disable-next-line testing-library/prefer-screen-queries
        fireEvent.click(getByText("Planned"));
        expect(setSelectedBLIStatus).toHaveBeenCalledWith([
            {
                id: 1,
                title: "Draft",
                status: "DRAFT"
            },
            {
                id: 2,
                title: "Planned",
                status: "PLANNED"
            }
        ]);
    });
});
