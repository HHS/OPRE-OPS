import { fn } from "storybook/test";
import ToggleButton from "./ToggleButton";

export default {
    title: "UI/ToggleButton",
    component: ToggleButton,
    parameters: {
        docs: {
            description: {
                component: "Toggle switch button with on/off states. Uses FontAwesome toggle icons and shows a tooltip."
            }
        }
    },
    argTypes: {
        isToggleOn: { control: "boolean", description: "Current toggle state" },
        btnText: { control: "text", description: "Button label text" }
    },
    args: {
        handleToggle: fn()
    }
};

/** Toggle in the ON state. */
export const On = {
    args: {
        isToggleOn: true,
        btnText: "Include Drafts"
    }
};

/** Toggle in the OFF state. */
export const Off = {
    args: {
        isToggleOn: false,
        btnText: "Include Drafts"
    }
};
