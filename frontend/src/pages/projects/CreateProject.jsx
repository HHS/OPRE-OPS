import { useState } from "react";
import { useNavigate } from "react-router-dom";
import App from "../../App";
import ProjectTypeSelect from "../../components/UI/Form/ProjectTypeSelect/ProjectTypeSelect";
import { useAddResearchProjectsMutation } from "../../api/opsAPI";
import Alert from "../../components/UI/Alert/Alert";
import { Modal } from "../../components/UI/Modal/Modal";
import Input from "../../components/UI/Form/Input";
import TextArea from "../../components/UI/Form/TextArea";
import suite from "./suite";
import classnames from "vest/classnames";

export const CreateProject = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalProps, setModalProps] = useState({});
    const [project, setProject] = useState({});
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [alertProps, setAlertProps] = useState({});

    let res = suite.get();
    const navigate = useNavigate();

    const [addResearchProject, { isSuccess, isError, error, reset, data: rpData }] = useAddResearchProjectsMutation();

    const handleClearingForm = () => {
        setProject({});
    };

    const handleChange = (currentField, value) => {
        const nextState = { ...project, [currentField]: value };
        setProject(nextState);
        suite(nextState, currentField);
    };

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning",
    });

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
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel? Your project will not be saved.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Editing",
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
                    <p>Fill out this form to create a new project.</p>
                </>
            )}

            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    secondaryButtonText={modalProps.secondaryButtonText}
                />
            )}
            <h2 className="font-sans-lg margin-top-7">Select the Project Type</h2>
            <p>Select the type of project you’d like to create.</p>
            <ProjectTypeSelect
                name="type"
                label="Project Type"
                onChange={handleChange}
                messages={res.getErrors("type")}
            />

            <h2 className="font-sans-lg">Project Details</h2>

            <Input
                name="nickname"
                label="Project Nickname or Acronym"
                onChange={handleChange}
                messages={res.getErrors("nickname")}
                className={cn("nickname")}
            />

            <Input
                name="title"
                label="Project Title"
                onChange={handleChange}
                messages={res.getErrors("title")}
                className={cn("title")}
            />

            <TextArea
                name="description"
                label="Description"
                onChange={handleChange}
                hintMsg="Brief Description for internal purposes, not for the OPRE website."
                messages={res.getErrors("description")}
                className={cn("description")}
            />

            <div className="grid-row flex-justify-end margin-top-8">
                <button id="cancel" className="usa-button usa-button--unstyled margin-right-2" onClick={handleCancel}>
                    Cancel
                </button>
                <button
                    id="submit"
                    className="usa-button"
                    onClick={() => addResearchProject(project)}
                    disabled={!res.isValid()}
                >
                    Create Project
                </button>
            </div>
        </App>
    );
};
