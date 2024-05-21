import PropTypes from "prop-types";
import SimpleAlert from "./SimpleAlert";

/**
 * Alert for when there are agreement changes in review.
 * @component
 * @param {Object} props - The component props.
 * @param {string[]} props.changeRequests - The change requests.
 * @returns {JSX.Element} - The rendered component.
 */
function AgreementChangesAlert({ changeRequests }) {
    return (
        <SimpleAlert
            type="warning"
            heading="Agreement Edits In Review"
            message="There are edits pending approval from your Division Director. After they are approved, they will update on the Agreement."
        >
            {changeRequests && changeRequests.length > 0 && (
                <>
                    <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Pending Edits:</h2>
                    <ul className="margin-0 font-sans-sm">
                        {changeRequests?.map((changeRequest) => (
                            <li key={changeRequest}>{changeRequest}</li>
                        ))}
                    </ul>
                </>
            )}
        </SimpleAlert>
    );
}

AgreementChangesAlert.propTypes = {
    changeRequests: PropTypes.arrayOf(PropTypes.string)
};
export default AgreementChangesAlert;
