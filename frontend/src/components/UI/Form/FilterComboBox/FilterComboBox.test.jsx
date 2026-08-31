import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import FilterComboBox from "./FilterComboBox";

const procShopOptions = [
    { id: 1, abbr: "GCS" },
    { id: 2, abbr: "PSC" }
];

const divisionOptions = [
    { id: 1, name: "Division A" },
    { id: 2, name: "Division B" }
];

describe("FilterComboBox", () => {
    it("renders a labelled input associated with the combobox for accessibility", () => {
        render(
            <FilterComboBox
                label="Procurement Shop"
                namespace="proc-shop-combobox"
                options={procShopOptions}
                selected={[]}
                setSelected={vi.fn()}
                optionText={(shop) => shop.abbr}
            />
        );

        const label = screen.getByText("Procurement Shop");
        expect(label).toHaveAttribute("for", "proc-shop-combobox-input");
        // The label's htmlFor points at the react-select input, so it is queryable by label text.
        expect(screen.getByLabelText("Procurement Shop")).toHaveAttribute("id", "proc-shop-combobox-input");
    });

    it("shows options using the provided optionText accessor and selects them", async () => {
        const user = userEvent.setup();
        const setSelected = vi.fn();
        render(
            <FilterComboBox
                label="Procurement Shop"
                namespace="proc-shop-combobox"
                options={procShopOptions}
                selected={[]}
                setSelected={setSelected}
                optionText={(shop) => shop.abbr}
            />
        );

        await user.click(screen.getByLabelText("Procurement Shop"));
        expect(screen.getByText("GCS")).toBeInTheDocument();
        expect(screen.getByText("PSC")).toBeInTheDocument();

        await user.click(screen.getByText("GCS"));
        expect(setSelected).toHaveBeenCalledWith([procShopOptions[0]]);
    });

    it("is reusable for a different field via label, namespace and accessor", async () => {
        const user = userEvent.setup();
        const setSelected = vi.fn();
        render(
            <FilterComboBox
                label="Division"
                namespace="division-combobox"
                options={divisionOptions}
                selected={[]}
                setSelected={setSelected}
                optionText={(division) => division.name}
            />
        );

        const label = screen.getByText("Division");
        expect(label).toHaveAttribute("for", "division-combobox-input");

        await user.click(screen.getByLabelText("Division"));
        expect(screen.getByText("Division A")).toBeInTheDocument();

        await user.click(screen.getByText("Division A"));
        expect(setSelected).toHaveBeenCalledWith([divisionOptions[0]]);
    });
});
