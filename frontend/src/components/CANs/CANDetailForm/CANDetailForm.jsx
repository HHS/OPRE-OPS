import Input from "../../UI/Form/Input";
import TextArea from "../../UI/Form/TextArea";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import useCanDetailForm from "./CANDetailForm.hooks";

/**
 * @typedef {Object} CANDetailFormProps
 * @property {number} canId - CAN ID
 * @property {string} canNumber - CAN number
 * @property {string} canNickname - CAN nick name
 * @property {string} canDescription - CAN description
 * @property {number} portfolioId - Portfolio ID
 * @property {Function} toggleEditMode - Function to toggle edit mode
 */

/**
 * @component - The CAN Details form
 * @param {CANDetailFormProps} props
 * @returns {JSX.Element}
 */
const CANDetailForm = ({ canId, canNumber, canNickname, canDescription, portfolioId, toggleEditMode }) => {
    const {
        nickName,
        setNickName,
        description,
        setDescription,
        handleCancel,
        handleSubmit,
        runValidate,
        res,
        cn,
        showModal,
        setShowModal,
        modalProps
    } = useCanDetailForm(canId, canNumber, canNickname, canDescription, portfolioId, toggleEditMode);

    return (
        <form
            onSubmit={(e) => {
                handleSubmit(e);
            }}
        >
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <Input
                name="can-nickName"
                label="CAN Nickname"
                onChange={(name, value) => {
                    runValidate("can-nickName", value);
                    setNickName(value);
                }}
                value={nickName}
                isRequired
                messages={res.getErrors("can-nickName")}
                className={cn("can-nickName")}
            />
            <TextArea
                maxLength={1000}
                name="description"
                label="Description"
                value={description}
                onChange={(name, value) => {
                    setDescription(value);
                }}
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="cancel-button"
                    onClick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
                <button
                    id="save-changes"
                    className="usa-button"
                    disabled={nickName.length == 0 || res.hasErrors()}
                    data-cy="save-btn"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
};

export default CANDetailForm;
