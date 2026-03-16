import { create } from "vest";

/**
 * Validation suite for Request Pre-Award Approval page
 * Note: Minimal validation since notes are optional and main validation happens on backend
 */
// eslint-disable-next-line no-unused-vars
const suite = create("request-pre-award-approval", (data = {}) => {
    // No validation rules needed - notes are optional
    // Backend handles authorization and required field validation
    // This suite intentionally has no tests since all fields are optional
    // and validation happens on the backend
});

export default suite;
