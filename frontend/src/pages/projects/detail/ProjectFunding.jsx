import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import { useGetPortfoliosQuery, useGetProjectByIdQuery, useGetProjectFundingByIdQuery } from "../../../api/opsAPI";
import DebugCode from "../../../components/DebugCode";
import ProjectFundingByCANCard from "../../../components/Projects/ProjectFundingByCANCard/ProjectFundingByCANCard";
import ProjectFundingByFYCard from "../../../components/Projects/ProjectFundingByFYCard/ProjectFundingByFYCard";
import ProjectFundingByPortfolioCard from "../../../components/Projects/ProjectFundingByPortfolioCard/ProjectFundingByPortfolioCard";
import FiscalYear from "../../../components/UI/FiscalYear/FiscalYear";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import ProjectDetailTabs from "./ProjectDetailTabs";

/**
 * Project Funding tab — displays funding summary and CAN breakdown for a project.
 * @returns {React.ReactElement | null}
 */
const ProjectFunding = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const projectId = id ? +id : -1;

    const [selectedFiscalYear, setSelectedFiscalYear] = React.useState(getCurrentFiscalYear());
    const fiscalYear = Number(selectedFiscalYear);

    /** @type {{data?: import("../../../types/ProjectTypes").Project | undefined, error?: Object, isLoading: boolean}} */
    const {
        data: project,
        error: projectError,
        isLoading: isProjectLoading
    } = useGetProjectByIdQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    const {
        data: fundingData,
        error: fundingError,
        isLoading: isFundingLoading
    } = useGetProjectFundingByIdQuery(
        { id: projectId, fiscalYear },
        {
            refetchOnMountOrArgChange: true,
            skip: !projectId || projectId === -1
        }
    );

    const { data: portfolios, isLoading: isPortfoliosLoading } = useGetPortfoliosQuery(
        { projectId },
        {
            refetchOnMountOrArgChange: true,
            skip: !projectId || projectId === -1
        }
    );

    /** @type {Map<number, string>} portfolioId → abbreviation */
    const portfolioAbbrevMap = React.useMemo(
        () => new Map((portfolios ?? []).map((p) => [p.id, p.abbreviation])),
        [portfolios]
    );

    const is404 = projectError?.status === 404;

    React.useEffect(() => {
        if (projectError && !is404) {
            navigate("/error");
        }
    }, [projectError, is404, navigate]);

    React.useEffect(() => {
        if (fundingError && fundingError?.status !== 404) {
            navigate("/error");
        }
    }, [fundingError, navigate]);

    if (isProjectLoading || isFundingLoading || isPortfoliosLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }

    if (is404) {
        return (
            <App breadCrumbName="Not Found">
                <h1 className="font-sans-2xl margin-0 text-brand-primary">Project Not Found</h1>
                <p className="margin-top-2">No project exists with ID {projectId}.</p>
            </App>
        );
    }

    if (projectError) {
        return null;
    }

    return (
        <App breadCrumbName={project?.title}>
            <h1 className="font-sans-2xl margin-0 text-brand-primary">{project?.title}</h1>
            <h2 className="font-sans-3xs text-normal margin-top-1 margin-bottom-2">{project?.short_title}</h2>
            <div className="display-flex flex-justify margin-top-3">
                <ProjectDetailTabs projectId={projectId} />
                <FiscalYear
                    fiscalYear={selectedFiscalYear}
                    handleChangeFiscalYear={setSelectedFiscalYear}
                />
            </div>
            <section>
                <h2 className="font-sans-lg">Project Funding Summary</h2>
                <p className="font-sans-sm">
                    The summary below shows a breakdown of the project funding for the selected FY.
                </p>
                <ProjectFundingByPortfolioCard
                    fiscalYear={fiscalYear}
                    fundingByPortfolio={fundingData?.funding_by_portfolio ?? []}
                    portfolioAbbrevMap={portfolioAbbrevMap}
                />
                <div
                    className="display-flex flex-justify margin-top-2"
                    style={{ gap: "1rem" }}
                >
                    <ProjectFundingByCANCard
                        fiscalYear={fiscalYear}
                        fundingByCAN={fundingData?.funding_by_can ?? {}}
                    />
                    <ProjectFundingByFYCard
                        fiscalYear={fiscalYear}
                        fundingByFiscalYear={fundingData?.funding_by_fiscal_year ?? []}
                    />
                </div>
            </section>
            <section>
                <h2 className="font-sans-lg">Project Funding by CAN</h2>
                <p className="font-sans-sm">
                    This is a list of all CANs associated with this project for the selected FY.
                </p>
            </section>
            <DebugCode data={fundingData} />
        </App>
    );
};

export default ProjectFunding;
