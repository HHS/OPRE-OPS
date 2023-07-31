import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useGetAgreementsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import sortAgreements from "./utils";
import Alert from "../../../components/UI/Alert";
import "./AgreementsList.scss";
import AgreementsTable from "./AgreementsTable";
import AgreementsFilterHeaderSection from "./AgreementsFilterHeaderSection";

/**
 *  Agreements list page.
 * @returns {React.JSX.Element} - The rendered component.
 */
export const AgreementsList = () => {
    const [searchParams] = useSearchParams();
    const isAlertActive = useSelector((state) => state.alert.isActive);

    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementsQuery({ refetchOnMountOrArgChange: true });

    const activeUser = useSelector((state) => state.auth.activeUser);

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

    let sortedAgreements;
    if (searchParams.get("filter") === "my-agreements") {
        const filteredAgreements = agreements.filter((agreement) => {
            return agreement.team_members?.some((teamMember) => {
                return teamMember.id === activeUser.id;
            });
        });
        sortedAgreements = sortAgreements(filteredAgreements);
    } else {
        // all-agreements
        sortedAgreements = sortAgreements(agreements);
    }

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
