import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import App from "../../App";
import { EditAgreementProvider } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateEditAgreement from "./CreateEditAgreement";
import { useGetAgreementByIdQuery } from "../../api/opsAPI";
import { getUser } from "../../api/getUser";
import SimpleAlert from "../../components/UI/Alert/SimpleAlert";
import { useIsUserAllowedToEditAgreement, useIsAgreementEditable } from "../../helpers/useAgreements";

const EditAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [projectOfficer, setProjectOfficer] = useState({});

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
    });

    const canUserEditAgreement = useIsUserAllowedToEditAgreement(agreement?.id);
    const isAgreementEditable = useIsAgreementEditable(agreement?.id);
    const isEditable = isAgreementEditable && canUserEditAgreement;

    useEffect(() => {
        const getProjectOfficerSetState = async (id) => {
            const results = await getUser(id);
            setProjectOfficer(results);
        };

        if (agreement?.project_officer) {
            getProjectOfficerSetState(agreement?.project_officer).catch(console.error);
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
                <SimpleAlert type="error" heading="Error" message="This Agreement cannot be edited."></SimpleAlert>
                <Link to="/" className="usa-button margin-top-4">
                    Go back home
                </Link>
            </App>
        );
    }
    return (
        <App>
            <EditAgreementProvider agreement={agreement} projectOfficer={projectOfficer}>
                <CreateEditAgreement existingBudgetLines={agreement.budget_line_items} />
            </EditAgreementProvider>
        </App>
    );
};

export default EditAgreement;
