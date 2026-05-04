import React from "react";
import classnames from "vest/classnames";
import { useUpdateCanMutation } from "../../../api/opsAPI";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
import useNavigationBlocker from "../../../hooks/useNavigationBlocker.hooks";
import suite from "./suite.js";
/**
 * @description - Custom hook for the CAN Detail Form.
 * @param {number} canId
 * @param {string} canNumber
 * @param {string} canNickname
 * @param {string} canDescription
 * @param {number} portfolioId
 * @param {Function} toggleEditMode
 */
export default function useCanDetailForm(canId, canNumber, canNickname, canDescription, portfolioId, toggleEditMode) {
    const [nickName, setNickName] = React.useState(canNickname);
    const [description, setDescription] = React.useState(canDescription);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [updateCan] = useUpdateCanMutation();
    const { setAlert } = useAlert();

    const hasChanged = nickName !== canNickname || description !== canDescription;

    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    const saveChanges = React.useCallback(async () => {
        const payload = {
            number: canNumber,
            portfolio_id: portfolioId,
            nick_name: nickName,
            description: description
        };

        await updateCan({
            id: canId,
            data: payload
        }).unwrap();

        setAlert({
            type: "success",
            heading: "CAN Updated",
            message: `The CAN ${canNumber} has been successfully updated.`
        });
    }, [canId, canNumber, portfolioId, nickName, description, updateCan, setAlert]);

    // No wasEditModeRef needed: this component unmounts when edit mode toggles off,
    // so isCancelling resets naturally on remount.
    const { showBlockerModal, setShowBlockerModal, blockerModalProps, setIsCancelling } = useNavigationBlocker({
        hasChanged,
        saveChanges,
        onExit: toggleEditMode,
        onSaveError: () => {
            setAlert({
                type: "error",
                heading: "Error",
                message: "An error occurred while updating the CAN.",
                redirectUrl: "/error"
            });
        }
    });

    const handleCancel = (e) => {
        e.preventDefault();
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel editing? Your changes will not be saved.",
            actionButtonText: "Cancel Edits",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                setIsCancelling(true);
                cleanUp();
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await saveChanges();
        cleanUp();
    };

    const cleanUp = () => {
        setNickName("");
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
        nickName,
        setNickName,
        description,
        setDescription,
        handleCancel,
        handleSubmit,
        runValidate,
        res,
        cn,
        setShowModal,
        showModal,
        modalProps,
        showBlockerModal,
        setShowBlockerModal,
        blockerModalProps
    };
}
