import React from "react";
import Input from "../../UI/Form/Input";
import TextArea from "../../UI/Form/TextArea";
import { useUpdateCanMutation } from "../../../api/opsAPI";
import suite from "./suite.js";
import classnames from "vest/classnames";

const CANDetailForm = ({ canId, number, portfolioId }) => {
    const [nickName, setNickName] = React.useState("");
    const [description, setDescription] = React.useState("");
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
            number: number,
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
    };

    const runValidate = (name, value) => {
        suite(
            {
                ...{ [name]: value }
            },
            name
        );
    };

    return (
        <form>
            <Input
                name="can_nick_name"
                label="CAN Nickname"
                onChange={(name, value) => {
                    runValidate("can_nick_name", value);
                    setNickName(value);
                }}
                value={nickName}
                isRequired
                messages={res.getErrors("can_nick_name")}
                className={cn("can_nick_name")}
            />
            <TextArea
                maxLength={1000}
                name="Description"
                label="Description"
                value={description}
                onChange={(name, value) => {
                    setDescription(value);
                }}
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="cancel-button"
                    onClick={(e) => handleCancel(e)}
                >
                    Cancel
                </button>
                <button
                    id="save-changes"
                    className="usa-button"
                    onClick={(e) => {
                        handleSubmit(e);
                    }}
                    disabled={nickName.length == 0 || res.hasErrors()}
                    data-cy="save-btn"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
};

export default CANDetailForm;
