import PropTypes from "prop-types";

/**
 * Renders the header for the form.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading text.
 * @param {string}[ props.details] - The details text.
 * @returns {JSX.Element} The rendered component.
 */
function FormHeader({ heading, details }) {
    return (
        <>
            <h2 className="font-sans-lg">{heading}</h2>
            {details && <p>{details}</p>}
        </>
    );
}

FormHeader.propTypes = {
    heading: PropTypes.string.isRequired,
    details: PropTypes.string
};
export default FormHeader;
