import { useSelector } from "react-redux";
import { useGetAgreementsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import sortAgreements from "./utils";
import { useEffect, useState } from "react";
import Alert from "../../../components/UI/Alert";
import "./AgreementsList.scss";
import AgreementsTable from "./AgreementsTable";
import AgreementsFilterHeaderSection from "./AgreementsFilterHeaderSection";
import { useSearchParams } from "react-router-dom";
import _ from "lodash";

/**
 * Page for the Agreements List.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsList = () => {
    const [searchParams] = useSearchParams();
    const isAlertActive = useSelector((state) => state.alert.isActive);
    const [filters, setFilters] = useState({
        upcomingNeedByDate: null,
        project: {},
        projectOfficer: null,
        type: null,
        procurementShop: {},
        budgetLineStatus: {
            draft: false,
            planned: false,
            executing: false,
            obligated: false,
        },
    });

    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        refetch,
    } = useGetAgreementsQuery({ refetchOnMountOrArgChange: true });

    const activeUser = useSelector((state) => state.auth.activeUser);

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

    let filteredAgreements = _.cloneDeep(agreements);
    // for (let filter of filters) {
    //     filteredAgreements = filteredAgreements.filter(filterFunction);
    // }

    // console.log("filteredAgreements", filteredAgreements);
    // console.log("filterFunctions", filterFunctions);

    console.log("filters", filters);

    let sortedAgreements;
    if (searchParams.get("filter") === "my-agreements") {
        const myAgreements = filteredAgreements.filter((agreement) => {
            return agreement.team_members?.some((teamMember) => {
                return teamMember.id === activeUser.id;
            });
        });
        sortedAgreements = sortAgreements(myAgreements);
    } else {
        // all-agreements
        sortedAgreements = sortAgreements(filteredAgreements);
    }

    return (
        <App>
            <Breadcrumb currentName={"Agreements"} />
            {isAlertActive && <Alert />}

            <h1 className="font-sans-lg">Agreements</h1>
            <p>This is a list of the agreements you are listed as a Team Member on.</p>
            <AgreementsFilterHeaderSection filters={filters} setFilters={setFilters} />
            <AgreementsTable agreements={sortedAgreements} />
        </App>
    );
};
