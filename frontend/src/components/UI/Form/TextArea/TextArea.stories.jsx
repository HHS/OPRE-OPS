import { useState } from "react";
import TextArea from "./TextArea";

export default {
    title: "UI/Form/TextArea",
    component: TextArea,
    parameters: {
        docs: {
            description: {
                component:
                    "Multi-line text input with character count, hint message, error states, and disabled support. " +
                    "Auto-generates a hint from `maxLength` if `hintMsg` is not provided."
            }
        }
    },
    argTypes: {
        name: { control: "text" },
        label: { control: "text" },
        value: { control: "text" },
        maxLength: { control: "number" },
        hintMsg: { control: "text" },
        messages: { control: "object" },
        isDisabled: { control: "boolean" },
        pending: { control: "boolean" }
    }
};

export const Default = {
    args: {
        name: "description",
        label: "Description",
        value: "",
        maxLength: 500
    }
};

export const WithValue = {
    args: {
        name: "description",
        label: "Description",
        value: "This agreement supports research on early childhood development outcomes across diverse populations.",
        maxLength: 500
    }
};

export const WithErrors = {
    args: {
        name: "description",
        label: "Description",
        value: "",
        maxLength: 500,
        messages: ["Description is required"]
    }
};

export const NearMaxLength = {
    args: {
        name: "notes",
        label: "Notes",
        value: "A".repeat(95),
        maxLength: 100
    }
};

export const Disabled = {
    args: {
        name: "description",
        label: "Description",
        value: "This field is locked for editing.",
        maxLength: 500,
        isDisabled: true
    }
};

export const Interactive = {
    args: {
        name: "notes",
        label: "Notes",
        maxLength: 200
    },
    render: (args) => {
        const [value, setValue] = useState("");
        return (
            <TextArea
                {...args}
                value={value}
                onChange={(name, val) => setValue(val)}
            />
        );
    }
};
