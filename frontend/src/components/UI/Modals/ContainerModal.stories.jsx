import { fn } from "storybook/test";
import { ContainerModal } from "./ContainerModal";

export default {
    title: "UI/Modals/ContainerModal",
    component: ContainerModal,
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "Container-style modal for embedding custom content (forms, tables, etc.) with a single cancel button. " +
                    "Includes keyboard focus trapping and Escape to close."
            },
            story: {
                inline: false,
                height: "400px"
            }
        }
    },
    argTypes: {
        heading: { control: "text" },
        description: { control: "text" },
        cancelButtonText: { control: "text" }
    }
};

export const Default = {
    args: {
        heading: "Add Team Member",
        description: "Select a user to add to this agreement's team.",
        cancelButtonText: "Cancel",
        setShowModal: fn()
    },
    render: (args) => (
        <ContainerModal {...args}>
            <div className="usa-form-group">
                <label
                    className="usa-label"
                    htmlFor="user-select"
                >
                    User
                </label>
                <select
                    className="usa-select"
                    id="user-select"
                >
                    <option value="">- Select a user -</option>
                    <option value="1">Amy Madigan</option>
                    <option value="2">Ivelisse Martinez-Beck</option>
                    <option value="3">Chris Doe</option>
                </select>
            </div>
        </ContainerModal>
    )
};

export const WithFormContent = {
    args: {
        heading: "Edit Notes",
        description: "",
        cancelButtonText: "Close",
        setShowModal: fn()
    },
    render: (args) => (
        <ContainerModal {...args}>
            <div className="usa-form-group">
                <label
                    className="usa-label"
                    htmlFor="notes"
                >
                    Notes
                </label>
                <textarea
                    className="usa-textarea"
                    id="notes"
                    defaultValue="Initial notes for this budget line."
                />
            </div>
            <button
                type="button"
                className="usa-button margin-top-2"
            >
                Save
            </button>
        </ContainerModal>
    )
};
