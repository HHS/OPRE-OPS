import { useState } from "react";
import { useNavigate } from "react-router-dom";
import App from "../../App";
import ProjectTypeSelect from "../../components/Projects/ProjectTypeSelect/ProjectTypeSelect";
import { useAddResearchProjectsMutation } from "../../api/opsAPI";
import Input from "../../components/UI/Form/Input";
import TextArea from "../../components/UI/Form/TextArea";
import suite from "./suite";
import classnames from "vest/classnames";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
import useAlert from "../../hooks/use-alert.hooks";

const CreateProject = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [project, setProject] = useState({
        project_type: "",
        short_title: "",
        title: "",
        description: ""
    });

    const [addResearchProject, { isSuccess, isError, error, reset, data: rpData }] = useAddResearchProjectsMutation();
    const { setAlert } = useAlert();

    let res = suite.get();
    const navigate = useNavigate();

    const handleClearingForm = () => {
        setProject({
            project_type: "",
            short_title: "",
            title: "",
            description: ""
        });
    };

    const handleChange = (currentField, value) => {
        const nextState = { ...project, [currentField]: value };
        setProject(nextState);
        suite(nextState, currentField);
    };

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    // prepare data for submission
    const editedProject = {
        ...project,
        project_type: project.project_type.toUpperCase()
    };

    if (isError) {
        console.log("Error Submitting Project");
        console.dir(error);
        setAlert({
            type: "error",
            heading: "Error Creating Project",
            message: "There was an error creating the project. Please try again.",
            redirectUrl: `/error`
        });
    }

    if (isSuccess) {
        console.log(`New Project Created: ${rpData.id}`);
        reset();
        handleClearingForm();
        // TODO: Once project list is implemented, redirect to the project list page
        setAlert({
            type: "success",
            heading: "New Project Created",
            message: "The project has been successfully created.",
            redirectUrl: `/`
        });
    }

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your project will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                handleClearingForm();
                navigate("/");
            }
        });
    };

    return (
        <App>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    secondaryButtonText={modalProps.secondaryButtonText}
                />
            )}
            <h1 className="font-sans-lg">Create New Project</h1>
            <p>Fill out this form to create a new project.</p>

            <h2 className="font-sans-lg margin-top-7">Select the Project Type</h2>
            <p>Select the type of project you’d like to create.</p>
            <ProjectTypeSelect
                name="project_type"
                label="Project Type"
                onChange={handleChange}
                value={project.project_type || ""}
                messages={res.getErrors("project_type")}
                className={cn("type")}
            />

            <h2 className="font-sans-lg">Project Details</h2>

            <Input
                name="title"
                label="Project Title"
                onChange={handleChange}
                messages={res.getErrors("title")}
                value={project.title || ""}
                className={cn("title")}
            />

            <Input
                name="short_title"
                label="Project Nickname or Acronym"
                onChange={handleChange}
                messages={res.getErrors("short_title")}
                value={project.short_title || ""}
                className={cn("short_title")}
            />

            <TextArea
                name="description"
                label="Description"
                onChange={handleChange}
                hintMsg="Brief description for internal purposes, not for the OPRE website."
                messages={res.getErrors("description")}
                value={project.description || ""}
                className={cn("description")}
            />

            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    id="cancel"
                    className="usa-button usa-button--unstyled margin-right-2"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                    id="submit"
                    className="usa-button"
                    onClick={() => addResearchProject(editedProject)}
                    disabled={!res.isValid()}
                >
                    Create Project
                </button>
            </div>
        </App>
    );
};

export default CreateProject;
