import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import DebugCode from "../../DebugCode";
import ReviewCard from "../ReviewCard";

function ChangeRequestsList() {
    const {
        data: changeRequests,
        isLoading: loadingChangeRequests,
        isError: errorChangeRequests
    } = useGetChangeRequestsListQuery({ refetchOnMountOrArgChange: true });
    if (loadingChangeRequests) {
        return <h1>Loading...</h1>;
    }
    if (errorChangeRequests) {
        return <h1>Oops, an error occurred</h1>;
    }

    return changeRequests.length > 0 ? (
        <>
            {changeRequests.map((changeRequest) => (
                <ReviewCard
                    key={changeRequest.id}
                    type={changeRequest.type}
                    agreementId={changeRequest.agreement_id}
                    actionIcons={true}
                    requestDate={changeRequest.created_on}
                    requesterName={changeRequest.created_by_user?.full_name}
                />
            ))}
            <DebugCode data={changeRequests} />
        </>
    ) : (
        <p>There are currently no changes for review</p>
    );
}

export default ChangeRequestsList;
