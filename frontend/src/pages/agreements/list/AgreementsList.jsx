import "./AgreementsList.scss";
import { useGetAgreementsQuery } from "../../../api/agreementSlice";
import App from "../../../App";
import { AgreementTableRow } from "./AgreementTableRow";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";

export const AgreementsList = () => {
    const { data: agreements, error: errorAgreement, isLoading: isLoadingAgreement } = useGetAgreementsQuery();

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occured</div>;
    }

    const sortedAgreements = agreements
        .slice()
        .sort(
            (a, b) =>
                a.budget_line_items.reduce((n, { date_needed }) => (n < date_needed ? n : date_needed), 0) -
                b.budget_line_items.reduce((n, { date_needed }) => (n < date_needed ? n : date_needed), 0)
        );

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
                        <th scope="col">Agreement Total</th>
                        <th scope="col">Next Need By</th>
                        <th scope="col" className="padding-0" style={{ width: "6.25rem" }}>
                            Status
                        </th>
                    </tr>
                </thead>
                {console.log("agreements", agreements)}
                <tbody>
                    {sortedAgreements?.map((agreement) => (
                        <AgreementTableRow key={agreement?.id} agreement={agreement} />
                    ))}
                </tbody>
            </table>
        </App>
    );
};
