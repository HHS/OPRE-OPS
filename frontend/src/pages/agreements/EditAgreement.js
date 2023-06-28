import App from "../../App";
import { CreateAgreementProvider } from "./CreateAgreementContext";
import CreateEditAgreement from "./CreateEditAgreement";
import { useParams } from "react-router-dom";
import { useGetAgreementByIdQuery } from "../../api/opsAPI";
import { useEffect, useState } from "react";
import { getUser } from "../../api/getUser";
import SimpleAlert from "../../components/UI/Alert/SimpleAlert";

const EditAgreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);

    const [projectOfficer, setProjectOfficer] = useState({});

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        refetch,
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
    if (agreement.status !== "DRAFT" && agreement.status !== "UNDER_REVIEW") {
        return (
            <App>
                <SimpleAlert
                    type="error"
                    heading="Error"
                    message={`This Agreement cannot be edited because it's status is ${agreement.status}.`}
                ></SimpleAlert>
            </App>
        );
    }

    return (
        <App>
            <CreateAgreementProvider agreement={agreement} projectOfficer={projectOfficer}>
                <CreateEditAgreement existingBudgetLines={agreement.budget_line_items} isEditMode={true} />
            </CreateAgreementProvider>
        </App>
    );
};

export default EditAgreement;
