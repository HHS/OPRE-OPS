import Term from "./Term";

export default {
    title: "UI/Term",
    component: Term,
    parameters: {
        docs: {
            description: {
                component:
                    "Label-value pair rendered as a definition list item (dt/dd). " +
                    "Supports pending state, error messages, and defaults to 'TBD' when no value is provided."
            }
        }
    },
    decorators: [
        (Story) => (
            <dl>
                <Story />
            </dl>
        )
    ],
    argTypes: {
        name: { control: "text", description: "Field identifier" },
        label: { control: "text", description: "Display label (defaults to name)" },
        value: { control: "text", description: "Display value" },
        pending: { control: "boolean", description: "Pending state styling" },
        errorMessage: {
            control: "text",
            description: "Validation error message (leave empty for none)",
            table: { category: "Errors" }
        },
        messages: { table: { disable: true } },
        dataCy: { table: { disable: true } },
        className: { table: { disable: true } }
    },
    render: ({ name, label, value, pending, errorMessage }) => {
        const messages = errorMessage ? [errorMessage] : [];
        return (
            <Term
                name={name}
                label={label}
                value={value}
                pending={pending}
                messages={messages}
            />
        );
    }
};

/** Standard label and value display. */
export const Default = {
    args: {
        name: "project",
        label: "Project",
        value: "Human Services",
        errorMessage: ""
    }
};

/** Label differs from the internal field name. */
export const WithLabel = {
    args: {
        name: "agreement_type",
        label: "Agreement Type",
        value: "Contract",
        errorMessage: ""
    }
};

/** Pending state with muted styling. */
export const Pending = {
    args: {
        name: "budget",
        label: "Total Budget",
        value: "$500,000",
        pending: true,
        errorMessage: ""
    }
};

/** Displays validation error messages below the value. */
export const WithErrors = {
    args: {
        name: "amount",
        label: "Amount",
        value: "",
        errorMessage: "This field is required"
    }
};

/** Value omitted — defaults to "TBD". */
export const TBDValue = {
    args: {
        name: "project_officer",
        label: "Project Officer",
        errorMessage: ""
    }
};
