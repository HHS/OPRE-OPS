import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ServicesComponents from "./ServicesComponents";
import { initialFormData } from "./ServicesComponents.constants";
import useServicesComponents from "./ServicesComponents.hooks";

vi.mock("./ServicesComponents.hooks");

const POP_CONFIRMATION_MESSAGE =
    "Changing the Period of Performance dates will alter the agreement’s Period of Performance. Some budget lines will need an updated Obligate By Date to fit within the new timeframe. Do you want to continue updating this services component?";

describe("ServicesComponents", () => {
    const mockSetShowModal = vi.fn();
    const mockHandleConfirm = vi.fn();

    const defaultHookReturn = {
        formData: initialFormData,
        modalProps: {
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: vi.fn()
        },
        servicesComponents: [],
        setFormData: vi.fn(),
        setShowModal: mockSetShowModal,
        showModal: false,
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        handleCancel: vi.fn(),
        setFormDataById: vi.fn(),
        servicesComponentsNumbers: [],
        formKey: "test-key"
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useServicesComponents.mockReturnValue(defaultHookReturn);
    });

    const defaultProps = {
        serviceRequirementType: "SEVERABLE",
        agreementId: 1,
        continueBtnText: "Continue",
        workflow: "agreement",
        setHasUnsavedChanges: vi.fn(),
        hasUnsavedChanges: false
    };

    it("does not render the confirmation modal when showModal is false", () => {
        render(<ServicesComponents {...defaultProps} />);

        expect(screen.queryByText(POP_CONFIRMATION_MESSAGE)).not.toBeInTheDocument();
    });

    it("renders the PoP confirmation modal with the exact message and buttons when showModal is true", () => {
        useServicesComponents.mockReturnValue({
            ...defaultHookReturn,
            showModal: true,
            modalProps: {
                heading: POP_CONFIRMATION_MESSAGE,
                actionButtonText: "Continue with Updates",
                secondaryButtonText: "Cancel",
                handleConfirm: mockHandleConfirm
            }
        });

        render(<ServicesComponents {...defaultProps} />);

        expect(screen.getByText(POP_CONFIRMATION_MESSAGE)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Continue with Updates" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("calls handleConfirm when 'Continue with Updates' is clicked", async () => {
        const user = userEvent.setup();
        useServicesComponents.mockReturnValue({
            ...defaultHookReturn,
            showModal: true,
            modalProps: {
                heading: POP_CONFIRMATION_MESSAGE,
                actionButtonText: "Continue with Updates",
                secondaryButtonText: "Cancel",
                handleConfirm: mockHandleConfirm
            }
        });

        render(<ServicesComponents {...defaultProps} />);

        await user.click(screen.getByRole("button", { name: "Continue with Updates" }));

        expect(mockHandleConfirm).toHaveBeenCalledTimes(1);
        expect(mockSetShowModal).toHaveBeenCalledWith(false);
    });

    it("does not call handleConfirm and just hides the modal when 'Cancel' is clicked", async () => {
        const user = userEvent.setup();
        useServicesComponents.mockReturnValue({
            ...defaultHookReturn,
            showModal: true,
            modalProps: {
                heading: POP_CONFIRMATION_MESSAGE,
                actionButtonText: "Continue with Updates",
                secondaryButtonText: "Cancel",
                handleConfirm: mockHandleConfirm
            }
        });

        render(<ServicesComponents {...defaultProps} />);

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(mockHandleConfirm).not.toHaveBeenCalled();
        expect(mockSetShowModal).toHaveBeenCalledWith(false);
    });
});
