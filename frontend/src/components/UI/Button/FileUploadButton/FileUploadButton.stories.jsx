import { fn } from "storybook/test";
import FileUploadButton from "./FileUploadButton";

export default {
    title: "UI/Button/FileUploadButton",
    component: FileUploadButton,
    parameters: {
        docs: {
            description: {
                component:
                    "Card-style file button supporting upload and download variants. " +
                    "Displays filename when a file is selected and supports disabled state with tooltip."
            }
        }
    },
    argTypes: {
        variant: {
            control: "radio",
            options: ["upload", "download"],
            description: "Button mode"
        },
        label: { control: "text", description: "Placeholder text when no file selected" },
        buttonText: { control: "text", description: "Text next to the action icon" },
        disabled: { control: "boolean", description: "Disabled state" },
        disabledTooltip: { control: "text", description: "Tooltip when disabled" }
    },
    args: {
        onFileChange: fn(),
        onDownload: fn()
    }
};

/** Default upload variant. */
export const Upload = {
    args: {
        id: "doc-upload",
        variant: "upload",
        label: "Upload Document",
        buttonText: "Upload File"
    }
};

/** Upload variant with a file already selected. */
export const WithSelectedFile = {
    args: {
        id: "doc-upload",
        variant: "upload",
        label: "Upload Document",
        buttonText: "Upload File",
        selectedFile: { name: "final-report-2025.pdf" }
    }
};

/** Download variant with download icon. */
export const Download = {
    args: {
        id: "doc-download",
        variant: "download",
        label: "Final Consensus Memo",
        buttonText: "Download File"
    }
};

/** Disabled state with tooltip explanation. */
export const Disabled = {
    args: {
        id: "doc-upload",
        variant: "upload",
        label: "Upload Document",
        buttonText: "Upload File",
        disabled: true,
        disabledTooltip: "Upload is not available yet"
    }
};
