import { useGetChangeRequestsListQuery } from "../../../api/opsAPI";
import DebugCode from "../../DebugCode";

function ChangeRequestsList() {
    const {
        data: changeRequestsData,
        isLoading: loadingChangeRequests,
        isError: errorChangeRequests
    } = useGetChangeRequestsListQuery({ refetchOnMountOrArgChange: true });
    if (loadingChangeRequests) {
        return <h1>Loading...</h1>;
    }
    if (errorChangeRequests) {
        return <h1>Oops, an error occurred</h1>;
    }

    return changeRequestsData.length > 0 ? (
        <DebugCode data={changeRequestsData} />
    ) : (
        <p>There are currently no changes for review</p>
    );
}

export default ChangeRequestsList;
