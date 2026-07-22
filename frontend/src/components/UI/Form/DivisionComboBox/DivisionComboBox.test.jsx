import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import DivisionComboBox from "./DivisionComboBox";

const divisionOptions = [
    { id: 1, name: "Division A", abbreviation: "DA" },
    { id: 2, name: "Division B", abbreviation: "DB" }
];

describe("DivisionComboBox", () => {
    it("renders a labelled input associated with the combobox for accessibility", () => {
        render(
            <DivisionComboBox
                divisionOptions={divisionOptions}
                division={[]}
                setDivision={vi.fn()}
            />
        );

        const label = screen.getByText("Division");
        expect(label).toHaveAttribute("for", "division-combobox-input");
        // The label's htmlFor points at the react-select input, so it is queryable by label text.
        expect(screen.getByLabelText("Division")).toHaveAttribute("id", "division-combobox-input");
    });

    it("shows division names as options and selects by name", async () => {
        const user = userEvent.setup();
        const setDivision = vi.fn();
        render(
            <DivisionComboBox
                divisionOptions={divisionOptions}
                division={[]}
                setDivision={setDivision}
            />
        );

        await user.click(screen.getByLabelText("Division"));
        expect(screen.getByText("Division A")).toBeInTheDocument();
        expect(screen.getByText("Division B")).toBeInTheDocument();

        await user.click(screen.getByText("Division A"));
        expect(setDivision).toHaveBeenCalledWith([divisionOptions[0]]);
    });
});
