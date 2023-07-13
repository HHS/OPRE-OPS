import App from "../../../App";
import { CreateAgreementProvider } from "../CreateAgreementContext";
import CreateEditAgreement from "../CreateEditAgreement";
import {useParams, Switch, Route, Routes} from "react-router-dom";
import { useGetAgreementByIdQuery } from "../../../api/opsAPI";
import { useEffect, useState } from "react";
import { getUser } from "../../../api/getUser";
import Breadcrumb from "../../../components/UI/Header/Breadcrumb";
import DetailsTabs from "../../../components/Agreements/DetailsTabs/DetailsTabs";
import TabsSection from "../../../components/Portfolios/TabsSection/TabsSection";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import {setSelectedFiscalYear} from "../../portfolios/detail/portfolioSlice";
import AgreementDetails from "./AgreementDetails";
import AgreementBudgetLines from "./AgreementBudgetLines";


const Agreement = () => {
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

    return (
        <App>
            <h2>WIP: View Agreement</h2>
            <Breadcrumb currentName={`TODO: Portfolios > Project Name > ${agreement.name}`} />

            <h1>{agreement.name}</h1>
            <div>
                <section className="display-flex flex-justify margin-top-3">
                    <DetailsTabs agreementId={agreement.id} />
                </section>

                     <Routes>
                        <Route path="" element={<AgreementDetails agreement={agreement} />} />
                        <Route path="budget-lines" element={<AgreementBudgetLines agreement={agreement} />} />
                     </Routes>
            </div>
        </App>
    );
};

export default Agreement;
