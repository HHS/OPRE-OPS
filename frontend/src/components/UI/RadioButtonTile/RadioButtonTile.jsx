import React from "react";
import PropTypes from "prop-types";

/**
 * A radio button component that displays a tile with a label and optional description.
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.label - The label to display for the radio button.
 * @param {string} [props.description] - An optional description to display below the label.
 * @param {boolean} [props.checked=false] - Whether the radio button should be checked by default.
 * @param {function} props.setValue - A function to call when the radio button is selected.
 * @param {Object} [props.rest] - Any other props to pass to the radio button.
 * @returns {JSX.Element} - The radio button tile component.
 */
const RadioButtonTile = ({ label, description, checked = false, setValue = () => {}, ...rest }) => {
    const uniqueId = React.useId();
    return (
        <div
            key={`usa-radio-${uniqueId}`}
            className="usa-radio"
            // @ts-ignore
            data-cy={`div-${rest["data-cy"]}`}
        >
            <input
                {...rest}
                type="radio"
                name="option"
                className="usa-radio__input usa-radio__input--tile"
                id={label}
                value={label}
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
    setValue: PropTypes.func.isRequired,
    rest: PropTypes.object
};

export default RadioButtonTile;
