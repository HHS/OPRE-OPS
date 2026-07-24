import ConfirmationModal from "../UI/Modals/ConfirmationModal";
import GrantNumberForm from "./GrantNumberForm";
import useGrantNumbers from "./GrantNumbers.hooks";
import GrantNumbersList from "./GrantNumbersList";

/**
 * GrantNumbers is a component that handles the display and functionality of grant numbers.
 *
 * @component
 * @param {object} props
 * @param {number} props.agreementId - The ID of the agreement.
 * @param {boolean} [props.isEditMode] - Whether the component is in edit mode.
 * @param {boolean} [props.isReviewMode] - Whether the component is in review mode (single-page edit screen).
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {"agreement" | "none"} props.workflow - The workflow type.
 * @param {Function} props.setHasUnsavedChanges - Function to set unsaved changes state.
 * @param {boolean} props.hasUnsavedChanges - Whether there are unsaved changes.
 * @returns {React.ReactElement}
 *
 * @example
 *  <GrantNumbers agreementId={123} continueBtnText="Continue" workflow="agreement" />
 */
const GrantNumbers = ({
    agreementId,
    isEditMode = false,
    isReviewMode = false,
    continueBtnText,
    workflow,
    setHasUnsavedChanges,
    hasUnsavedChanges
}) => {
    const {
        formData,
        modalProps,
        grantNumbers,
        setFormData,
        setShowModal,
        showModal,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById,
        grantNumbersNumbers,
        formKey
    } = useGrantNumbers(agreementId, continueBtnText, setHasUnsavedChanges);

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

            <GrantNumberForm
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                grantNumbersNumbers={grantNumbersNumbers}
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                formKey={formKey}
                hasUnsavedChanges={hasUnsavedChanges}
                workflow={workflow}
            />

            <GrantNumbersList
                grantNumbers={grantNumbers}
                setFormDataById={setFormDataById}
                handleDelete={handleDelete}
            />
        </>
    );
};

export default GrantNumbers;
