import PropTypes from "prop-types";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * GoBackButton is a component that displays a button with an arrow icon and text.
 * When clicked, it triggers the handleGoBack function.
 *
 * @component
 * @param {Object} props - The properties passed to this component.
 * @param {function} [props.handleGoBack=() => {}] - The function to execute when the button is clicked.
 * @param {string} [props.buttonText="Back"] - The text to display on the button.
 * @param {Object} [props.rest] - Any additional props to pass to the button. optional
 * @returns {JSX.Element} The rendered GoBackButton component.
 */
function GoBackButton({ handleGoBack = () => {}, buttonText = "Back", ...rest }) {
    return (
        <button
            className="usa-button usa-button--unstyled margin-right-2"
            data-cy="back-button"
            onClick={handleGoBack}
            {...rest}
        >
            <FontAwesomeIcon
                icon={faArrowLeft}
                className="margin-right-1 cursor-pointer"
            />
            {buttonText}
        </button>
    );
}
GoBackButton.propTypes = {
    handleGoBack: PropTypes.func,
    buttonText: PropTypes.string
};
export default GoBackButton;
