import App from "../../App";
import { CreateAgreementProvider } from "./CreateAgreementContext";
import CreateEditAgreement from "./CreateEditAgreement";
import { useParams } from "react-router-dom";
import { useGetAgreementByIdQuery } from "../../api/opsAPI";
import { AgreementCard } from "./edit/AgreementCard";
import { useEffect, useState } from "react";
import { getUser } from "../../api/getUser";

const EditAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    const [projectOfficer, setProjectOfficer] = useState({});

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
    } = useGetAgreementByIdQuery(agreementId);

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

    let project_officer = null;

    return (
        <App>
            <CreateAgreementProvider agreement={agreement} project_officer={projectOfficer}>
                <CreateEditAgreement existingBudgetLines={agreement.budget_line_items} />
            </CreateAgreementProvider>

            <pre>{JSON.stringify(agreement, null, 2)}</pre>

            <AgreementCard agreement={agreement} />
        </App>
    );
};

export default EditAgreement;
