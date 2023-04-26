import { useState, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import CurrencyFormat from "react-currency-format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { faClock, faClone } from "@fortawesome/free-regular-svg-icons";
import Tag from "../../../components/UI/Tag/Tag";
import "./AgreementsList.scss";
import { useGetAgreementsQuery } from "../../../api/agreementSlice";
import App from "../../../App";
import { AgreementTableRow } from "./AgreementTableRow";

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
            <h1 className="font-sans-lg">Agreements</h1>
            <h2 className="font-sans-md">Test explaining this page.</h2>

            <table className="usa-table usa-table--borderless width-full">
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
