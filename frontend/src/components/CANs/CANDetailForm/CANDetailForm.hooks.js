import React from "react";
import classnames from "vest/classnames";
import { useUpdateCanMutation } from "../../../api/opsAPI";
import useAlert from "../../../hooks/use-alert.hooks";
import suite from "./suite.js";
/**
 * @description - Custom hook for the CAN Detail Form.
 * @param {number} canId
 * @param {string} canNumber
 * @param {string} canNickname
 * @param {string} canDescription
 * @param {number} portfolioId
 * @param {() => void} toggleEditMode
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

    const handleSubmit = (e) => {
        e.preventDefault();
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

        updateCan({
            id: canId,
            data: payload
        });

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
    };

    const runValidate = (name, value) => {
        suite(
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
        modalProps
    };
}
