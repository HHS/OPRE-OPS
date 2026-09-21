import React from "react";

/**
 * @param {import ('./AgreementsFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 * @param {boolean} showModal - Whether the filter modal is currently open.
 *   Used to reseed local buffers from parent state on each modal open, so that
 *   a Reset-without-Apply followed by re-opening shows the correct current filters.
 */
export const useAgreementsFilterButton = (filters, setFilters, showModal) => {
    const [fiscalYear, setFiscalYear] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);
    const [projectTitle, setProjectTitle] = React.useState([]);
    const [agreementType, setAgreementType] = React.useState([]);
    const [agreementName, setAgreementName] = React.useState([]);
    const [contractNumber, setContractNumber] = React.useState([]);
    const [awardType, setAwardType] = React.useState([]);

    // Reseed all local buffers from parent filters when the modal opens.
    // This ensures that a Reset-without-Apply followed by re-opening the modal
    // shows the current active filters, not the cleared-but-unapplied state.
    React.useEffect(() => {
        if (showModal) {
            setFiscalYear(filters.fiscalYear ?? []);
            setPortfolio(filters.portfolio ?? []);
            setProjectTitle(filters.projectTitle ?? []);
            setAgreementType(filters.agreementType ?? []);
            setAgreementName(filters.agreementName ?? []);
            setContractNumber(filters.contractNumber ?? []);
            setAwardType(filters.awardType ?? []);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showModal]);

    // Sync local buffers from parent filters whenever parent state changes.
    // This keeps the modal in sync when filter tags are removed (X clicked) externally.
    React.useEffect(() => {
        setFiscalYear(filters.fiscalYear ?? []);
    }, [filters.fiscalYear]);

    React.useEffect(() => {
        setPortfolio(filters.portfolio ?? []);
    }, [filters.portfolio]);

    React.useEffect(() => {
        setProjectTitle(filters.projectTitle ?? []);
    }, [filters.projectTitle]);

    React.useEffect(() => {
        setAgreementType(filters.agreementType ?? []);
    }, [filters.agreementType]);

    React.useEffect(() => {
        setAgreementName(filters.agreementName ?? []);
    }, [filters.agreementName]);

    React.useEffect(() => {
        setContractNumber(filters.contractNumber ?? []);
    }, [filters.contractNumber]);

    React.useEffect(() => {
        setAwardType(filters.awardType ?? []);
    }, [filters.awardType]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYear: fiscalYear,
                portfolio: portfolio,
                projectTitle: projectTitle,
                agreementType: agreementType,
                agreementName: agreementName,
                contractNumber: contractNumber,
                awardType: awardType
            };
        });
    };

    const resetFilter = () => {
        // Clear local buffers only — do NOT call setFilters here. This ensures Reset
        // does not fire a query and leaves the page-level FY dropdown unchanged.
        // The cleared state takes effect when the user clicks Apply.
        setFiscalYear([]);
        setPortfolio([]);
        setProjectTitle([]);
        setAgreementType([]);
        setAgreementName([]);
        setContractNumber([]);
        setAwardType([]);
    };

    return {
        fiscalYear,
        setFiscalYear,
        portfolio,
        setPortfolio,
        projectTitle,
        setProjectTitle,
        agreementType,
        setAgreementType,
        agreementName,
        setAgreementName,
        contractNumber,
        setContractNumber,
        awardType,
        setAwardType,
        applyFilter,
        resetFilter
    };
};

export default useAgreementsFilterButton;
