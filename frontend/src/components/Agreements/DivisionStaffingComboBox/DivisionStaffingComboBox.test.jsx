import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DivisionStaffingComboBox from "./DivisionStaffingComboBox";
import { buildDivisionStaffingOptions, splitSelectedOptions } from "./DivisionStaffingComboBox.helpers";

const corDivisions = [
    { id: 2, name: "Office of the Director", abbreviation: "OD" },
    { id: 1, name: "Division of Child and Family Development", abbreviation: "DCFD" }
];
const cors = [
    { id: 22, name: "Joan Wilder", division_id: 1 },
    { id: 21, name: "Hank Smith", division_id: 1 },
    { id: 23, name: "Gary Gareson", division_id: 2 },
    { id: 24, name: "Ann Nodivision", division_id: null }
];

/** Holds the selections like a filter modal's buffers, and reports every change. */
const StatefulComboBox = ({ onDivisions = vi.fn(), onCors = vi.fn(), initialDivisions = [], initialCors = [] }) => {
    const [divisions, setDivisions] = useState(initialDivisions);
    const [selectedCors, setSelectedCors] = useState(initialCors);
    return (
        <DivisionStaffingComboBox
            corDivisions={corDivisions}
            cors={cors}
            selectedDivisions={divisions}
            setSelectedDivisions={(value) => {
                onDivisions(value);
                setDivisions(value);
            }}
            selectedCors={selectedCors}
            setSelectedCors={(value) => {
                onCors(value);
                setSelectedCors(value);
            }}
        />
    );
};

describe("buildDivisionStaffingOptions", () => {
    it("lists each division followed by its CORs, then CORs with no division ungrouped", () => {
        expect(buildDivisionStaffingOptions(corDivisions, cors).map((option) => option.title)).toEqual([
            "DCFD - Division of Child and Family Development",
            "DCFD - Hank Smith",
            "DCFD - Joan Wilder",
            "OD - Office of the Director",
            "OD - Gary Gareson",
            "Ann Nodivision"
        ]);
    });

    it("gives divisions and CORs distinct ids even when the raw ids match", () => {
        const options = buildDivisionStaffingOptions(
            [{ id: 5, name: "Div", abbreviation: "D" }],
            [{ id: 5, name: "Person", division_id: 5 }]
        );

        expect(options.map((option) => option.id)).toEqual(["division-5", "cor-5"]);
    });

    it("handles missing options", () => {
        expect(buildDivisionStaffingOptions(undefined, undefined)).toEqual([]);
    });

    it("groups each division with its CORs, and leaves CORs with no division ungrouped", () => {
        expect(buildDivisionStaffingOptions(corDivisions, cors).map((option) => option.group)).toEqual([
            "division-1",
            "division-1",
            "division-1",
            "division-2",
            "division-2",
            undefined
        ]);
    });
});

describe("splitSelectedOptions", () => {
    it("treats a cleared box (null) as no divisions and no CORs", () => {
        expect(splitSelectedOptions(null)).toEqual({ divisions: [], cors: [] });
    });
});

describe("DivisionStaffingComboBox", () => {
    it("is labelled Division & Staffing", () => {
        render(<StatefulComboBox />);

        expect(screen.getByLabelText("Division & Staffing")).toBeInTheDocument();
    });

    it("shows the options in grouped order", async () => {
        const user = userEvent.setup();
        render(<StatefulComboBox />);

        await user.click(screen.getByLabelText("Division & Staffing"));

        expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
            "DCFD - Division of Child and Family Development",
            "DCFD - Hank Smith",
            "DCFD - Joan Wilder",
            "OD - Office of the Director",
            "OD - Gary Gareson",
            "Ann Nodivision"
        ]);
    });

    it("indents a division's CORs, but not divisions or CORs with no division", async () => {
        const user = userEvent.setup();
        render(<StatefulComboBox />);

        await user.click(screen.getByLabelText("Division & Staffing"));

        const indented = screen
            .getAllByRole("option")
            .filter((option) => option.style.paddingLeft === "1.75rem")
            .map((option) => option.textContent);
        expect(indented).toEqual(["DCFD - Hank Smith", "DCFD - Joan Wilder", "OD - Gary Gareson"]);
    });

    it("keeps a COR indented while its division's group is highlighted", async () => {
        const user = userEvent.setup();
        render(<StatefulComboBox />);

        await user.click(screen.getByLabelText("Division & Staffing"));

        const hank = screen.getByRole("option", { name: "DCFD - Hank Smith" });
        expect(hank).toHaveStyle({ backgroundColor: "#DEEBFF" });
        expect(hank.style.paddingLeft).toBe("1.75rem");
    });

    it("matches typed text against option labels, not internal ids", async () => {
        const user = userEvent.setup();
        render(<StatefulComboBox />);

        const input = screen.getByLabelText("Division & Staffing");
        await user.type(input, "cor");
        expect(screen.queryAllByRole("option")).toHaveLength(0);

        await user.clear(input);
        await user.type(input, "Gary");
        expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["OD - Gary Gareson"]);
    });

    describe("group highlight", () => {
        const GROUP_CLASS = "division-staffing-combobox__option--in-focused-group";
        const highlighted = () =>
            screen
                .getAllByRole("option")
                .filter((option) => option.classList.contains(GROUP_CLASS))
                .map((option) => option.textContent);

        it("highlights a focused division's CORs, and nothing when a COR has focus", async () => {
            const user = userEvent.setup();
            render(<StatefulComboBox />);

            // Opening the menu focuses the first option, the DCFD division.
            await user.click(screen.getByLabelText("Division & Staffing"));
            expect(highlighted()).toEqual(["DCFD - Hank Smith", "DCFD - Joan Wilder"]);
            expect(screen.getByRole("option", { name: "DCFD - Hank Smith" })).toHaveStyle({
                backgroundColor: "#DEEBFF"
            });

            await user.keyboard("{ArrowDown}");
            expect(highlighted()).toEqual([]);

            await user.keyboard("{ArrowDown}{ArrowDown}");
            expect(highlighted()).toEqual(["OD - Gary Gareson"]);
        });

        it("highlights a division's CORs on hover", async () => {
            const user = userEvent.setup();
            render(<StatefulComboBox />);

            await user.click(screen.getByLabelText("Division & Staffing"));
            await user.hover(screen.getByRole("option", { name: "OD - Office of the Director" }));

            expect(highlighted()).toEqual(["OD - Gary Gareson"]);
        });

        it("never highlights a COR with no division", async () => {
            const user = userEvent.setup();
            render(<StatefulComboBox />);

            await user.click(screen.getByLabelText("Division & Staffing"));
            await user.hover(screen.getByRole("option", { name: "Ann Nodivision" }));

            expect(highlighted()).toEqual([]);
        });
    });

    it("lets a keyboard user pick a division and a COR from another division", async () => {
        const user = userEvent.setup();
        const onDivisions = vi.fn();
        const onCors = vi.fn();
        render(
            <StatefulComboBox
                onDivisions={onDivisions}
                onCors={onCors}
            />
        );

        const input = screen.getByLabelText("Division & Staffing");
        await user.type(input, "Office of the Director");
        await user.keyboard("{Enter}");
        await user.type(input, "Hank");
        await user.keyboard("{Enter}");

        expect(onDivisions).toHaveBeenLastCalledWith([corDivisions[0]]);
        expect(onCors).toHaveBeenLastCalledWith([{ ...cors[1], division_abbreviation: "DCFD" }]);
        expect(screen.getByText("OD - Office of the Director")).toBeInTheDocument();
        expect(screen.getByText("DCFD - Hank Smith")).toBeInTheDocument();
    });

    it("can pick a COR with no division", async () => {
        const user = userEvent.setup();
        const onCors = vi.fn();
        render(<StatefulComboBox onCors={onCors} />);

        await user.type(screen.getByLabelText("Division & Staffing"), "Ann");
        await user.keyboard("{Enter}");

        expect(onCors).toHaveBeenLastCalledWith([{ ...cors[3], division_abbreviation: null }]);
    });

    it("shows the current selection and clears divisions and CORs together", async () => {
        const user = userEvent.setup();
        const onDivisions = vi.fn();
        const onCors = vi.fn();
        render(
            <StatefulComboBox
                onDivisions={onDivisions}
                onCors={onCors}
                initialDivisions={[corDivisions[1]]}
                initialCors={[{ ...cors[2], division_abbreviation: "OD" }]}
            />
        );

        expect(screen.getByText("DCFD - Division of Child and Family Development")).toBeInTheDocument();
        expect(screen.getByText("OD - Gary Gareson")).toBeInTheDocument();

        // Backspace removes the last chip; a second one removes the other.
        await user.click(screen.getByLabelText("Division & Staffing"));
        await user.keyboard("{Backspace}{Backspace}");

        expect(onDivisions).toHaveBeenLastCalledWith([]);
        expect(onCors).toHaveBeenLastCalledWith([]);
    });
});
