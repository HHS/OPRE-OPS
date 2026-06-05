import { useState } from "react";
import Select from "./Select";

const sampleOptions = [
    { label: "Research", value: "RESEARCH" },
    { label: "Evaluation", value: "EVALUATION" },
    { label: "Data Collection", value: "DATA_COLLECTION" },
    { label: "Technical Assistance", value: "TECHNICAL_ASSISTANCE", disabled: true }
];

export default {
    title: "UI/Form/Select",
    component: Select,
    parameters: {
        docs: {
            description: {
                component:
                    "Dropdown select input with label, error messaging, required indicator, and disabled/tooltip states. " +
                    "The `onChange` callback receives `(name, value)` rather than a synthetic event."
            }
        }
    },
    argTypes: {
        name: { control: "text" },
        label: { control: "text" },
        value: { control: "text" },
        messages: { control: "object" },
        defaultOption: { control: "text" },
        isRequired: { control: "boolean" },
        isDisabled: { control: "boolean" },
        pending: { control: "boolean" },
        tooltipMsg: { control: "text" }
    }
};

export const Default = {
    args: {
        name: "project-type",
        label: "Project Type",
        value: "",
        options: sampleOptions
    }
};

export const WithSelectedValue = {
    args: {
        name: "project-type",
        label: "Project Type",
        value: "RESEARCH",
        options: sampleOptions
    }
};

export const Required = {
    args: {
        name: "project-type",
        label: "Project Type",
        value: "",
        options: sampleOptions,
        isRequired: true
    }
};

export const WithErrors = {
    args: {
        name: "project-type",
        label: "Project Type",
        value: "",
        options: sampleOptions,
        messages: ["A project type is required"]
    }
};

export const Disabled = {
    args: {
        name: "project-type",
        label: "Project Type",
        value: "RESEARCH",
        options: sampleOptions,
        isDisabled: true,
        tooltipMsg: "This field cannot be changed after submission"
    }
};

export const Interactive = {
    args: {
        name: "category",
        label: "Category",
        options: sampleOptions
    },
    render: (args) => {
        const [value, setValue] = useState("");
        return (
            <Select
                {...args}
                value={value}
                onChange={(name, val) => setValue(val)}
            />
        );
    }
};
