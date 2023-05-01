import "./AgreementsList.scss";
import { useGetAgreementsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import { AgreementTableRow } from "./AgreementTableRow";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import sortAgreements from "./utils";

export const AgreementsList = () => {
    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementsQuery({ refetchOnMountOrArgChange: true });

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occurred</div>;
    }

    const sortedAgreements = sortAgreements(agreements);

    return (
        <App>
            <Breadcrumb currentName={"Agreements"} />

            <h1 className="font-sans-lg">Agreements</h1>

            <table className="usa-table usa-table--borderless width-full ">
                <thead>
                    <tr>
                        <th scope="col">Agreement</th>
                        <th scope="col">Project</th>
                        <th scope="col">Type</th>
                        <th scope="col">Total</th>
                        <th scope="col">Need By</th>
                        <th scope="col" className="padding-0" style={{ width: "6.25rem" }}>
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedAgreements?.map((agreement) => (
                        <AgreementTableRow key={agreement?.id} agreement={agreement} />
                    ))}
                </tbody>
            </table>
        </App>
    );
};
