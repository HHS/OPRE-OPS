import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery, useGetNotificationsByUserIdAndAgreementIdQuery, useLazyGetUsersQuery } from "../../../api/opsAPI";
import AgreementChangesAlert from "../../../components/Agreements/AgreementChangesAlert";
import AgreementChangesResponseAlert from "../../../components/Agreements/AgreementChangesResponseAlert";
import DetailsTabs from "../../../components/Agreements/DetailsTabs";
import DocumentView from "../../../components/Agreements/Documents/DocumentView";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { isNotDevelopedYet } from "../../../helpers/agreement.helpers";
import { hasBlIsInReview, hasBlIsObligated } from "../../../helpers/budgetLines.helpers";
import { useChangeRequestsForAgreement } from "../../../hooks/useChangeRequests.hooks";
import AgreementBudgetLines from "./AgreementBudgetLines";
import AgreementDetails from "./AgreementDetails";
import ErrorPage from "../../ErrorPage";

const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({});
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({});
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [divisionDirectors, setDivisionDirectors] = useState([]);
    const [getUsers] = useLazyGetUsersQuery();
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);
    const [isTempUiAlertVisible, setIsTempUiAlertVisible] = useState(true);
    const [isAwardedAlertVisible, setIsAwardedAlertVisible] = useState(true);
    const [isApproveAlertVisible, setIsApproveAlertVisible] = useState(true);
    const [isDeclinedAlertVisible, setIsDeclinedAlertVisible] = useState(true);

    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode") || undefined;
    if (mode === "edit" && !isEditMode) {
        setIsEditMode(true);
    }

    /** @type {{data?: import("../../../types/AgreementTypes").Agreement | undefined, error?: Object, isLoading: boolean, isSuccess: boolean}} */
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        isSuccess
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    let doesAgreementHaveBlIsInReview = false;
    let doesContractHaveBlIsObligated = false;
    const activeUser = useSelector((state) => state.auth.activeUser);

    let user_agreement_notifications = [];
    const query_response = useGetNotificationsByUserIdAndAgreementIdQuery({
        user_oidc_id: activeUser?.oidc_id,
        agreement_id: agreementId
    });
    if (query_response) {
        user_agreement_notifications = query_response.data;
    }

    if (isSuccess) {
        doesAgreementHaveBlIsInReview = hasBlIsInReview(agreement?.budget_line_items ?? []);
        doesContractHaveBlIsObligated = hasBlIsObligated(agreement?.budget_line_items ?? []);
    }

    let changeRequests = useChangeRequestsForAgreement(agreement?.id ?? 0);

    const isAgreementNotaContract = isNotDevelopedYet(agreement?.agreement_type, agreement?.procurement_shop?.abbr);

    const getAgreementTeamLeaders = (budgetLines) => {
        if (!budgetLines?.length) return [];

        const uniqueTeamLeaders = new Map();

        budgetLines.forEach((budgetLine) => {
            budgetLine.portfolio_team_leaders?.forEach((leader) => {
                if (leader.id && !uniqueTeamLeaders.has(leader.id)) {
                    uniqueTeamLeaders.set(leader.id, leader);
                }
            });
        });

        return Array.from(uniqueTeamLeaders.values());
    };

    const getAgreementDivisionDirectorIds = (budgetLines) => {
        if (!budgetLines?.length) return [];

        const uniqueDirectorIds = new Set();

        budgetLines.forEach(budgetLine => {
            const directorId = budgetLine.can?.portfolio?.division?.division_director_id;
            if (directorId) {
                uniqueDirectorIds.add(directorId);
            }
        });
        return Array.from(uniqueDirectorIds);
    };


    useEffect(() => {
        /**
         *
         * @param {number} id
         * @param {boolean} isProjectOfficer
         */
        const fetchDivisionDirectors = async () => {
            if (agreement?.budget_line_items) {
                const directorIds = getAgreementDivisionDirectorIds(agreement.budget_line_items);
                if (directorIds.length > 0) {
                    try {
                        const response = await getUsers(directorIds).unwrap();

                        const directors = response.filter(user =>
                            directorIds.includes(user.id)
                        );
                        setDivisionDirectors(directors);
                    } catch (error) {
                        console.error('Failed to fetch division directors:', error);
                    }
                }
            }
        };

        if (agreement?.budget_line_items) {
            const leaders = getAgreementTeamLeaders(agreement.budget_line_items);
            setTeamLeaders(leaders);
        }

        const getProjectOfficerSetState = async (id, isProjectOfficer) => {
            const results = await getUser(id);
            if (isProjectOfficer) {
                setProjectOfficer(results);
            } else {
                setAlternateProjectOfficer(results);
            }
        };

        if (agreement?.project_officer_id) {
            getProjectOfficerSetState(agreement?.project_officer_id, true).catch(console.error);
        }

        if (agreement?.alternate_project_officer_id) {
            getProjectOfficerSetState(agreement?.alternate_project_officer_id, false).catch(console.error);
        }

        return () => {
            setProjectOfficer({});
            setAlternateProjectOfficer({});
            fetchDivisionDirectors();
        };
    }, [agreement, agreement?.budget_line_items, getUsers]);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <ErrorPage />;
    }

    const showReviewAlert = doesAgreementHaveBlIsInReview && isAlertVisible;
    const showNonContractAlert = isAgreementNotaContract && isTempUiAlertVisible;
    const showAwardedAlert = !isAgreementNotaContract && doesContractHaveBlIsObligated && isAwardedAlertVisible;
    return (
        <App breadCrumbName={agreement?.name}>
            {showReviewAlert && (
                <AgreementChangesAlert
                    changeRequests={changeRequests}
                    isAlertVisible={isAlertVisible}
                    setIsAlertVisible={setIsAlertVisible}
                />
            )}
            {showNonContractAlert && (
                <SimpleAlert
                    type="warning"
                    heading="This page is in progress"
                    isClosable={true}
                    message="Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon. You can view the budget lines for this agreement, but they are not currently editable. Some data or information might be missing from this view, but will be added as we work to develop this page. In order to update something on this agreement, please contact the Budget Team. If you want to be involved in the design for these pages, please let us know by emailing opre-ops-support@flexion.us. Thank you for your patience."
                    setIsAlertVisible={setIsTempUiAlertVisible}
                />
            )}
            {showAwardedAlert && (
                <SimpleAlert
                    type="warning"
                    heading="This page is in progress"
                    isClosable={true}
                    message="Contracts that are awarded have not been fully developed yet, but are coming soon. Some data or information might be missing from this view such as CLINs, or other award and modification related data. Please note: any data that is not visible is not lost, its just not displayed in the user interface yet. Thank you for your patience."
                    setIsAlertVisible={setIsAwardedAlertVisible}
                />
            )}
            {!showReviewAlert && !showNonContractAlert && !showAwardedAlert && (
                <>
                    <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>{agreement?.name}</h1>
                    <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>
                        {agreement?.project?.title}
                    </h2>
                </>
            )}

            {user_agreement_notifications?.length > 0 && (
                <AgreementChangesResponseAlert
                    changeRequestNotifications={user_agreement_notifications}
                    isApproveAlertVisible={isApproveAlertVisible}
                    isDeclineAlertVisible={isDeclinedAlertVisible}
                    setIsApproveAlertVisible={setIsApproveAlertVisible}
                    setIsDeclineAlertVisible={setIsDeclinedAlertVisible}
                />
            )}
            <div>
                <section className="display-flex flex-justify margin-top-3">
                    <DetailsTabs
                        hasAgreementChanged={hasAgreementChanged}
                        setHasAgreementChanged={setHasAgreementChanged}
                        agreementId={agreement?.id ?? 0}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        isAgreementNotaContract={isAgreementNotaContract}
                        isAgreementAwarded={doesContractHaveBlIsObligated}
                    />
                </section>

                <Routes>
                    <Route
                        path=""
                        element={
                            <AgreementDetails
                                setHasAgreementChanged={setHasAgreementChanged}
                                agreement={agreement}
                                projectOfficer={projectOfficer}
                                alternateProjectOfficer={alternateProjectOfficer}
                                divisionDirectors={divisionDirectors}
                                teamLeaders={teamLeaders}
                                isEditMode={isEditMode}
                                setIsEditMode={setIsEditMode}
                                isAgreementNotaContract={isAgreementNotaContract}
                            />
                        }
                    />
                    <Route
                        path="budget-lines"
                        element={
                            <AgreementBudgetLines
                                agreement={agreement}
                                isEditMode={isEditMode}
                                setIsEditMode={setIsEditMode}
                                isAgreementNotaContract={isAgreementNotaContract}
                                isAgreementAwarded={doesContractHaveBlIsObligated}
                            />
                        }
                    />
                    <Route
                        path="documents"
                        element={
                            <DocumentView
                                isEditMode={isEditMode}
                                setIsEditMode={setIsEditMode}
                            />
                        }
                    />
                </Routes>
            </div>
        </App>
    );
};

export default Agreement;
