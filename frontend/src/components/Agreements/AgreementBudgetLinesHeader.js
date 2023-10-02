import PropTypes from "prop-types";
import { faToggleOn, faToggleOff } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * Agreement detail header.
 * @param {Object} props - The component props.
 * @param {string} props.heading - The heading to display.
 * @param {string} props.details - The details to display.
 * @param {boolean} props.includeDrafts - Whether the edit mode is on.
 * @param {function} props.setIncludeDrafts - The function to set the edit mode.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementDetailHeader = ({ heading, details, includeDrafts, setIncludeDrafts }) => {
    return (
        <>
            <div className="display-flex flex-justify flex-align-center">
                <h2 className="font-sans-lg">{heading}</h2>
                <button
                    id="toggleDraftBLIs"
                    className="hover:text-underline cursor-pointer"
                    onClick={() => setIncludeDrafts(!includeDrafts)}
                >
                    <FontAwesomeIcon
                        icon={includeDrafts ? faToggleOn : faToggleOff}
                        size="xl"
                        className={`margin-right-1 cursor-pointer ${includeDrafts ? "text-primary" : "text-base"}`}
                        title={includeDrafts ? "On (Drafts included)" : "Off (Drafts excluded)"}
                    />
                    <span className="text-ink">Include Drafts</span>
                </button>
            </div>
            {details && <p className="font-sans-sm">{details}</p>}
        </>
    );
};

AgreementDetailHeader.propTypes = {
    heading: PropTypes.string.isRequired,
    details: PropTypes.string.isRequired,
    includeDrafts: PropTypes.bool.isRequired,
    setIncludeDrafts: PropTypes.func.isRequired
};

export default AgreementDetailHeader;
