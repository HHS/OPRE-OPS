import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AgreementEditorContext } from "../../Agreements/AgreementEditor/contexts";
import AllGrantNumberSelect from "./AllGrantNumberSelect";

const renderWithContext = (grantNumbers, props = {}) =>
    render(
        <AgreementEditorContext.Provider value={{ grant_numbers: grantNumbers }}>
            <AllGrantNumberSelect
                value=""
                onChange={() => {}}
                {...props}
            />
        </AgreementEditorContext.Provider>
    );

describe("AllGrantNumberSelect", () => {
    it("renders the Grant Number label", () => {
        renderWithContext([]);
        expect(screen.getByText("Grant Number")).toBeInTheDocument();
    });

    it("renders an option per grant number using display_title", () => {
        renderWithContext([
            { id: 1, number: 2, display_title: "Grant 2" },
            { id: 2, number: 1, display_title: "Grant 1" }
        ]);
        const option1 = screen.getByRole("option", { name: "Grant 1" });
        const option2 = screen.getByRole("option", { name: "Grant 2" });
        expect(option1).toBeInTheDocument();
        expect(option2).toBeInTheDocument();
        // sorted by number ascending -> Grant 1 before Grant 2
        expect(option1.compareDocumentPosition(option2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("falls back to `Grant {number}` when display_title is missing", () => {
        renderWithContext([{ id: 1, number: 5 }]);
        expect(screen.getByRole("option", { name: "Grant 5" })).toBeInTheDocument();
    });

    it("calls onChange with the selected grant number value", () => {
        const onChange = vi.fn();
        renderWithContext([{ id: 1, number: 3, display_title: "Grant 3" }], { onChange });
        const select = screen.getByRole("combobox");
        select.value = "3";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        expect(onChange).toHaveBeenCalledWith("allGrantNumberSelect", "3");
    });
});
