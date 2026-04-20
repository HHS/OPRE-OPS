import Input from "../../UI/Form/Input";
import TextArea from "../../UI/Form/TextArea";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import ProjectTypeSelect from "../ProjectTypeSelect/ProjectTypeSelect";
import useProjectDetailForm from "./ProjectDetailForm.hooks";

/**
 * @typedef {Object} ProjectDetailFormProps
 * @property {number} projectId
 * @property {string} projectTitle
 * @property {string} projectShortTitle
 * @property {string} projectDescription
 * @property {string} projectType
 * @property {() => void} toggleEditMode
 */

/**
 * @component - The Project Details edit form
 * @param {ProjectDetailFormProps} props
 * @returns {React.ReactElement}
 */
const ProjectDetailForm = ({
    projectId,
    projectTitle,
    projectShortTitle,
    projectDescription,
    projectType,
    toggleEditMode
}) => {
    const {
        title,
        setTitle,
        shortTitle,
        setShortTitle,
        description,
        setDescription,
        type,
        setType,
        handleCancel,
        handleSubmit,
        runValidate,
        res,
        cn,
        showModal,
        setShowModal,
        modalProps,
        isSubmitting
    } = useProjectDetailForm(
        projectId,
        projectTitle,
        projectShortTitle,
        projectDescription,
        projectType,
        toggleEditMode
    );

    return (
        <form onSubmit={handleSubmit}>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <ProjectTypeSelect
                name="project_type"
                label="Project Type"
                onChange={(name, value) => {
                    setType(value);
                }}
                value={type}
            />
            <Input
                name="title"
                label="Project Title"
                onChange={(name, value) => {
                    runValidate("title", value);
                    setTitle(value);
                }}
                value={title}
                isRequired
                messages={res.getErrors("title")}
                className={cn("title")}
            />
            <Input
                name="short_title"
                label="Project Nickname"
                onChange={(name, value) => {
                    setShortTitle(value);
                }}
                value={shortTitle}
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
                    type="button"
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="cancel-button"
                    onClick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
                <button
                    id="save-changes"
                    className="usa-button"
                    disabled={title.length === 0 || res.hasErrors() || isSubmitting}
                    data-cy="save-btn"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
};

export default ProjectDetailForm;
