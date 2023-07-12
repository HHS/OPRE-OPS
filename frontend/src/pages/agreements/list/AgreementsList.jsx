import { useSelector } from "react-redux";
import { useGetAgreementsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import { AgreementTableRow } from "./AgreementTableRow";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import sortAgreements from "./utils";
import { useEffect } from "react";
import Alert from "../../../components/UI/Alert";
import "./AgreementsList.scss";

export const AgreementsList = () => {
    const isAlertActive = useSelector((state) => state.alert.isActive);
    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        refetch,
    } = useGetAgreementsQuery({ refetchOnMountOrArgChange: true });

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoadingAgreement) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (errorAgreement) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }

    const sortedAgreements = sortAgreements(agreements);

    return (
        <App>
            <Breadcrumb currentName={"Agreements"} />
            {isAlertActive && <Alert />}

            <h1 className="font-sans-lg">Agreements</h1>
            <p>This is a list of the agreements you are listed as a Team Member on.</p>
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
