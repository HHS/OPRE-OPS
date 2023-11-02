import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faToggleOff, faToggleOn } from "@fortawesome/free-solid-svg-icons";

const ToggleButton = ({ handleToggle = () => {}, isToggleOn = true, btnText = "" }) => {
    const toggleId = React.useId();

    return (
        <button
            id={`toggle-button-${toggleId}`}
            className="hover:text-underline cursor-pointer"
            onClick={handleToggle}
        >
            <FontAwesomeIcon
                icon={isToggleOn ? faToggleOn : faToggleOff}
                size="2xl"
                className={`margin-right-1 cursor-pointer ${isToggleOn ? "text-primary" : "text-base"}`}
                title={isToggleOn ? "On (Drafts included)" : "Off (Drafts excluded)"}
            />
            <span className="text-primary">{btnText}</span>
        </button>
    );
};

export default ToggleButton;
