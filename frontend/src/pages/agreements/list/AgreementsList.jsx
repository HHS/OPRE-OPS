import { useDispatch } from "react-redux";
import "./AgreementsList.scss";
import { useGetAgreementsQuery } from "../../../api/agreementSlice";
import App from "../../../App";
import { AgreementTableRow } from "./AgreementTableRow";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";

export const AgreementsList = () => {
    const dispatch = useDispatch();
    // const agreements = useSelector((state) => state.globalState.agreements);
    const { data: agreements, error: errorAgreement, isLoading: isLoadingAgreement } = useGetAgreementsQuery();
    // const agreements = agreementsIsLoading ? null : agreementsData;
    // const sortedAgreements = agreements
    //     .slice()
    //     .sort((a, b) => Date.parse(a.created_on) - Date.parse(b.created_on))
    //     .reverse();

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occured</div>;
    }

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
                    {agreements?.map((agreement) => (
                        <AgreementTableRow key={agreement?.id} agreement={agreement} />
                    ))}
                </tbody>
            </table>
        </App>
    );
};
