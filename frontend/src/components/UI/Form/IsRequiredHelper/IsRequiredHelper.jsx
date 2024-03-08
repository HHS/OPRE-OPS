import PropTypes from "prop-types";
/**
 * Renders a hint indicating if the information is required.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {boolean} props.isRequired - Indicates if the information is required.
 * @returns {JSX.Element | null} - The rendered component.
 */
const IsRequiredHelper = ({ isRequired = false }) => {
    if (isRequired) {
        return <div className="usa-hint">Required Information*</div>;
    }
    return null;
};

IsRequiredHelper.propTypes = {
    isRequired: PropTypes.bool
};
export default IsRequiredHelper;
