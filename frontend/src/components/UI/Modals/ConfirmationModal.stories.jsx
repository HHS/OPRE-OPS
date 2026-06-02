import { fn } from "storybook/test";
import { ConfirmationModal } from "./ConfirmationModal";

export default {
    title: "UI/Modals/ConfirmationModal",
    component: ConfirmationModal,
    parameters: {
        docs: {
            description: {
                component:
                    "Two-action modal with confirm and cancel buttons. Includes keyboard focus trapping " +
                    "(Tab wraps around) and Escape to close. Renders inline using USWDS modal markup."
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
        heading: "Are you sure you want to delete this budget line?",
        description: "This action cannot be undone.",
        actionButtonText: "Delete",
        secondaryButtonText: "Cancel",
        setShowModal: fn(),
        handleConfirm: fn()
    }
};

export const WithListDescription = {
    args: {
        heading: "The following changes will be saved",
        description: [
            {
                id: 1,
                title: "Budget Line #1",
                created_on: "2025-03-15",
                message: "Amount changed from $50,000 to $75,000"
            },
            { id: 2, title: "Budget Line #2", created_on: "2025-03-15", message: "CAN changed from G99ABC to G99XYZ" }
        ],
        actionButtonText: "Save Changes",
        secondaryButtonText: "Go Back",
        setShowModal: fn(),
        handleConfirm: fn()
    }
};

export const CustomButtonText = {
    args: {
        heading: "Submit this agreement for approval?",
        description: "The agreement will be sent to the Division Director for review.",
        actionButtonText: "Submit for Approval",
        secondaryButtonText: "Not Yet",
        setShowModal: fn(),
        handleConfirm: fn()
    }
};
