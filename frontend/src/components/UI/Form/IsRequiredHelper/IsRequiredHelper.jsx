/**
 * Renders a hint indicating if the information is required.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {boolean} [props.isRequired] - Indicates if the information is required.
 * @param {boolean} [props.isRequiredNoShow] - Indicates if the information is required but should not show.
 * @returns {JSX.Element | null} - The rendered component.
 */
const IsRequiredHelper = ({ isRequired = false, isRequiredNoShow = false }) => {
    if (isRequiredNoShow) {
        return null;
    }
    if (isRequired) {
        return <div className="usa-hint">Required Information*</div>;
    }

    return null;
};

export default IsRequiredHelper;
