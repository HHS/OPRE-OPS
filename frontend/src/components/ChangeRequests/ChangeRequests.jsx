import ConfirmationModal from "../UI/Modals/ConfirmationModal";
import useChangeRequest from "./ChangeRequest.hooks";
import ChangeRequestsList from "./ChangeRequestsList";

function ChangeRequests() {
    const { modalProps, showModal, setShowModal, handleReviewChangeRequest } = useChangeRequest();

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    actionButtonText="Approve"
                    handleConfirm={modalProps.handleConfirm}
                    setShowModal={setShowModal}
                />
            )}
            <ChangeRequestsList handleReviewChangeRequest={handleReviewChangeRequest} />
        </>
    );
}

export default ChangeRequests;
