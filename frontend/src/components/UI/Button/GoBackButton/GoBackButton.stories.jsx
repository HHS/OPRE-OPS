import { fn } from "storybook/test";
import GoBackButton from "./GoBackButton";

export default {
    title: "UI/Button/GoBackButton",
    component: GoBackButton,
    parameters: {
        docs: {
            description: {
                component: "Navigation button with a back arrow icon. Used for returning to a previous page."
            }
        }
    },
    argTypes: {
        buttonText: { control: "text", description: "Button label text" }
    },
    args: {
        handleGoBack: fn()
    }
};

/** Default back button with arrow icon. */
export const Default = {
    args: {
        buttonText: "Back"
    }
};

/** Custom text for contextual navigation. */
export const CustomText = {
    args: {
        buttonText: "Return to Agreements"
    }
};
