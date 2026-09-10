import PropTypes from "prop-types";

/**
 * Renders the header for the form.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading text.
 * @param {string}[ props.details] - The details text.
 * @param {React.ReactNode} [props.actions] - Optional content (e.g. an edit-mode indicator) rendered
 *   alongside the heading, aligned to it rather than to the full heading+details block.
 * @returns {JSX.Element} The rendered component.
 */
function FormHeader({ heading, details, actions }) {
    return (
        <>
            <div className="display-flex flex-align-center flex-justify">
                <h2 className="font-sans-lg">{heading}</h2>
                {actions && <div className="display-flex flex-align-center flex-no-wrap">{actions}</div>}
            </div>
            {details && <p>{details}</p>}
        </>
    );
}

FormHeader.propTypes = {
    heading: PropTypes.string.isRequired,
    details: PropTypes.string,
    actions: PropTypes.node
};
export default FormHeader;
