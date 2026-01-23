import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { getUser } from "../../../api/getUser";
import {
    useGetAgreementByIdQuery,
    useGetNotificationsByUserIdAndAgreementIdQuery,
    useGetProcurementShopByIdQuery
} from "../../../api/opsAPI";
import AgreementChangesAlert from "../../../components/Agreements/AgreementChangesAlert";
import AgreementChangesResponseAlert from "../../../components/Agreements/AgreementChangesResponseAlert";
import DetailsTabs from "../../../components/Agreements/DetailsTabs";
import DocumentView from "../../../components/Agreements/Documents/DocumentView";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import Tag from "../../../components/UI/Tag";
import { calculateFeeTotal, isNotDevelopedYet } from "../../../helpers/agreement.helpers";
import { hasAnyBliInSelectedStatus, hasBlIsInReview } from "../../../helpers/budgetLines.helpers";
import { getAwardingEntityIds } from "../../../helpers/procurementShop.helpers";
import { convertToCurrency } from "../../../helpers/utils";
import { useChangeRequestsForAgreement } from "../../../hooks/useChangeRequests.hooks";
import icons from "../../../uswds/img/sprite.svg";
import { AgreementType } from "../agreements.constants";
import AgreementBudgetLines from "./AgreementBudgetLines";
import AgreementDetails from "./AgreementDetails";
import AgreementProcurementTracker from "./AgreementProcurementTracker";
import { BUDGET_LINE_STATUSES } from "../../../components/BudgetLineItems/BLIReviewTable/BLIReviewTable.constants";

const Agreement = () => {
    const navigate = useNavigate();
    // TODO: move logic into a custom hook aka Agreement.hooks.js
    const urlPathParams = useParams();
    const agreementId = urlPathParams?.id ? +urlPathParams.id : -1;
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({ email: "", full_name: "", id: 0 });
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({ email: "", full_name: "", id: 0 });
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);

    // Memoize setHasAgreementChanged to prevent infinite loops in child components
    const memoizedSetHasAgreementChanged = useCallback((hasChanged) => {
        setHasAgreementChanged(hasChanged);
    }, []);
    const [isAlertVisible, setIsAlertVisible] = useState(true);
    const [isTempUiAlertVisible, setIsTempUiAlertVisible] = useState(true);
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
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });
    let doesAgreementHaveBlIsInReview = false;
    const activeUser = useSelector((state) => state.auth.activeUser);

    let procurementShopChanges = [];
    let newAwardingEntityId = -1;
    let oldAwardingEntityId = -1;

    let user_agreement_notifications = [];
    const query_response = useGetNotificationsByUserIdAndAgreementIdQuery({
        user_oidc_id: activeUser?.oidc_id,
        agreement_id: agreementId
    });

    if (query_response) {
        user_agreement_notifications = query_response.data;
    }

    if (isSuccess && agreement) {
        doesAgreementHaveBlIsInReview = hasBlIsInReview(agreement.budget_line_items ?? []);
        procurementShopChanges = getAwardingEntityIds(agreement?.change_requests_in_review ?? []);
        [{ old: oldAwardingEntityId, new: newAwardingEntityId }] =
            procurementShopChanges.length > 0 ? procurementShopChanges : [{ old: -1, new: -1 }];
    }

    // Only make procurement shop API calls if there are change requests with procurement shop changes
    const shouldFetchProcurementShops =
        procurementShopChanges.length > 0 && newAwardingEntityId !== -1 && oldAwardingEntityId !== -1;

    /** @type {{data?: import("../../../types/AgreementTypes").ProcurementShop | undefined}} */
    const { data: oldProcurementShop } = useGetProcurementShopByIdQuery(oldAwardingEntityId, {
        skip: !shouldFetchProcurementShops
    });

    /** @type {{data?: import("../../../types/AgreementTypes").ProcurementShop | undefined}} */
    const { data: newProcurementShop } = useGetProcurementShopByIdQuery(newAwardingEntityId, {
        skip: !shouldFetchProcurementShops
    });

    /** @type string[] */
    let changeRequests = [];

    /** @type string[] */
    let allChangeRequests = [];

    let budgetLineChangeRequests = useChangeRequestsForAgreement(agreement?.id ?? 0);
    if (budgetLineChangeRequests.length > 0) {
        changeRequests = [...budgetLineChangeRequests];
    }

    if (shouldFetchProcurementShops) {
        const newTotal = calculateFeeTotal(agreement?.budget_line_items ?? [], newProcurementShop?.fee_percentage ?? 0);
        const oldTotal = calculateFeeTotal(agreement?.budget_line_items ?? [], oldProcurementShop?.fee_percentage ?? 0);

        const procurementShopNameChange = `Procurement Shop: ${oldProcurementShop?.name} (${oldProcurementShop?.abbr}) to ${newProcurementShop?.name} (${newProcurementShop?.abbr})`;
        const procurementFeePercentageChange = `Fee Rate: ${oldProcurementShop?.fee_percentage}% to ${newProcurementShop?.fee_percentage}%`;
        const procurementShopFeeTotalChange = `Fee Total: ${convertToCurrency(oldTotal)} to ${convertToCurrency(newTotal)}`;
        allChangeRequests = [
            ...changeRequests,
            procurementShopNameChange,
            procurementFeePercentageChange,
            procurementShopFeeTotalChange
        ];
    }

    const isAgreementNotDeveloped = isNotDevelopedYet(agreement?.agreement_type ?? "");

    useEffect(() => {
        /**
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
            setProjectOfficer({ email: "", full_name: "", id: 0 });
            setAlternateProjectOfficer({ email: "", full_name: "", id: 0 });
        };
    }, [agreement]);

    if (isLoadingAgreement) {
        return <div>Loading...</div>;
    }
    if (errorAgreement) {
        navigate("/error");
        return;
    }

    const showReviewAlert = (doesAgreementHaveBlIsInReview || agreement?.in_review) && isAlertVisible;
    const showNonContractAlert = isAgreementNotDeveloped && isTempUiAlertVisible;

    const isAgreementAwarded = agreement?.is_awarded;
    const hasInExecutionBli = hasAnyBliInSelectedStatus(
        agreement?.budget_line_items ?? [],
        BUDGET_LINE_STATUSES.IN_EXECUTION
    );
    return (
        <App breadCrumbName={agreement?.name}>
            {showReviewAlert && (
                <AgreementChangesAlert
                    changeRequests={allChangeRequests}
                    isAlertVisible={isAlertVisible}
                    setIsAlertVisible={setIsAlertVisible}
                />
            )}
            {showNonContractAlert && (
                <SimpleAlert
                    type="warning"
                    heading="This page is in progress"
                    isClosable={true}
                    message="Agreements that are grants, other partner agreements (IAAs, IPAs, IDDAs), or direct obligations have not been developed yet, but are coming soon. You can view the budget lines for this agreement, but they are not currently editable. Some data or information might be missing from this view, but will be added as we work to develop this page. In order to update something on this agreement, please contact the Budget Team. If you want to be involved in the design for these pages, please let us know by submitting a Budget Support Request through ORBIT. Thank you for your patience."
                    setIsAlertVisible={setIsTempUiAlertVisible}
                />
            )}
            {isAgreementAwarded && agreement?.agreement_type !== AgreementType.DIRECT_OBLIGATION && (
                <Tag className="bg-brand-secondary display-inline-flex margin-top-105 margin-bottom-1">
                    Awarded
                    <svg
                        className="usa-icon margin-left-05"
                        aria-hidden="true"
                        focusable="false"
                        role="img"
                    >
                        <use href={`${icons}#verified`}></use>
                    </svg>
                </Tag>
            )}
            <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>{agreement?.name}</h1>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>{agreement?.project?.title}</h2>

            {user_agreement_notifications?.length > 0 && (
                <AgreementChangesResponseAlert
                    changeRequestNotifications={user_agreement_notifications}
                    isApproveAlertVisible={isApproveAlertVisible}
                    isDeclineAlertVisible={isDeclinedAlertVisible}
                    setIsApproveAlertVisible={setIsApproveAlertVisible}
                    setIsDeclineAlertVisible={setIsDeclinedAlertVisible}
                    budgetLines={agreement?.budget_line_items ?? []}
                />
            )}
            <div>
                <section className="display-flex flex-justify margin-top-3">
                    <DetailsTabs
                        agreementId={agreement?.id ?? 0}
                        isAgreementNotDeveloped={isAgreementNotDeveloped}
                        isAgreementAwarded={isAgreementAwarded ?? false}
                        hasInExecutionBli={hasInExecutionBli ?? false}
                    />
                </section>

                <Routes>
                    <Route
                        path=""
                        element={
                            <AgreementDetails
                                agreement={agreement}
                                setHasAgreementChanged={memoizedSetHasAgreementChanged}
                                hasAgreementChanged={hasAgreementChanged}
                                projectOfficer={projectOfficer}
                                alternateProjectOfficer={alternateProjectOfficer}
                                isEditMode={isEditMode}
                                setIsEditMode={setIsEditMode}
                                isAgreementNotDeveloped={isAgreementNotDeveloped}
                                isAgreementAwarded={isAgreementAwarded ?? false}
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
                                isAgreementNotDeveloped={isAgreementNotDeveloped}
                                isAgreementAwarded={isAgreementAwarded ?? false}
                            />
                        }
                    />
                    <Route
                        path="procurement-tracker"
                        element={
                            <AgreementProcurementTracker
                                agreement={agreement}
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
