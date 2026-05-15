import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ProcShopFilter from "./ProcShopFilter";

describe("ProcShopFilter", () => {
    it("renders label and default 'All' option", () => {
        render(
            <ProcShopFilter
                value="all"
                onChange={vi.fn()}
            />
        );
        expect(screen.getByLabelText("Proc. Shop")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "All" })).toBeInTheDocument();
    });

    it("renders provided options", () => {
        render(
            <ProcShopFilter
                value="all"
                onChange={vi.fn()}
                options={["GCS", "PSC"]}
            />
        );
        expect(screen.getByRole("option", { name: "GCS" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "PSC" })).toBeInTheDocument();
    });

    it("calls onChange when a different option is selected", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <ProcShopFilter
                value="all"
                onChange={onChange}
                options={["GCS", "PSC"]}
            />
        );
        await user.selectOptions(screen.getByRole("combobox"), "GCS");
        expect(onChange).toHaveBeenCalledWith("GCS");
    });

    it("reflects the current value", () => {
        render(
            <ProcShopFilter
                value="PSC"
                onChange={vi.fn()}
                options={["GCS", "PSC"]}
            />
        );
        expect(screen.getByRole("combobox")).toHaveValue("PSC");
    });
});
