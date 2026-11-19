import { useState } from "react";
import CurrencyInput from "./CurrencyInput";

export default {
    title: "UI/Form/CurrencyInput",
    component: CurrencyInput,
    parameters: {
        docs: {
            description: {
                component:
                    "Currency input that auto-formats values with thousand separators and two decimal places. " +
                    "Built on `react-currency-format`. The `onChange` callback receives `(name, value)` as a string; " +
                    "use `setEnteredAmount` for the parsed float."
            }
        }
    },
    argTypes: {
        name: { control: "text" },
        label: { control: "text" },
        value: { control: "text" },
        messages: { control: "object" },
        placeholder: { control: "text" },
        pending: { control: "boolean" }
    }
};

export const Default = {
    args: {
        name: "amount",
        label: "Amount",
        value: "",
        placeholder: "$"
    }
};

export const WithValue = {
    args: {
        name: "amount",
        label: "Total Budget",
        value: "1500000"
    }
};

export const WithErrors = {
    args: {
        name: "amount",
        label: "Amount",
        value: "",
        messages: ["Amount is required"]
    }
};

export const Interactive = {
    args: {
        name: "budget-amount",
        label: "Budget Amount"
    },
    render: (args) => {
        const [value, setValue] = useState("");
        return (
            <CurrencyInput
                {...args}
                value={value}
                onChange={(name, val) => setValue(val)}
            />
        );
    }
};
