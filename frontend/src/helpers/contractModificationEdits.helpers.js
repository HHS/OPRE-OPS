import { renderChangeValues } from "./changeRequests.helpers";
import { convertCodeForDisplay, formatDateToMonthDayYear, renderField } from "./utils";

// Services Component add/delete (OPS-6440/OPS-3072) show the SC and what happened to it, with no
// From/To, per the design. "delete" is shared with a budget-line delete; which branch renders is
// decided by edit.services_component_id, not the field name.
const SERVICES_COMPONENT_CHANGE_LABELS = {
    services_component_create: "Add SC",
    delete: "Delete SC"
};

// A Services Component's period-of-performance edit (OPS-3268): one card per date, with the SC and
// From/To dates, per the design.
const SERVICES_COMPONENT_PERIOD_FIELDS = ["period_start", "period_end"];

/**
 * @typedef {Object} ContractModificationEditTerm
 * @property {string} label - The term's label, e.g. "Change To"
 * @property {string | number | null | undefined} [value] - The text to show
 * @property {string} [bliStatus] - A budget line status, for views that show it as a status tag
 * @property {string} [group] - Terms with the same group are shown together (the execute card's BL ID + Total)
 */

/**
 * The labeled values that describe one edit requiring a contract modification, in display order.
 * Shared by the edit card and the Award & Modification History accordion (OPS-6513), so both
 * describe an edit the same way.
 *
 * @param {import("../components/Agreements/ContractModificationEdits/ContractModificationEditCard").ContractModificationEdit} edit
 * @param {{ oldCan?: string, newCan?: string }} [canNames] - Display names for a CAN change's From/To
 * @returns {ContractModificationEditTerm[]}
 */
export const getContractModificationEditTerms = (edit, { oldCan, newCan } = {}) => {
    const changeTo = { [edit.field]: { old: edit.old_value, new: edit.new_value } };
    const { oldValue, newValue } = renderChangeValues(edit.field, changeTo, oldCan, newCan);
    const servicesComponentChange =
        edit.services_component_id != null ? SERVICES_COMPONENT_CHANGE_LABELS[edit.field] : undefined;
    const isServicesComponentPeriodEdit =
        edit.services_component_id != null && SERVICES_COMPONENT_PERIOD_FIELDS.includes(edit.field);
    // The SC's display name, frozen on the row: the new SC for an addition, the deleted one otherwise.
    const servicesComponentName = edit.field === "services_component_create" ? edit.new_value : edit.old_value;
    // A COR change (OPS-3153) is agreement-level: no budget line, and From/To are user names.
    const isAgreementLevel = edit.field === "project_officer_id";
    const changeToLabel = convertCodeForDisplay("changeToTypes", edit.field);
    const statusTerms = () => [
        { label: "From", bliStatus: edit.old_value, value: renderField("status", "status", edit.old_value) },
        { label: "To", bliStatus: edit.new_value, value: renderField("status", "status", edit.new_value) }
    ];

    /** @type {ContractModificationEditTerm[]} */
    let terms;
    if (isAgreementLevel) {
        terms = [
            { label: "Change To", value: changeToLabel },
            { label: "From", value: edit.old_display_name ?? "TBD" },
            { label: "To", value: edit.new_display_name ?? "TBD" }
        ];
    } else if (isServicesComponentPeriodEdit) {
        terms = [
            { label: "SC", value: edit.services_component_display_name ?? "TBD" },
            { label: "Change To", value: changeToLabel },
            { label: "From", value: edit.old_value ? formatDateToMonthDayYear(edit.old_value) : "TBD" },
            { label: "To", value: edit.new_value ? formatDateToMonthDayYear(edit.new_value) : "TBD" }
        ];
    } else if (servicesComponentChange) {
        terms = [
            { label: "SC", value: servicesComponentName },
            { label: "Change To", value: servicesComponentChange }
        ];
    } else if (isExecuteSelection(edit)) {
        terms = [
            { label: "BL ID", value: edit.budget_line_item_id, group: "budget-line" },
            { label: "Total", value: renderField("amount", "amount", edit.amount), group: "budget-line" },
            { label: "Change To", value: changeToLabel },
            ...statusTerms()
        ];
    } else {
        terms = [
            { label: "BL ID", value: edit.budget_line_item_id },
            { label: "Change To", value: changeToLabel },
            ...(edit.field === "status"
                ? statusTerms()
                : [
                      { label: "From", value: oldValue },
                      { label: "To", value: newValue }
                  ])
        ];
    }

    if (isExecuteSelection(edit)) {
        return terms;
    }
    return [
        { label: "Modification Type", value: convertCodeForDisplay("modificationEditType", edit.modification_type) },
        ...terms
    ];
};

/**
 * A budget line selected to execute (Planned -> Executing, Start Modification) isn't a tracked
 * edit -- it's the approval action itself -- so it carries no modification_type.
 *
 * @param {import("../components/Agreements/ContractModificationEdits/ContractModificationEditCard").ContractModificationEdit} edit
 * @returns {boolean}
 */
export const isExecuteSelection = (edit) =>
    edit.modification_type == null &&
    edit.field !== "project_officer_id" &&
    !(edit.services_component_id != null && SERVICES_COMPONENT_CHANGE_LABELS[edit.field]) &&
    !(edit.services_component_id != null && SERVICES_COMPONENT_PERIOD_FIELDS.includes(edit.field));
