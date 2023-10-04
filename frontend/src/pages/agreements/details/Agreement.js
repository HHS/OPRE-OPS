import { useParams, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import App from "../../../App";
import DetailsTabs from "../../../components/Agreements/DetailsTabs/DetailsTabs";
import AgreementDetails from "./AgreementDetails";
import AgreementBudgetLines from "./AgreementBudgetLines";
import { getUser } from "../../../api/getUser";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";

const Agreement = () => {
    const urlPathParams = useParams();
    const agreementId = parseInt(urlPathParams.id);
    const [isEditMode, setIsEditMode] = useState(false);
    const [projectOfficer, setProjectOfficer] = useState({});

    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode") || undefined;
    if (mode === "edit" && !isEditMode) {
        setIsEditMode(true);
    }

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

    return (
        <App breadCrumbName={agreement?.name}>
            <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>{agreement.name}</h1>
            <h2 className={`font-sans-3xs text-normal margin-top-1 margin-bottom-2`}>
                {agreement.research_project?.title}
            </h2>

            <div>
                <section className="display-flex flex-justify margin-top-3">
                    <DetailsTabs
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
                </Routes>
            </div>
        </App>
    );
};

export default Agreement;
