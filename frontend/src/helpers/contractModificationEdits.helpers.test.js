import { describe, expect, it } from "vitest";
import { getContractModificationEditTerms, isExecuteSelection } from "./contractModificationEdits.helpers";

const pairs = (terms) => terms.map((term) => [term.label, term.bliStatus ?? term.value]);

describe("getContractModificationEditTerms", () => {
    it("describes a budget line amount change", () => {
        const edit = {
            modification_type: "MODIFIED_LOE",
            budget_line_item_id: 16076,
            field: "amount",
            old_value: 100000,
            new_value: 125000
        };
        expect(pairs(getContractModificationEditTerms(edit))).toEqual([
            ["Modification Type", "Modified Level of Effort"],
            ["BL ID", 16076],
            ["Change To", "Amount"],
            ["From", "$100,000.00"],
            ["To", "$125,000.00"]
        ]);
    });

    it("uses the CAN names it's given for a CAN change", () => {
        const edit = {
            modification_type: "MODIFIED_LOE",
            budget_line_item_id: 1,
            field: "can_id",
            old_value: 504,
            new_value: 505
        };
        const terms = getContractModificationEditTerms(edit, { oldCan: "G994426", newCan: "G99HRF2" });
        expect(pairs(terms).slice(-2)).toEqual([
            ["From", "G994426"],
            ["To", "G99HRF2"]
        ]);
    });

    it("shows a status change as status tags, with text for views that don't draw tags", () => {
        const edit = {
            modification_type: "MODIFIED_LOE",
            budget_line_item_id: 1,
            field: "status",
            old_value: "DRAFT",
            new_value: "PLANNED"
        };
        const [from, to] = getContractModificationEditTerms(edit).slice(-2);
        expect(from).toEqual({ label: "From", bliStatus: "DRAFT", value: "Draft" });
        expect(to).toEqual({ label: "To", bliStatus: "PLANNED", value: "Planned" });
    });

    it("describes a COR change by the users' names", () => {
        const edit = {
            modification_type: "ADMIN_CHANGE",
            budget_line_item_id: null,
            field: "project_officer_id",
            old_value: 520,
            new_value: 522,
            old_display_name: "Chris Fortunato",
            new_display_name: null
        };
        expect(pairs(getContractModificationEditTerms(edit))).toEqual([
            ["Modification Type", "Admin Change"],
            ["Change To", "COR"],
            ["From", "Chris Fortunato"],
            ["To", "TBD"]
        ]);
    });

    it("describes a Services Component period change by the SC and its dates", () => {
        const edit = {
            modification_type: "MODIFIED_LOE",
            services_component_id: 7,
            budget_line_item_id: null,
            field: "period_end",
            old_value: "2026-09-30",
            new_value: "2027-03-31",
            services_component_display_name: "SC1"
        };
        expect(pairs(getContractModificationEditTerms(edit)).slice(1)).toEqual([
            ["SC", "SC1"],
            ["Change To", expect.any(String)],
            ["From", "September 30, 2026"],
            ["To", "March 31, 2027"]
        ]);
    });

    it.each([
        ["services_component_create", "SC2", null, "Add SC"],
        ["delete", null, "SC2", "Delete SC"]
    ])("describes a Services Component %s with the SC and no From/To", (field, newValue, oldValue, change) => {
        const edit = {
            modification_type: "MODIFIED_LOE",
            services_component_id: 7,
            budget_line_item_id: null,
            field,
            old_value: oldValue,
            new_value: newValue
        };
        expect(pairs(getContractModificationEditTerms(edit)).slice(1)).toEqual([
            ["SC", "SC2"],
            ["Change To", change]
        ]);
    });

    it("groups an execute selection's BL ID and Total, with no Modification Type", () => {
        const edit = {
            budget_line_item_id: 16076,
            field: "status",
            old_value: "PLANNED",
            new_value: "IN_EXECUTION",
            amount: 90000
        };
        const terms = getContractModificationEditTerms(edit);
        expect(isExecuteSelection(edit)).toBe(true);
        expect(terms.find((term) => term.label === "Modification Type")).toBeUndefined();
        expect(terms.filter((term) => term.group === "budget-line").map((term) => term.label)).toEqual([
            "BL ID",
            "Total"
        ]);
    });
});
