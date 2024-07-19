import PropTypes from "prop-types";
import SimpleAlert from "../../UI/Alert/SimpleAlert";

/**
 * Alert for when there are agreement changes in review.
 * @component
 * @param {Object} props - The component props.
 * @param {string[]} props.changeRequests - The change requests.
 * @param {boolean} props.isAlertVisible - Whether the alert is visible.
 * @param {Function} props.setIsAlertVisible - The function to set the alert visibility.
 * @returns {JSX.Element} - The rendered component.
 */
function AgreementChangesAlert({ changeRequests, isAlertVisible, setIsAlertVisible }) {
    return (
        <SimpleAlert
            type="warning"
            heading="Changes In Review"
            message="There are changes pending approval from your Division Director. After they are approved, they will update on the agreement."
            isClosable={true}
            setIsAlertVisible={setIsAlertVisible}
            isAlertVisible={isAlertVisible}
        >
            {changeRequests && changeRequests.length > 0 && (
                <>
                    <h2 className="margin-0 margin-top-3 font-sans-sm text-bold">Pending Changes:</h2>
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
    changeRequests: PropTypes.arrayOf(PropTypes.string),
    isAlertVisible: PropTypes.bool.isRequired,
    setIsAlertVisible: PropTypes.func.isRequired
};
export default AgreementChangesAlert;
