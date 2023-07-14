import { useSelector } from "react-redux";
import { useGetAgreementsByUserIdQuery, useGetAgreementsQuery, useGetUserByOIDCIdQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import sortAgreements from "./utils";
import { useEffect } from "react";
import Alert from "../../../components/UI/Alert";
import "./AgreementsList.scss";
import AgreementsTable from "./AgreementsTable";
import AgreementsFilterHeaderSection from "./AgreementsFilterHeaderSection";

export const AgreementsList = ({ filter }) => {
    const isAlertActive = useSelector((state) => state.alert.isActive);
    const activeUser = useSelector((state) => state.auth.activeUser);

    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        refetch,
    } = useGetAgreementsByUserIdQuery(filter === "my-agreements" ? activeUser?.id : null, {
        refetchOnMountOrArgChange: true,
    });

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
            <AgreementsFilterHeaderSection />
            <AgreementsTable agreements={sortedAgreements} />
        </App>
    );
};
