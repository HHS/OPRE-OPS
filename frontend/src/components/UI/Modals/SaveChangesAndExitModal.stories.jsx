import { fn } from "storybook/test";
import { SaveChangesAndExitModal } from "./SaveChangesAndExitModal";

export default {
    title: "UI/Modals/SaveChangesAndExitModal",
    component: SaveChangesAndExitModal,
    parameters: {
        docs: {
            description: {
                component:
                    "Two-action modal for save-and-exit flows. Primary button saves changes; secondary button " +
                    "discards or cancels. Includes keyboard focus trapping and Escape to close."
            }
        }
    },
    argTypes: {
        heading: { control: "text" },
        description: { control: "text" },
        actionButtonText: { control: "text" },
        secondaryButtonText: { control: "text" }
    }
};

export const Default = {
    args: {
        heading: "Do you want to save changes before leaving?",
        description: "Any unsaved changes will be lost.",
        actionButtonText: "Save & Exit",
        secondaryButtonText: "Discard Changes",
        setShowModal: fn(),
        handleConfirm: fn(),
        handleSecondary: fn(),
        closeModal: fn()
    }
};

export const WithListDescription = {
    args: {
        heading: "You have unsaved changes",
        description: [
            { id: 1, title: "Amount", created_on: "2025-06-01", message: "Changed from $100,000 to $125,000" },
            { id: 2, title: "Obligate By Date", created_on: "2025-06-01", message: "Changed from 09/30/2025 to 12/31/2025" }
        ],
        actionButtonText: "Save Changes",
        secondaryButtonText: "Discard",
        setShowModal: fn(),
        handleConfirm: fn(),
        handleSecondary: fn(),
        closeModal: fn()
    }
};
