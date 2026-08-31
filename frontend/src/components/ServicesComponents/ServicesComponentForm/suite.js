import { create, enforce, test } from "vest";

/**
 * Vest validation suite for the ServicesComponentForm required fields.
 *
 * Expected data fields:
 *   - servicesComponentSelect: number — the selected SC number
 */
const suite = create((data = {}) => {
    test("servicesComponentSelect", "This is required information", () => {
        // servicesComponentSelect is a number (the SC number); treat 0 / falsy as blank
        enforce(data.servicesComponentSelect).isNumeric().greaterThan(0);
    });
});

export default suite;
