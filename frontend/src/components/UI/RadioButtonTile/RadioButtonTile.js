import React from "react";
import PropTypes from "prop-types";

/**
 * A radio button component that displays a tile with a label and optional description.
 * @param {Object} props - The component props.
 * @param {string} props.label - The label to display for the radio button.
 * @param {string} [props.description] - An optional description to display below the label.
 * @param {boolean} [props.checked=false] - Whether the radio button should be checked by default.
 * @param {Object} [props.rest] - Any other props to pass to the radio button.
 * @returns {React.JSX.Element} - The radio button tile component.
 */
const RadioButtonTile = ({ label, description, checked = false, ...rest }) => {
    const [value, setValue] = React.useState("");
    const uniqueId = React.useId();
    return (
        <div
            key={`usa-radio-${uniqueId}`}
            className="usa-radio"
        >
            <input
                {...rest}
                className="usa-radio__input usa-radio__input--tile"
                id={label}
                type="radio"
                name="option"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                defaultChecked={checked}
            />
            <label
                className="usa-radio__label"
                htmlFor={label}
            >
                {label}
                {description && <span className="usa-checkbox__label-description">{description}</span>}
            </label>
        </div>
    );
};
RadioButtonTile.propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    checked: PropTypes.bool,
    rest: PropTypes.object
};

export default RadioButtonTile;
