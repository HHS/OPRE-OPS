import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery, useGetNotificationsByUserIdAndAgreementIdQuery } from "../../../api/opsAPI";
import AgreementChangesAlert from "../../../components/Agreements/AgreementChangesAlert";
import AgreementChangesResponseAlert from "../../../components/Agreements/AgreementChangesResponseAlert";
import DetailsTabs from "../../../components/Agreements/DetailsTabs";
import DocumentView from "../../../components/Agreements/Documents/DocumentView";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { isNonContract } from "../../../helpers/agreement.helpers";
import { hasBlIsInReview, hasBlIsObligated } from "../../../helpers/budgetLines.helpers";
import { useChangeRequestsForAgreement } from "../../../hooks/useChangeRequests.hooks";
import AgreementBudgetLines from "./AgreementBudgetLines";
import AgreementDetails from "./AgreementDetails";

// TODO:
// - update e2e tests

const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [isAgreementNotaContract, setIsAgreementNotaContract] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({});
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({});
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

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        isSuccess
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });
    let doesAgreementHaveBlIsInReview = false;
    let doesAgreementHaveBlIsObligated = false;
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
        doesAgreementHaveBlIsInReview = hasBlIsInReview(agreement?.budget_line_items);
        doesAgreementHaveBlIsObligated = hasBlIsObligated(agreement?.budget_line_items);
    }

    let changeRequests = useChangeRequestsForAgreement(agreement?.id);

    useEffect(() => {
        setIsAgreementNotaContract(isNonContract(agreement?.agreement_type, agreement?.procurement_shop?.abbr));
    }, [agreement]);

    useEffect(() => {
        /**
         *
         * @param {number} id
         * @param {boolean} isProjectOfficer
         */
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
        };
    }, [agreement]);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <App breadCrumbName={agreement?.name}>
            {doesAgreementHaveBlIsInReview && isAlertVisible && (
                <AgreementChangesAlert
                    changeRequests={changeRequests}
                    isAlertVisible={isAlertVisible}
                    setIsAlertVisible={setIsAlertVisible}
                />
            )}
            {isAgreementNotaContract && isTempUiAlertVisible && (
                <SimpleAlert
                    type="warning"
                    heading="This page is in progress"
                    isClosable={true}
                    message="Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon. You can view the budget lines for this agreement, but they are not currently editable. Some data or information might be missing from this view, but will be added as we work to develop this page. In order to update something on this agreement, please contact the Budget Team. If you want to be involved in the design for these pages, please let us know by emailing opre-ops-support@flexion.us. Thank you for your patience."
                    setIsAlertVisible={setIsTempUiAlertVisible}
                />
            )}
            {doesAgreementHaveBlIsObligated && isAwardedAlertVisible && (
                <SimpleAlert
                    type="warning"
                    heading="This page is in progress"
                    isClosable={true}
                    message="Contracts that are awarded have not been fully developed yet, but are coming soon. Some data or information might be missing from this view such as CLINs, or other award and modification related data. Please note: any data that is not visible is not lost, its just not displayed in the user interface yet. Thank you for your patience."
                    setIsAlertVisible={setIsAwardedAlertVisible}
                />
            )}
            {!(doesAgreementHaveBlIsInReview && isAlertVisible) &&
                !(isAgreementNotaContract && isTempUiAlertVisible) &&
                !(doesAgreementHaveBlIsObligated && isAwardedAlertVisible) && (
                    <>
                        <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>{agreement.name}</h1>
                        <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>
                            {agreement.project?.title}
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
                        agreementId={agreement.id}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        isAgreementNotaContract={isAgreementNotaContract}
                        isAwardAgreement={doesAgreementHaveBlIsObligated}
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
                                isAwardAgreement={doesAgreementHaveBlIsObligated}
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
