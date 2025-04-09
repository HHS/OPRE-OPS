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
import { hasBlIsInReview } from "../../../helpers/budgetLines.helpers";
import { useChangeRequestsForAgreement } from "../../../hooks/useChangeRequests.hooks";
import AgreementBudgetLines from "./AgreementBudgetLines";
import AgreementDetails from "./AgreementDetails";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { isTemporaryUI } from "../../../helpers/agreement.helpers";

const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [isAgreementWip, setIsAgreementWip] = useState(false); // Temporary UI
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({});
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({});
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);
    const [isTempUiAlertVisible, setIsTempUiAlertVisible] = useState(true);
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
    }
    let changeRequests = useChangeRequestsForAgreement(agreement?.id);

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

        setIsAgreementWip(isTemporaryUI(agreement?.agreement_type));

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
            {doesAgreementHaveBlIsInReview && isAlertVisible ? (
                <AgreementChangesAlert
                    changeRequests={changeRequests}
                    isAlertVisible={isAlertVisible}
                    setIsAlertVisible={setIsAlertVisible}
                />
            ) : isAgreementWip && isTempUiAlertVisible ? (
                <SimpleAlert
                    type="warning"
                    heading="This Page is in progress"
                    isClosable={true}
                    message="Agreements that are grants, inter-agency agreements (IAAs), assisted acquisitions (AAs) or direct obligations have not been developed yet, but are coming soon. You can view the budget lines for this agreement, but they are not currently editable. Some data or information might be missing from this view, but will be added as we work to develop this page. In order to update something on this agreement, please contact the Budget Team. If you want to be involved in the design for these pages, please let us know by emailing opre-ops-support@flexion.us. Thank you for your patience."
                    setIsAlertVisible={setIsTempUiAlertVisible}
                />
            ) : (
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
                        isAgreementWip={isAgreementWip} // Temporary UI
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
                                isAgreementWip={isAgreementWip} // Temporary UI
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
