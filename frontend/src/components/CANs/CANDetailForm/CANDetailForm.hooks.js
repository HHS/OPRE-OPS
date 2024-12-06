import React from "react";
import { useUpdateCanMutation } from "../../../api/opsAPI";
import suite from "./suite.js";
import classnames from "vest/classnames";

export default function useCanDetailForm(canId, canNumber, canNickname, canDescription, portfolioId, toggleEditMode) {
    const [nickName, setNickName] = React.useState(canNickname);
    const [description, setDescription] = React.useState(canDescription);
    const [updateCan] = useUpdateCanMutation();

    let res = suite.get();

    const cn = classnames(suite.get(), {
        invalid: "usa-form-group--error",
        valid: "success",
        warning: "warning"
    });

    const handleCancel = (e) => {
        e.preventDefault();
        cleanUp();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            number: canNumber,
            portfolio_id: portfolioId,
            nick_name: nickName,
            description: description
        };

        updateCan({
            id: canId,
            data: payload
        });

        cleanUp();
    };

    const cleanUp = () => {
        setNickName("");
        setDescription("");
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
        cn
    };
}
