import { useState } from "react";
import ComboBox from "./ComboBox";

const fruits = [
    { id: 1, title: "Apple" },
    { id: 2, title: "Banana" },
    { id: 3, title: "Cherry" }
];

// The label sits outside the ComboBox, as in CanComboBox: grey it with usa-label--disabled.
const ComboBoxWithState = ({ selected = null, ...args }) => {
    const [selectedData, setSelectedData] = useState(selected);
    return (
        <div style={{ maxWidth: "20rem" }}>
            <label
                className={`usa-label margin-top-0 ${args.isDisabled ? "usa-label--disabled" : ""}`}
                htmlFor="fruit-combobox-input"
            >
                Fruit
            </label>
            <ComboBox
                namespace="fruit-combobox"
                data={fruits}
                selectedData={selectedData}
                setSelectedData={setSelectedData}
                {...args}
            />
        </div>
    );
};

export default {
    title: "UI/Form/ComboBox",
    component: ComboBox,
    tags: ["autodocs"],
    render: (args) => <ComboBoxWithState {...args} />
};

export const Default = {
    args: { defaultString: "-- Select a fruit --" }
};

export const WithSelectedValue = {
    args: { selected: fruits[1] }
};

export const WithErrors = {
    args: { messages: ["This is required information"] }
};

export const Disabled = {
    args: { selected: fruits[1], isDisabled: true }
};

export const DisabledEmpty = {
    args: { defaultString: "-- Select a fruit --", isDisabled: true }
};
