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
        heading1: { control: "text", description: "Column 1 header", table: { category: "Headings" } },
        heading2: { control: "text", description: "Column 2 header", table: { category: "Headings" } },
        heading3: {
            control: "text",
            description: "Column 3 header (leave empty to omit)",
            table: { category: "Headings" }
        },
        heading4: {
            control: "text",
            description: "Column 4 header (leave empty to omit)",
            table: { category: "Headings" }
        },
        width1: { control: "text", description: "Column 1 skeleton width", table: { category: "Column Widths" } },
        width2: { control: "text", description: "Column 2 skeleton width", table: { category: "Column Widths" } },
        width3: { control: "text", description: "Column 3 skeleton width", table: { category: "Column Widths" } },
        width4: { control: "text", description: "Column 4 skeleton width", table: { category: "Column Widths" } },
        rowCount: { control: { type: "number", min: 1, max: 25 }, description: "Number of placeholder rows" },
        hasExpandableRows: { control: "boolean", description: "Include chevron column" },
        ariaLabel: { control: "text", description: "Accessible label for the loading table" }
    },
    render: ({
        heading1,
        heading2,
        heading3,
        heading4,
        width1,
        width2,
        width3,
        width4,
        rowCount,
        hasExpandableRows,
        ariaLabel
    }) => {
        const headings = [heading1, heading2, heading3, heading4].filter(Boolean);
        const widths = [width1, width2, width3, width4].filter(Boolean);
        const columnWidths = widths.length > 0 ? widths : undefined;
        return (
            <TableLoadingSkeleton
                headings={headings}
                columnWidths={columnWidths}
                rowCount={rowCount}
                hasExpandableRows={hasExpandableRows}
                ariaLabel={ariaLabel}
            />
        );
    }
};

/** Default loading state with 4 columns. */
export const Default = {
    args: {
        heading1: "Name",
        heading2: "Status",
        heading3: "Amount",
        heading4: "Date",
        width1: "",
        width2: "",
        width3: "",
        width4: ""
    }
};

/** Custom column widths for varied pill sizes. */
export const CustomWidths = {
    args: {
        heading1: "Agreement",
        heading2: "Type",
        heading3: "Budget",
        heading4: "FY",
        width1: "60%",
        width2: "30%",
        width3: "40%",
        width4: "25%"
    }
};

/** Includes chevron column for expandable rows. */
export const WithExpandableRows = {
    args: {
        heading1: "Name",
        heading2: "Status",
        heading3: "Amount",
        heading4: "Date",
        width1: "",
        width2: "",
        width3: "",
        width4: "",
        hasExpandableRows: true
    }
};

/** Minimal loading state with few rows. */
export const FewRows = {
    args: {
        heading1: "Item",
        heading2: "Value",
        heading3: "",
        heading4: "",
        width1: "",
        width2: "",
        width3: "",
        width4: "",
        rowCount: 2
    }
};
