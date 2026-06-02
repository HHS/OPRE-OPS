import { useState } from "react";
import Input from "./Input";

export default {
    title: "UI/Form/Input",
    component: Input,
    parameters: {
        docs: {
            description: {
                component:
                    "Text input field with label, error messaging, required indicator, and disabled/tooltip states. " +
                    "The `onChange` callback receives `(name, value)` rather than a synthetic event."
            }
        }
    },
    argTypes: {
        name: { control: "text" },
        label: { control: "text" },
        value: { control: "text" },
        messages: { control: "object", description: "Array of error message strings (first is displayed)" },
        maxLength: { control: "number" },
        isRequired: { control: "boolean" },
        isDisabled: { control: "boolean" },
        pending: { control: "boolean" },
        tooltipMsg: { control: "text" }
    }
};

export const Default = {
    args: {
        name: "project-name",
        label: "Project Name",
        value: ""
    }
};

export const WithValue = {
    args: {
        name: "project-name",
        label: "Project Name",
        value: "African American Child and Family Research Center"
    }
};

export const Required = {
    args: {
        name: "agreement-title",
        label: "Agreement Title",
        value: "",
        isRequired: true
    }
};

export const WithErrors = {
    args: {
        name: "agreement-title",
        label: "Agreement Title",
        value: "",
        messages: ["This field is required"]
    }
};

export const Disabled = {
    args: {
        name: "contract-number",
        label: "Contract Number",
        value: "HHSP233201500039I",
        isDisabled: true,
        tooltipMsg: "This field cannot be edited"
    }
};

export const WithMaxLength = {
    args: {
        name: "short-title",
        label: "Short Title",
        value: "",
        maxLength: 50
    }
};

export const Interactive = {
    args: {
        name: "description",
        label: "Description",
        maxLength: 100
    },
    render: (args) => {
        const [value, setValue] = useState("");
        return (
            <Input
                {...args}
                value={value}
                onChange={(name, val) => setValue(val)}
            />
        );
    }
};
