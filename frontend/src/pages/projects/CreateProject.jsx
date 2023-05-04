import { useState } from "react";
import App from "../../App";
import { useNavigate } from "react-router-dom";
import ProjectTypeSelect from "./ProjectTypeSelect";
import { useAddResearchProjectsMutation } from "../../api/opsAPI";
import Alert from "../../components/UI/Alert/Alert";
import { Modal } from "../../components/UI/Modal/Modal";

export const CreateProject = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});

    const [selectedProjectType, setSelectedProjectType] = useState("");
    const [projectShortTitle, setProjectShortTitle] = useState("");
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [project, setProject] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [alertProps, setAlertProps] = useState({});

    const navigate = useNavigate();

    const [addResearchProject] = useAddResearchProjectsMutation();

    const onChangeProjectTypeSelection = (projectType) => {
        if (projectType === "0") {
            setSelectedProjectType(null);
            return;
        }

        setSelectedProjectType(projectType);
    };

    const handleClearingForm = () => {
        setSelectedProjectType("");
        setProjectShortTitle("");
        setProjectTitle("");
        setProjectDescription("");
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

    const handleCreateProject = async () => {
        if (projectShortTitle) {
            setProject({ ...project, short_title: projectShortTitle });
        }
        if (projectTitle) {
            setProject({ ...project, title: projectTitle });
        }
        if (projectDescription) {
            setProject({ ...project, description: projectDescription });
        }

        try {
            const results = await addResearchProject(project);
            const newProjectId = results.id;
            console.log(`New Project Created: ${newProjectId}`);
            handleClearingForm();
            showAlert("success", "New Project Created!", "The project has been successfully created.");
        } catch (error) {
            console.log("Error Submitting Project");
            console.dir(error);
        }
    };

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
                onChangeProjectTypeSelection={onChangeProjectTypeSelection}
            />

            <h2 className="font-sans-lg">Project Details</h2>

            <label className="usa-label" htmlFor="project-abbr">
                Project Nickname or Acronym
            </label>
            <input
                className="usa-input"
                id="project-abbr"
                name="project-abbr"
                type="text"
                value={projectShortTitle || ""}
                onChange={(e) => setProjectShortTitle(e.target.value)}
                required
            />

            <label className="usa-label" htmlFor="project-name">
                Project Title
            </label>
            <input
                className="usa-input"
                id="project-name"
                name="project-name"
                type="text"
                value={projectTitle || ""}
                onChange={(e) => setProjectTitle(e.target.value)}
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
                name="project-description"
                rows="5"
                style={{ height: "7rem" }}
                value={projectDescription || ""}
                onChange={(e) => setProjectDescription(e.target.value)}
            ></textarea>

            <div className="grid-row flex-justify-end margin-top-8">
                <button id="cancel" className="usa-button usa-button--unstyled margin-right-2" onClick={handleCancel}>
                    Cancel
                </button>
                <button id="submit" className="usa-button" onClick={handleCreateProject}>
                    Create Project
                </button>
            </div>
        </App>
    );
};
