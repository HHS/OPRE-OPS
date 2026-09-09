import { formatVendorType } from "../components/Agreements/AwardRequestForm/awardForm.helpers";
import { NO_DATA } from "../constants";
import { formatCurrency } from "./currencyFormat.helpers";
import { formatDateToMonthDayYear } from "./utils";

/**
 * Award & Modification History field formatters.
 *
 * The backend returns raw values (null when a field has no data); these apply the
 * shared NO_DATA ("TBD") fallback at render time, matching the rest of the app.
 */

/**
 * @param {string|null|undefined} value
 * @returns {string} The value, or NO_DATA when empty.
 */
export const displayText = (value) => value ?? NO_DATA;

/**
 * @param {string|null|undefined} value - ISO date string.
 * @returns {string} Formatted date (e.g. "June 26, 2024"), or NO_DATA when empty.
 */
export const displayDate = (value) => (value ? formatDateToMonthDayYear(value) : NO_DATA);

/**
 * @param {string|number|null|undefined} value
 * @returns {string} Formatted currency, or NO_DATA when null/undefined.
 */
export const displayCurrency = (value) => (value == null ? NO_DATA : formatCurrency(value));

/**
 * @param {string|null|undefined} value - VendorType enum name (e.g. "SMALL_BUSINESS").
 * @returns {string} Human-readable vendor type, or NO_DATA when empty.
 */
export const displayVendorType = (value) => (value ? formatVendorType(value) : NO_DATA);

/**
 * Build the ordered label/value field list for one award/modification record.
 * The order matches the mockup: 5 per row, so a 5-column flex-wrap lays them out
 * as rows of 5, 5, and 2.
 *
 * @param {Object} record - A single award-history record from the API.
 * @returns {{label: string, value: string, dataCy: string}[]}
 */
export const getAwardModificationFields = (record) => [
    { label: "Award Date", value: displayDate(record.award_date), dataCy: "award-date" },
    { label: "Award Amount", value: displayCurrency(record.award_amount), dataCy: "award-amount" },
    { label: "Contract Total", value: displayCurrency(record.contract_total), dataCy: "contract-total" },
    { label: "Contract #", value: displayText(record.contract_number), dataCy: "contract-number" },
    { label: "Modification #", value: displayText(record.modification_number), dataCy: "modification-number" },
    {
        label: "Requisition Approval Date",
        value: displayDate(record.requisition_approval_date),
        dataCy: "requisition-approval-date"
    },
    { label: "Requisition #", value: displayText(record.requisition_number), dataCy: "requisition-number" },
    { label: "Vendor", value: displayText(record.vendor_name), dataCy: "vendor" },
    {
        label: "Unique Entity ID (SAM.gov ID)",
        value: displayText(record.vendor_unique_entity_id),
        dataCy: "unique-entity-id"
    },
    { label: "Vendor Type", value: displayVendorType(record.vendor_type), dataCy: "vendor-type" },
    { label: "Purchase Order #", value: displayText(record.purchase_order_number), dataCy: "purchase-order-number" },
    { label: "Task Order #", value: displayText(record.task_order_number), dataCy: "task-order-number" }
];

/**
 * @typedef {Object} AwardModificationGroup
 * @property {string} title - Section heading (e.g. "Award Information").
 * @property {string} dataCy - Stable data-cy for the section.
 * @property {{label: string, value: string, dataCy: string}[]} fields - Fields in this section.
 */

/**
 * Group the award/modification fields into the labeled sections shown in the mockup,
 * arranged as two columns. Each column is a list of groups stacked vertically:
 *
 *   Column 1: Award Information,   Vendor Information
 *   Column 2: Contract Information, Requisition Information
 *
 * @param {Object} record - A single award-history record from the API.
 * @returns {AwardModificationGroup[][]} Columns of grouped fields.
 */
export const getAwardModificationSections = (record) => {
    const byDataCy = Object.fromEntries(getAwardModificationFields(record).map((field) => [field.dataCy, field]));
    const group = (title, dataCy, dataCys) => ({
        title,
        dataCy,
        fields: dataCys.map((cy) => byDataCy[cy])
    });

    return [
        [
            group("Award Information", "award-information", ["award-date", "award-amount", "contract-total"]),
            group("Vendor Information", "vendor-information", ["vendor", "unique-entity-id", "vendor-type"])
        ],
        [
            group("Contract Information", "contract-information", [
                "contract-number",
                "modification-number",
                "purchase-order-number",
                "task-order-number"
            ]),
            group("Requisition Information", "requisition-information", [
                "requisition-number",
                "requisition-approval-date"
            ])
        ]
    ];
};
