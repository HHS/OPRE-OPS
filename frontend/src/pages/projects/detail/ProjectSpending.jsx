import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import App from "../../../App";
import {
    useGetAgreementsByResearchProjectFilterQuery,
    useGetProjectByIdQuery,
    useGetProjectSpendingByIdQuery
} from "../../../api/opsAPI";
import DebugCode from "../../../components/DebugCode";
import FiscalYear from "../../../components/UI/FiscalYear";
import { getCurrentFiscalYear } from "../../../helpers/utils";
import ProjectDetailTabs from "./ProjectDetailTabs";
import ProjectSpendingAgreementsTable from "./ProjectSpendingAgreementsTable";

/**
 * Derives the default fiscal year to display.
 * Prefers the current FY if it exists in the spending data, otherwise falls back
 * to the highest available FY.
 *
 * @param {Record<string, number[]>} agreementsByFy - e.g. { "2043": [1, 2], "2044": [1] }
 * @returns {number} - The fiscal year to select by default.
 */
const getDefaultFY = (agreementsByFy) => {
    const availableFYs = Object.keys(agreementsByFy ?? {})
        .map(Number)
        .sort((a, b) => b - a);

    if (availableFYs.length === 0) return Number(getCurrentFiscalYear());

    const currentFY = Number(getCurrentFiscalYear());
    return availableFYs.includes(currentFY) ? currentFY : availableFYs[0];
};

/**
 * Project Spending tab — Phase 1 + 2.
 *
 * Phase 1: Fetches spending metadata and renders DebugCode.
 * Phase 2: Adds FY selector and Agreements table.
 * Phase 3 (future): Summary cards + donut chart.
 *
 * @returns {React.ReactElement | null}
 */
const ProjectSpending = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const projectId = id ? +id : -1;

    const [selectedFY, setSelectedFY] = React.useState(null);

    const {
        data: project,
        error: projectError,
        isLoading: isProjectLoading
    } = useGetProjectByIdQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    const {
        data: spendingData,
        error: spendingError,
        isLoading: isSpendingLoading
    } = useGetProjectSpendingByIdQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    const {
        data: allAgreements,
        error: agreementsError,
        isLoading: isAgreementsLoading
    } = useGetAgreementsByResearchProjectFilterQuery(projectId, {
        refetchOnMountOrArgChange: true,
        skip: !projectId || projectId === -1
    });

    // Set default FY once spending data arrives — all hooks must run before any early returns
    useEffect(() => {
        if (spendingData?.agreements_by_fy && selectedFY === null) {
            setSelectedFY(getDefaultFY(spendingData.agreements_by_fy));
        }
    }, [spendingData, selectedFY]);

    // FYs that have spending data, sorted descending — must be before early returns
    const availableFYs = React.useMemo(
        () =>
            Object.keys(spendingData?.agreements_by_fy ?? {})
                .map(Number)
                .sort((a, b) => b - a),
        [spendingData]
    );

    // Filter the full agreement list to only those active in the selected FY — must be before early returns
    const agreementsForFY = React.useMemo(() => {
        if (!allAgreements || !selectedFY) return [];
        const fyIds = new Set(spendingData?.agreements_by_fy?.[selectedFY] ?? []);
        const list = Array.isArray(allAgreements) ? allAgreements : (allAgreements?.agreements ?? []);
        return list.filter((a) => fyIds.has(a.id));
    }, [allAgreements, selectedFY, spendingData]);

    const is404 = projectError?.status === 404 || spendingError?.status === 404;
    const isLoading = isProjectLoading || isSpendingLoading;

    useEffect(() => {
        if ((projectError || spendingError || agreementsError) && !is404) {
            navigate("/error");
        }
    }, [projectError, spendingError, agreementsError, is404, navigate]);

    if (isLoading) {
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

    if (projectError || spendingError) {
        return null;
    }

    return (
        <App breadCrumbName={project?.title}>
            <h1 className="font-sans-2xl margin-0 text-brand-primary">{project?.title}</h1>
            <h2 className="font-sans-3xs text-normal margin-top-1 margin-bottom-2">{project?.short_title}</h2>
            <div className="display-flex flex-justify margin-top-3">
                <ProjectDetailTabs projectId={projectId} />
                {availableFYs.length > 0 && selectedFY !== null && (
                    <FiscalYear
                        fiscalYear={selectedFY}
                        handleChangeFiscalYear={(val) => setSelectedFY(Number(val))}
                        fiscalYears={availableFYs}
                    />
                )}
            </div>

            {/* ── Project Spending Summary ── */}
            <section>
                <h2 className="font-sans-lg">Project Spending Summary</h2>
                <p className="font-sans-sm text-base margin-top-1 margin-bottom-4">
                    The summary below shows a breakdown of the project total for the selected FY. Draft budget lines are
                    not included in the Totals.
                </p>
                {/* Phase 3: Summary cards + Donut chart go here */}
            </section>

            {/* ── Agreements ── */}
            <section className="margin-top-4">
                <h2 className="font-sans-lg">Agreements</h2>
                <p className="font-sans-sm text-base margin-top-1 margin-bottom-4">
                    This is a list of all agreements within this project for the selected FY.
                </p>
                {selectedFY !== null && (
                    <ProjectSpendingAgreementsTable
                        agreements={isAgreementsLoading ? [] : agreementsForFY}
                        fiscalYear={selectedFY}
                    />
                )}
            </section>

            <DebugCode
                title="Project Spending API Response"
                data={spendingData}
            />
        </App>
    );
};

export default ProjectSpending;
