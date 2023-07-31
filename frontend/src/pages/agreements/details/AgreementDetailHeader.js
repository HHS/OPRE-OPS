import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} props.details - The details to display.
 * @param {number} props.agreementId - The ID of the agreement.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementDetailHeader = ({ heading, details, agreementId }) => {
    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">{heading}</h2>
                <Link to={`/agreements/${agreementId}/details/edit`}>
                    <FontAwesomeIcon
                        icon={faPen}
                        className="text-primary height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                        title="edit"
                        data-position="top"
                    />
                    <span className="text-primary">Edit</span>
                </Link>
            </div>
            <p className="font-sans-sm">{details}</p>
        </>
    );
};

AgreementDetailHeader.propTypes = {
    heading: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    agreementId: PropTypes.number.isRequired,
};

export default AgreementDetailHeader;
