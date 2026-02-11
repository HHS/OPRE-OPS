import React from "react";

/**
 * A filter for CANs list.
 * @param {import ('./AgreementsFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 */
export const useAgreementsFilterButton = (filters, setFilters) => {
    const [fiscalYear, setFiscalYear] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);
    const [projectTitle, setProjectTitle] = React.useState([]);
    const [agreementType, setAgreementType] = React.useState([]);
    const [agreementName, setAgreementName] = React.useState([]);
    const [contractNumber, setContractNumber] = React.useState([]);

    // The useEffect() hook calls below are used to set the state appropriately when the filter tags (X) are clicked.
    React.useEffect(() => {
        if (filters.fiscalYear) {
            setFiscalYear(filters.fiscalYear);
        }
    }, [filters.fiscalYear]);

    React.useEffect(() => {
        if (filters.portfolio) {
            setPortfolio(filters.portfolio);
        }
    }, [filters.portfolio]);

    React.useEffect(() => {
        if (filters.projectTitle) {
            setProjectTitle(filters.projectTitle);
        }
    }, [filters.projectTitle]);

    React.useEffect(() => {
        if (filters.agreementType) {
            setAgreementType(filters.agreementType);
        }
    }, [filters.agreementType]);

    React.useEffect(() => {
        if (filters.agreementName) {
            setAgreementName(filters.agreementName);
        }
    }, [filters.agreementName]);

    React.useEffect(() => {
        if (filters.contractNumber) {
            setContractNumber(filters.contractNumber);
        }
    }, [filters.contractNumber]);

    const applyFilter = () => {
        setFilters((prevState) => {
            return {
                ...prevState,
                fiscalYear: fiscalYear,
                portfolio: portfolio,
                projectTitle: projectTitle,
                agreementType: agreementType,
                agreementName: agreementName,
                contractNumber: contractNumber
            };
        });
    };
    const resetFilter = () => {
        setFilters({
            fiscalYear: [],
            portfolio: [],
            projectTitle: [],
            agreementType: [],
            agreementName: [],
            contractNumber: []
        });
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
        applyFilter,
        resetFilter
    };
};

export default useAgreementsFilterButton;
