import SectionHeading from "./SectionHeading";

export default {
    title: "UI/SectionHeading",
    component: SectionHeading,
    parameters: {
        docs: {
            description: {
                component:
                    "Section title with optional instructional copy. Pairs with PageHeader to build the " +
                    "page > section heading hierarchy used across OPS."
            }
        }
    },
    argTypes: {
        title: { control: "text", description: "Section heading text" },
        instructions: { control: "text", description: "Optional supporting copy below the heading" },
        level: { control: { type: "number", min: 1, max: 6 }, description: "Heading level for the title" },
        className: { control: "text", description: "Additional CSS classes for the wrapper" }
    }
};

/** Section heading with title only. */
export const WithTitle = {
    args: {
        title: "OPS Release Summary"
    }
};

/** Section heading with title and instructional copy. */
export const WithInstructions = {
    args: {
        title: "OPS Release Summary",
        instructions: "A snapshot of the latest OPS release and what the team is working on next."
    }
};

/** Section heading rendered as an h3 for nested sections. */
export const NestedLevel = {
    args: {
        title: "Release Notes 1.464.3",
        instructions: "This is a list of what's new from our latest release.",
        level: 3
    }
};
