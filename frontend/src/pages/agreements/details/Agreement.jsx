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

const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({});
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);
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
        const getProjectOfficerSetState = async (id) => {
            const results = await getUser(id);
            setProjectOfficer(results);
        };

        if (agreement?.project_officer_id) {
            getProjectOfficerSetState(agreement?.project_officer_id).catch(console.error);
        }

        return () => {
            setProjectOfficer({});
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
                                isEditMode={isEditMode}
                                setIsEditMode={setIsEditMode}
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
