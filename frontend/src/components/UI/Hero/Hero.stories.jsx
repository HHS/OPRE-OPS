import Hero from "./Hero";

export default {
    title: "UI/Hero",
    component: Hero,
    parameters: {
        docs: {
            description: {
                component:
                    "Full-width section banner with a heading and optional child content. " +
                    "Used at the top of entity pages (projects, agreements, CANs) to display the entity name."
            }
        }
    },
    argTypes: {
        entityName: {
            control: "text",
            description: "Primary heading text displayed in the hero section"
        }
    }
};

export const Default = {
    args: {
        entityName: "Contract #1: African American Child and Family Research Center"
    }
};

export const WithChildren = {
    args: {
        entityName: "G99PHS9 - Ongoing"
    },
    render: (args) => (
        <Hero {...args}>
            <p className="font-sans-sm margin-top-2 text-base-dark">
                Research project exploring health outcomes across multiple populations.
            </p>
        </Hero>
    )
};
