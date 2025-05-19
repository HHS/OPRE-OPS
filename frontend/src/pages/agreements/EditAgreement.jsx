import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import App from "../../App";
import { EditAgreementProvider } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateEditAgreement from "./CreateEditAgreement";
import SimpleAlert from "../../components/UI/Alert/SimpleAlert";
import { useGetAgreementByIdQuery } from "../../api/opsAPI";
import { getUser } from "../../api/getUser";
import ErrorPage from "../ErrorPage";

const EditAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id ?? "");
    const [projectOfficer, setProjectOfficer] = useState({});

    /** @type {{data?: import("../../types/AgreementTypes").Agreement | undefined, error?: Object, isLoading: boolean}} */
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true
    });

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
        return <ErrorPage />;
    }

    const canUserEditAgreement = agreement?._meta.isEditable;
    const isEditable = canUserEditAgreement;

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
        <App>
            <EditAgreementProvider
                agreement={agreement}
                projectOfficer={projectOfficer}
            >
                <CreateEditAgreement budgetLines={agreement?.budget_line_items ?? []} />
            </EditAgreementProvider>
        </App>
    );
};

export default EditAgreement;
