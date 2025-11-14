import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import App from "../../App";
import { EditAgreementProvider } from "../../components/Agreements/AgreementEditor/AgreementEditorContext";
import CreateEditAgreement from "./CreateEditAgreement";
import SimpleAlert from "../../components/UI/Alert/SimpleAlert";
import { useGetAgreementByIdQuery, useGetServicesComponentsListQuery } from "../../api/opsAPI";
import { getUser } from "../../api/getUser";

const EditAgreement = () => {
    const navigate = useNavigate();
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id ?? "");
    const [projectOfficer, setProjectOfficer] = useState({});
    const [alternateProjectOfficer, setAlternateProjectOfficer] = useState({});

    /** @type {{data?: import("../../types/AgreementTypes").Agreement | undefined, error?: Object, isLoading: boolean}} */
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });

    const {
        data: servicesComponents,
        isLoading: loadingServicesComponent,
        error: errorServicesComponent
    } = useGetServicesComponentsListQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });

    useEffect(() => {
        const getProjectOfficerSetState = async (id) => {
            const results = await getUser(id);
            setProjectOfficer(results);
        };

        if (agreement?.project_officer_id) {
            getProjectOfficerSetState(agreement?.project_officer_id).catch(console.error);
        }

        if (agreement?.alternate_project_officer_id) {
            const getAlternateProjectOfficerSetState = async (id) => {
                const results = await getUser(id);
                setAlternateProjectOfficer(results);
            };
            getAlternateProjectOfficerSetState(agreement?.alternate_project_officer_id).catch(console.error);
        }

        return () => {
            setProjectOfficer({});
        };
    }, [agreement]);

    if (isLoadingAgreement || loadingServicesComponent) {
        return <div>Loading...</div>;
    }
    if (errorAgreement || errorServicesComponent) {
        navigate("/error");
        return;
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
                alternateProjectOfficer={alternateProjectOfficer}
                servicesComponents={servicesComponents ?? []}
            >
                <CreateEditAgreement budgetLines={agreement?.budget_line_items ?? []} />
            </EditAgreementProvider>
        </App>
    );
};

export default EditAgreement;
