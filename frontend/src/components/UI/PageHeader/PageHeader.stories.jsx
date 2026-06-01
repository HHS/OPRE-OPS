import PageHeader from "./PageHeader";

export default {
    title: "UI/PageHeader",
    component: PageHeader,
    parameters: {
        docs: {
            description: {
                component: "Top-of-page heading with optional subtitle. Uses USWDS typography and brand primary color."
            }
        }
    },
    argTypes: {
        title: { control: "text", description: "Page heading text" },
        subTitle: { control: "text", description: "Optional subtitle below the heading" }
    }
};

/** Page heading with title only. */
export const WithTitle = {
    args: {
        title: "Agreements"
    }
};

/** Page heading with title and subtitle. */
export const WithSubtitle = {
    args: {
        title: "CANs",
        subTitle: "Common Accounting Numbers for FY 2025"
    }
};
