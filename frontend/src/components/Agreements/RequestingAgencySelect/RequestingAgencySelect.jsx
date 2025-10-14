import { useGetAgreementAgenciesQuery } from "../../../api/opsAPI";
import DebugCode from "../../DebugCode";

const RequestingAgencySelect = () => {
    const { data, isLoading, isError } = useGetAgreementAgenciesQuery({ servicing: true });
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (isError) {
        console.error("Error loading agencies");
        return <div>Error loading agencies</div>;
    }

    return <DebugCode data={data} />;
};

export default RequestingAgencySelect;
