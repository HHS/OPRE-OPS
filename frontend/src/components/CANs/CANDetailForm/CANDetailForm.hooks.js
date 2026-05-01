import React from "react";
import { useBlocker } from "react-router-dom";
import classnames from "vest/classnames";
import { useUpdateCanMutation } from "../../../api/opsAPI";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
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
    const [showBlockerModal, setShowBlockerModal] = React.useState(false);
    const [blockerModalProps, setBlockerModalProps] = React.useState({});
    const [isCancelling, setIsCancelling] = React.useState(false);
    const [updateCan] = useUpdateCanMutation();
    const { setAlert } = useAlert();

    const hasChanged = nickName !== canNickname || description !== canDescription;

    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isCancelling && hasChanged && currentLocation.pathname !== nextLocation.pathname
    );

    const saveChanges = React.useCallback(async () => {
        const payload = {
            number: canNumber,
            portfolio_id: portfolioId,
            nick_name: nickName,
            description: description
        };

        setAlert({
            type: "success",
            heading: "CAN Updated",
            message: `The CAN ${canNumber} has been successfully updated.`
        });

        await updateCan({
            id: canId,
            data: payload
        });
    }, [canId, canNumber, portfolioId, nickName, description, updateCan, setAlert]);

    const saveChangesRef = React.useRef(saveChanges);
    React.useEffect(() => {
        saveChangesRef.current = saveChanges;
    }, [saveChanges]);

    const toggleEditModeRef = React.useRef(toggleEditMode);
    React.useEffect(() => {
        toggleEditModeRef.current = toggleEditMode;
    }, [toggleEditMode]);

    const blockerRef = React.useRef(blocker);
    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    const proceedIfBlocked = async () => {
        const currentBlocker = blockerRef.current;
        if (!currentBlocker || currentBlocker.state !== "blocked") {
            return;
        }
        try {
            await currentBlocker.proceed();
        } catch (error) {
            const message = error && typeof error.message === "string" ? error.message.trim() : "";
            if (message.startsWith("Invalid blocker state transition")) {
                console.warn("Ignored known React Router blocker exception:", message);
                return;
            }
            throw error;
        }
    };

    React.useEffect(() => {
        if (blocker.state === "blocked") {
            setShowBlockerModal(true);
            setBlockerModalProps({
                heading: "You have unsaved changes",
                description: "Do you want to save your changes before leaving this page?",
                actionButtonText: "Save Changes",
                secondaryButtonText: "Leave without saving",
                handleConfirm: async () => {
                    try {
                        await saveChangesRef.current();
                        setShowBlockerModal(false);
                        toggleEditModeRef.current();
                        await proceedIfBlocked();
                    } catch (error) {
                        console.error(error);
                        blocker.reset();
                    }
                },
                handleSecondary: async () => {
                    setShowBlockerModal(false);
                    toggleEditModeRef.current();
                    await proceedIfBlocked();
                },
                closeModal: () => {
                    setShowBlockerModal(false);
                    blocker.reset();
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocker.state]);

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
