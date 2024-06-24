import { useReviewChangeRequestMutation } from "../../api/opsAPI";

const useChangeRequest = () => {
    const [reviewCR] = useReviewChangeRequestMutation();
    /**
     * @param {number} id - The ID of the change request.
     * @param {string} action - The action to be performed. Either "APPROVE" or "REJECT".
     * @param {string} notes - The reviewer notes.
     * @returns {void} - The result of the mutation.
     */
    const handleReviewChangeRequest = (id, action, notes) => {
        const payload = {
            change_request_id: id,
            action,
            reviewer_notes: notes
        };

        reviewCR(payload)
            .unwrap()
            .then((fulfilled) => {
                console.log("Review Change Request:", fulfilled);
            })
            .catch((rejected) => {
                console.error("Error Reviewing Change Request:", rejected);
            });
    };
    return {
        handleReviewChangeRequest
    };
};

export default useChangeRequest;
