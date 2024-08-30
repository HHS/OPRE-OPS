import React from "react";
import { Link, useParams } from "react-router-dom";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import App from "../../../App";
import AgreementEditForm from "../../../components/Agreements/AgreementEditor/AgreementEditForm";
import { EditAgreementProvider } from "../../../components/Agreements/AgreementEditor/AgreementEditorContext";
import DebugCode from "../../../components/DebugCode";
import SimpleAlert from "../../../components/UI/Alert/SimpleAlert";
import { useIsAgreementEditable, useIsUserAllowedToEditAgreement } from "../../../hooks/agreement.hooks";
import CreateBLIsAndSCs from "../../../components/BudgetLineItems/CreateBLIsAndSCs";

// /agreements/resolve/:id/*
function ResolveAgreement() {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [projectOfficer, setProjectOfficer] = React.useState({});
    const [includeDrafts, setIncludeDrafts] = React.useState(false);
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = useIsAgreementEditable(agreement?.id);
    const isEditable = isAgreementEditable && canUserEditAgreement;

    React.useEffect(() => {
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

    if (!isEditable) {
        return (
            <App>
                <SimpleAlert
                    type="error"
                    heading="Error"
                    message="This Agreement cannot be edited."
                ></SimpleAlert>
                <Link
                    to="/"
                    className="usa-button margin-top-4"
                >
                    Go back home
                </Link>
            </App>
        );
    }

    return (
        <App breadCrumbName={agreement?.display_name}>
            <h2>Edit Agreement Details</h2>
            <EditAgreementProvider
                agreement={agreement}
                projectOfficer={projectOfficer}
            >
                <AgreementEditForm
                    isReviewMode={true}
                    isEditMode={true}
                    setIsEditMode={() => {}}
                />
            </EditAgreementProvider>
            <CreateBLIsAndSCs
                selectedAgreement={agreement}
                budgetLines={agreement?.budget_line_items}
                isEditMode={true}
                setIsEditMode={() => {}}
                isReviewMode={true}
                selectedProcurementShop={agreement?.procurement_shop}
                selectedResearchProject={agreement?.project}
                canUserEditBudgetLines={canUserEditAgreement}
                wizardSteps={[]}
                continueBtnText="Save Changes"
                currentStep={0}
                workflow="none"
                includeDrafts={includeDrafts}
                setIncludeDrafts={setIncludeDrafts}
                goBack={() => {}}
            />
            <DebugCode data={agreement} />
        </App>
    );
}

export default ResolveAgreement;
