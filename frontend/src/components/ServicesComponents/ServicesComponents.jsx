import ConfirmationModal from "../UI/Modals/ConfirmationModal";
import ServicesComponentForm from "./ServicesComponentForm";
import useServicesComponents from "./ServicesComponents.hooks";
import ServicesComponentsList from "./ServicesComponentsList";

/**
 * ServicesComponents is a component that handles the display and functionality of service components.
 *
 * @component
 * @param {object} props
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} props.serviceRequirementType - The type of service requirement.
 * @param {number} props.agreementId - The ID of the agreement.
 * @param {boolean} [props.isEditMode] - Whether the component is in edit mode.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {"agreement" | "none"} props.workflow - The workflow type.

 * @returns {React.ReactElement}
 *
 * @example
 *  <ServicesComponents serviceRequirementType="SEVERABLE" agreementId={123} />
 */
const ServicesComponents = ({
    serviceRequirementType,
    agreementId,
    isEditMode = false,
    continueBtnText,
    workflow,
    setHasUnsavedChanges,
    hasUnsavedChanges
}) => {
    const {
        formData,
        modalProps,
        servicesComponents,
        setFormData,
        setShowModal,
        showModal,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById,
        servicesComponentsNumbers,
        formKey
    } = useServicesComponents(agreementId, serviceRequirementType, continueBtnText, setHasUnsavedChanges);

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            <ServicesComponentForm
                serviceTypeReq={serviceRequirementType}
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                servicesComponentsNumbers={servicesComponentsNumbers}
                isEditMode={isEditMode}
                formKey={formKey}
                hasUnsavedChanges={hasUnsavedChanges}
                workflow={workflow}
            />

            <ServicesComponentsList
                servicesComponents={servicesComponents}
                setFormDataById={setFormDataById}
                handleDelete={handleDelete}
            />
        </>
    );
};

export default ServicesComponents;
