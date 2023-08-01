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
import { getCurrentFiscalYear } from "../../../helpers/utils";

/**
 * Page for the Agreements List.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsList = () => {
    const [searchParams] = useSearchParams();
    const isAlertActive = useSelector((state) => state.alert.isActive);
    const [filters, setFilters] = useState({
        upcomingNeedByDate: null,
        projects: [],
        projectOfficers: [],
        types: [],
        procurementShops: [],
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

    switch (filters.upcomingNeedByDate) {
        case "next-30-days":
            filteredAgreements = filteredAgreements.filter((agreement) => {
                return agreement.budget_line_items.some((bli) => {
                    return (
                        bli.date_needed &&
                        new Date(bli.date_needed) <= new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
                    );
                });
            });
            break;
        case "current-fy":
            filteredAgreements = filteredAgreements.filter((agreement) => {
                return agreement.budget_line_items.some((bli) => {
                    const currentFY = Number(getCurrentFiscalYear(new Date()));
                    const bliFY = new Date(bli.date_needed).getFullYear();
                    return bli.date_needed && bliFY === currentFY;
                });
            });
            break;
        case "next-6-months":
            filteredAgreements = filteredAgreements.filter((agreement) => {
                const now = new Date();
                const sixMonthsFromNow = new Date(now.setMonth(now.getMonth() + 6));
                return agreement.budget_line_items.some((bli) => {
                    return bli.date_needed && new Date(bli.date_needed) <= sixMonthsFromNow;
                });
            });
            break;
        case "all-time":
            break;
    }

    // filter by projects
    filteredAgreements = filteredAgreements.filter((agreement) => {
        return (
            filters.projects.length === 0 ||
            filters.projects.some((project) => {
                return project.id === agreement.research_project_id;
            })
        );
    });

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
