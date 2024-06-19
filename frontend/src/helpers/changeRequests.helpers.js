import { renderField } from "./utils";

/**
 * @typedef {Object} RenderedChangeValues
 * @property {string} oldValue - The old value
 * @property {string} newValue - The new value
 */

/**
 * Render change values
 * @param {string} keyName - The key name
 * @param {Object} changeTo - The requested change
 * @param {string} [oldCan] - The old CAN
 * @param {string} [newCan] - The new CAN
 *
 * @returns {RenderedChangeValues} - The rendered change values
 */
export function renderChangeValues(keyName, changeTo, oldCan = "", newCan = "") {
    let oldValue,
        newValue = "";

    const KEY_NAMES = {
        AMOUNT: "amount",
        CAN: "can_id",
        DATE_NEEDED: "date_needed",
        STATUS: "status"
    };

    switch (keyName) {
        case KEY_NAMES.AMOUNT:
            oldValue = renderField(keyName, "amount", changeTo.amount.old);
            newValue = renderField(keyName, "amount", changeTo.amount.new);
            break;
        case KEY_NAMES.CAN:
            oldValue = oldCan;
            newValue = newCan;
            break;
        case KEY_NAMES.DATE_NEEDED:
            oldValue = renderField(keyName, "date_needed", changeTo.date_needed.old);
            newValue = renderField(keyName, "date_needed", changeTo.date_needed.new);
            break;
        case KEY_NAMES.STATUS:
            oldValue = renderField(keyName, "status", changeTo.status.old);
            newValue = renderField(keyName, "status", changeTo.status.new);
            break;
        default:
            break;
    }

    return {
        oldValue,
        newValue
    };
}
