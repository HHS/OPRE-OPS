import React from "react";
import classnames from "vest/classnames";
import { useUpdateProjectMutation } from "../../../api/opsAPI";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
import suite from "./suite.js";

/**
 * @param {number} projectId
 * @param {string} projectTitle
 * @param {string} projectShortTitle
 * @param {string} projectDescription
 * @param {Function} toggleEditMode
 */
export default function useProjectDetailForm(
    projectId,
    projectTitle,
    projectShortTitle,
    projectDescription,
    toggleEditMode
) {
    const [title, setTitle] = React.useState(projectTitle);
    const [shortTitle, setShortTitle] = React.useState(projectShortTitle);
    const [description, setDescription] = React.useState(projectDescription);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [updateProject] = useUpdateProjectMutation();
    const { setAlert } = useAlert();

    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    const handleCancel = (e) => {
        e.preventDefault();
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText: "Cancel Edits",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => cleanUp()
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title,
            short_title: shortTitle,
            description
        };

        try {
            await updateProject({ id: projectId, data: payload }).unwrap();
            setAlert({
                type: "success",
                heading: "Project Updated",
                message: "The project has been successfully updated."
            });
            cleanUp();
        } catch (err) {
            console.error("Error updating project:", err);
            setAlert({
                type: "error",
                heading: "Error Updating Project",
                message: "There was an error updating the project. Please try again."
            });
        }
    };

    const cleanUp = () => {
        setTitle("");
        setShortTitle("");
        setDescription("");
        setShowModal(false);
        setModalProps({
            heading: "",
            actionButtonText: "",
            secondaryButtonText: "",
            handleConfirm: () => {}
        });
        toggleEditMode();
        suite.reset();
        scrollToTop();
    };

    const runValidate = (name, value) => {
        suite.run(
            {
                ...{ [name]: value }
            },
            name
        );
    };

    return {
        title,
        setTitle,
        shortTitle,
        setShortTitle,
        description,
        setDescription,
        handleCancel,
        handleSubmit,
        runValidate,
        res,
        cn,
        setShowModal,
        showModal,
        modalProps
    };
}
