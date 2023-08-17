import { useSelector } from "react-redux";
import { useGetAgreementsQuery } from "../../../api/opsAPI";
import App from "../../../App";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import sortAgreements from "./utils";
import { useState } from "react";
import Alert from "../../../components/UI/Alert";
import "./AgreementsList.scss";
import AgreementsTable from "./AgreementsTable";
import AgreementsFilterHeaderSection from "./AgreementsFilterHeaderSection";
import { useSearchParams } from "react-router-dom";
import _ from "lodash";
import { getCurrentFiscalYear } from "../../../helpers/utils";

/**
 * Page for the Agreements List.
 * @returns {React.JSX.Element} - The component JSX.
 */
export const AgreementsList = () => {
    const [searchParams] = useSearchParams();
    const isAlertActive = useSelector((state) => state.alert.isActive);
    const [filters, setFilters] = useState({
        upcomingNeedByDate: "all-time",
        projects: [],
        projectOfficers: [],
        types: [],
        procurementShops: [],
        budgetLineStatus: {
            draft: true,
            planned: true,
            executing: true,
            obligated: true,
        },
    });

    const {
        data: agreements,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementsQuery({ refetchOnMountOrArgChange: true });

    const activeUser = useSelector((state) => state.auth.activeUser);
    const myAgreementsUrl = searchParams.get("filter") === "my-agreements";

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

    // filter by project officers
    filteredAgreements = filteredAgreements.filter((agreement) => {
        return (
            filters.projectOfficers.length === 0 ||
            filters.projectOfficers.some((po) => {
                return po.id === agreement.project_officer;
            })
        );
    });

    // filter by types
    filteredAgreements = filteredAgreements.filter((agreement) => {
        return (
            filters.types.length === 0 ||
            filters.types.some((agreementType) => {
                return agreementType === agreement.agreement_type;
            })
        );
    });

    // filter by procurement shops
    filteredAgreements = filteredAgreements.filter((agreement) => {
        return (
            filters.procurementShops.length === 0 ||
            filters.procurementShops.some((procurementShop) => {
                return procurementShop.id === agreement.procurement_shop_id;
            })
        );
    });

    // filter by budget line status
    filteredAgreements = filteredAgreements.filter((agreement) => {
        return (
            (filters.budgetLineStatus.draft === true && agreement.budget_line_items.length === 0) ||
            (filters.budgetLineStatus.draft === true &&
                agreement.budget_line_items.some((bli) => {
                    return bli.status === "DRAFT" || bli.status === "UNDER_REVIEW";
                })) ||
            (filters.budgetLineStatus.planned === true &&
                agreement.budget_line_items.some((bli) => {
                    return bli.status === "PLANNED";
                })) ||
            (filters.budgetLineStatus.executing === true &&
                agreement.budget_line_items.some((bli) => {
                    return bli.status === "IN_EXECUTION";
                })) ||
            (filters.budgetLineStatus.obligated === true &&
                agreement.budget_line_items.some((bli) => {
                    return bli.status === "OBLIGATED";
                }))
        );
    });

    let sortedAgreements;
    if (myAgreementsUrl) {
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
            <p>
                {myAgreementsUrl
                    ? "This is a list of the agreements you are listed as a Team Member on."
                    : "This is a list of all agreements across OPRE."}
            </p>
            <AgreementsFilterHeaderSection filters={filters} setFilters={setFilters} />
            <AgreementsTable agreements={sortedAgreements} />
        </App>
    );
};
