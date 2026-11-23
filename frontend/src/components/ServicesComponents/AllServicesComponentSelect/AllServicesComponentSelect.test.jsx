import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AllServicesComponentSelect from "./AllServicesComponentSelect";

vi.mock("../../Agreements/AgreementEditor/AgreementEditorContext.hooks", () => ({
    useEditAgreement: () => ({
        agreement: { service_requirement_type: "NON_SEVERABLE" },
        services_components: [
            { id: 1, number: 1, optional: false, sub_component: null },
            { id: 2, number: 2, optional: true, sub_component: null }
        ]
    })
}));

describe("AllServicesComponentSelect", () => {
    it("lists the agreement's services components", () => {
        render(
            <AllServicesComponentSelect
                value=""
                onChange={vi.fn()}
            />
        );

        expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["", "SC1", "OSC2"]);
    });

    // OPS-6488: the de-obligation form shows the line's services component read-only.
    it("shows the services component's label, not its number, when disabled", () => {
        render(
            <AllServicesComponentSelect
                value={2}
                onChange={vi.fn()}
                isDisabled={true}
            />
        );

        const select = screen.getByRole("combobox");
        expect(select).toBeDisabled();
        expect(select).toHaveDisplayValue("OSC2");
    });
});
