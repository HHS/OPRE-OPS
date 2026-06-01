import TableLoadingSkeleton from "./TableLoadingSkeleton";

export default {
    title: "UI/TableLoadingSkeleton",
    component: TableLoadingSkeleton,
    parameters: {
        docs: {
            description: {
                component:
                    "Shimmer-animated placeholder table shown while data loads. " +
                    "Matches the structure of the real table including optional expandable row chevrons."
            }
        }
    },
    argTypes: {
        headings: { control: "object", description: "Column header labels" },
        columnWidths: { control: "object", description: "CSS widths for skeleton pills" },
        rowCount: { control: { type: "number", min: 1, max: 25 }, description: "Number of placeholder rows" },
        hasExpandableRows: { control: "boolean", description: "Include chevron column" },
        ariaLabel: { control: "text", description: "Accessible label for the loading table" }
    }
};

/** Default loading state with 4 columns. */
export const Default = {
    args: {
        headings: ["Name", "Status", "Amount", "Date"]
    }
};

/** Custom column widths for varied pill sizes. */
export const CustomWidths = {
    args: {
        headings: ["Agreement", "Type", "Budget", "FY"],
        columnWidths: ["60%", "30%", "40%", "25%"]
    }
};

/** Includes chevron column for expandable rows. */
export const WithExpandableRows = {
    args: {
        headings: ["Name", "Status", "Amount", "Date"],
        hasExpandableRows: true
    }
};

/** Minimal loading state with few rows. */
export const FewRows = {
    args: {
        headings: ["Item", "Value"],
        rowCount: 2
    }
};
