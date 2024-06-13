import { useParams, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import App from "../../../App";
import DetailsTabs from "../../../components/Agreements/DetailsTabs/DetailsTabs";
import AgreementDetails from "./AgreementDetails";
import AgreementBudgetLines from "./AgreementBudgetLines";
import DocumentView from "../../documents/DocumentView";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import { hasBlIsInReview } from "../../../helpers/budgetLines.helpers";
import AgreementChangesAlert from "../../../components/Agreements/AgreementChangesAlert";
import { useChangeRequestsForAgreement } from "../../../hooks/useChangeRequests.hooks";

const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({});
    const [hasAgreementChanged, setHasAgreementChanged] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);

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

    if (isSuccess) {
        doesAgreementHaveBlIsInReview = hasBlIsInReview(agreement?.budget_line_items);
    }
    let changeRequests = useChangeRequestsForAgreement(agreement?.id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [mode]);

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
