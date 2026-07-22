import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import ProcShopComboBox from "./ProcShopComboBox";

const procShopOptions = [
    { id: 1, abbr: "GCS" },
    { id: 2, abbr: "PSC" }
];

describe("ProcShopComboBox", () => {
    it("renders a labelled input associated with the combobox for accessibility", () => {
        render(
            <ProcShopComboBox
                procShopOptions={procShopOptions}
                procShop={[]}
                setProcShop={vi.fn()}
            />
        );

        const label = screen.getByText("Procurement Shop");
        expect(label).toHaveAttribute("for", "proc-shop-combobox-input");
        // The label's htmlFor points at the react-select input, so it is queryable by label text.
        expect(screen.getByLabelText("Procurement Shop")).toHaveAttribute("id", "proc-shop-combobox-input");
    });

    it("shows procurement shop abbreviations as options and selects by abbr", async () => {
        const user = userEvent.setup();
        const setProcShop = vi.fn();
        render(
            <ProcShopComboBox
                procShopOptions={procShopOptions}
                procShop={[]}
                setProcShop={setProcShop}
            />
        );

        await user.click(screen.getByLabelText("Procurement Shop"));
        expect(screen.getByText("GCS")).toBeInTheDocument();
        expect(screen.getByText("PSC")).toBeInTheDocument();

        await user.click(screen.getByText("GCS"));
        expect(setProcShop).toHaveBeenCalledWith([procShopOptions[0]]);
    });
});
