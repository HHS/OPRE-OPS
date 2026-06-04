import TableTag from "./TableTag";

export default {
    title: "UI/TableTag",
    component: TableTag,
    parameters: {
        docs: {
            description: {
                component:
                    "Status tag for table rows. Converts internal status codes to display text " +
                    "and renders the appropriate color variant. Supports In Review and OBE states."
            }
        }
    },
    argTypes: {
        status: {
            control: "select",
            options: ["DRAFT", "PLANNED", "IN_EXECUTION", "OBLIGATED"],
            description: "Internal status code"
        },
        inReview: { control: "boolean", description: "Whether the item is in review" },
        lockedMessage: { control: "text", description: "Tooltip message when in review" },
        isObe: { control: "boolean", description: "Whether the item is Overcome By Events" }
    }
};

/** Draft status. */
export const Draft = {
    args: { status: "DRAFT" }
};

/** Planned status. */
export const Planned = {
    args: { status: "PLANNED" }
};

/** Executing status. */
export const Executing = {
    args: { status: "IN_EXECUTION" }
};

/** Obligated status. */
export const Obligated = {
    args: { status: "OBLIGATED" }
};

/** In Review state with tooltip message. */
export const InReview = {
    args: {
        status: "DRAFT",
        inReview: true,
        lockedMessage: "Budget change pending approval"
    }
};

/** Overcome By Events (OBE) state. */
export const OBE = {
    args: {
        status: "DRAFT",
        isObe: true
    }
};
