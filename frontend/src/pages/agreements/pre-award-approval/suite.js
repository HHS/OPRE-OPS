import { create, test } from "vest";

/**
 * Validation suite for Request Pre-Award Approval page
 * Note: Minimal validation since notes are optional and main validation happens on backend
 */
// eslint-disable-next-line no-unused-vars
const suite = create((data = {}) => {
    // Notes field is optional - no validation needed
    // Backend handles authorization and required field validation
    // This test always passes since notes can be empty or present
    test("notes", "Notes are optional", () => {
        // This test intentionally always passes
        return true;
    });
});

export default suite;
