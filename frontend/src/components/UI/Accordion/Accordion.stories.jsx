import Accordion from "./Accordion";

export default {
    title: "UI/Accordion",
    component: Accordion,
    parameters: {
        docs: {
            description: {
                component:
                    "Uncontrolled accordion using USWDS styling and JavaScript. The `isClosed` prop " +
                    "sets the initial state only — after mount the component manages its own open/closed state via clicks."
            }
        }
    },
    argTypes: {
        heading: {
            control: "text",
            description: "Heading content displayed in the accordion button"
        },
        level: {
            control: { type: "number", min: 1, max: 6 },
            description: "HTML heading level (1–6)"
        },
        isClosed: {
            control: "boolean",
            description: "Initial closed state (only used on mount)"
        }
    }
};

export const DefaultOpen = {
    args: {
        heading: "Budget Lines",
        isClosed: false
    },
    render: (args) => (
        <Accordion {...args}>
            <p>This is the accordion content displayed when expanded.</p>
        </Accordion>
    )
};

export const InitiallyClosed = {
    args: {
        heading: "Additional Details",
        isClosed: true
    },
    render: (args) => (
        <Accordion {...args}>
            <p>Click the heading button above to reveal this content.</p>
        </Accordion>
    )
};

export const CustomHeadingLevel = {
    args: {
        heading: "Section Heading (h2)",
        level: 2,
        isClosed: false
    },
    render: (args) => (
        <Accordion {...args}>
            <p>This accordion uses an h2 element for its heading.</p>
        </Accordion>
    )
};

export const WithRichContent = {
    args: {
        heading: "Agreement Summary",
        isClosed: false
    },
    render: (args) => (
        <Accordion {...args}>
            <ul className="usa-list">
                <li>Total Budget: $1,500,000</li>
                <li>Budget Lines: 12</li>
                <li>Status: In Execution</li>
            </ul>
            <p className="text-base-dark font-sans-xs">Last updated: May 2025</p>
        </Accordion>
    )
};
