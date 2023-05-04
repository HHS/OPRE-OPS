import { useState } from "react";
import App from "../../App";
import { useNavigate } from "react-router-dom";
import ProjectTypeSelect from "../../components/ResearchProjects/ProjectTypeSelect/ProjectTypeSelect";
import { useAddResearchProjectsMutation } from "../../api/opsAPI";
import Alert from "../../components/UI/Alert/Alert";
import { Modal } from "../../components/UI/Modal/Modal";

export const CreateProject = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const [selectedProjectType, setSelectedProjectType] = useState("");
    const [project, setProject] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [alertProps, setAlertProps] = useState({});

    const navigate = useNavigate();

    const [addResearchProject, { isSuccess, isError, error, reset, data: rpData }] = useAddResearchProjectsMutation();

    const handleClearingForm = () => {
        setSelectedProjectType("");
        setProject({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProject((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const showAlert = async (type, heading, message) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        window.scrollTo(0, 0);
        setIsAlertActive(true);
        setAlertProps({ type, heading, message });

        await new Promise((resolve) => setTimeout(resolve, 6000));
        setIsAlertActive(false);
        setAlertProps({});
        navigate("/");
    };

    if (isError) {
        // TODO: Add error handling
        console.log("Error Submitting Project");
        console.dir(error);
    }

    if (isSuccess) {
        console.log(`New Project Created: ${rpData.id}`);
        handleClearingForm();
        reset();
        showAlert("success", "New Project Created!", "The project has been successfully created.");
    }

    const handleCancel = () => {
        // TODO: Add cancel stuff
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your project will not be saved.",
            actionButtonText: "Cancel",
            handleConfirm: () => {
                handleClearingForm();
                navigate("/");
            },
        });
    };

    return (
        <App>
            {isAlertActive ? (
                <Alert heading={alertProps.heading} type={alertProps.type} setIsAlertActive={setIsAlertActive}>
                    {alertProps.message}
                </Alert>
            ) : (
                <>
                    <h1 className="font-sans-lg">Create New Project</h1>

                    <h2 className="font-sans-lg">Select the Project Type</h2>
                    <p>Select the type of project you are creating.</p>
                </>
            )}

            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}

            <ProjectTypeSelect
                selectedProjectType={selectedProjectType}
                onChangeProjectTypeSelection={setSelectedProjectType}
            />

            <h2 className="font-sans-lg">Project Details</h2>

            <label className="usa-label" htmlFor="project-abbr">
                Project Nickname or Acronym
            </label>
            <input
                className="usa-input"
                id="project-abbr"
                name="short_title"
                type="text"
                value={project.short_title || ""}
                onChange={handleChange}
                required
            />

            <label className="usa-label" htmlFor="project-name">
                Project Title
            </label>
            <input
                className="usa-input"
                id="project-name"
                name="title"
                type="text"
                value={project.title || ""}
                onChange={handleChange}
                required
            />

            <label className="usa-label" htmlFor="project-description">
                Description
            </label>
            <span id="with-hint-textarea-hint" className="usa-hint">
                Brief Description for internal purposes, not for the OPRE website.
            </span>
            <textarea
                className="usa-textarea"
                id="project-description"
                name="description"
                rows="5"
                style={{ height: "7rem" }}
                value={project.description || ""}
                onChange={handleChange}
            ></textarea>

            <div className="grid-row flex-justify-end margin-top-8">
                <button id="cancel" className="usa-button usa-button--unstyled margin-right-2" onClick={handleCancel}>
                    Cancel
                </button>
                <button id="submit" className="usa-button" onClick={() => addResearchProject(project)}>
                    Create Project
                </button>
            </div>
        </App>
    );
};
