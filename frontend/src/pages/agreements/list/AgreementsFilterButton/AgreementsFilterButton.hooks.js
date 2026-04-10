import React from "react";
import { getCurrentFiscalYear } from "../../../../helpers/utils";

/**
 * A filter for CANs list.
 * @param {import ('./AgreementsFilterTypes').Filters} filters - The current filters.
 * @param {Function} setFilters - A function to call to set the filters.
 * @param {boolean} useApproachB - Whether to use Approach B (UX requested) reset behavior.
 */
export const useAgreementsFilterButton = (filters, setFilters, useApproachB = false) => {
    const [fiscalYear, setFiscalYear] = React.useState([]);
    const [portfolio, setPortfolio] = React.useState([]);
    const [projectTitle, setProjectTitle] = React.useState([]);
    const [agreementType, setAgreementType] = React.useState([]);
    const [agreementName, setAgreementName] = React.useState([]);
    const [contractNumber, setContractNumber] = React.useState([]);
    const [awardType, setAwardType] = React.useState([]);
    const currentFiscalYear = getCurrentFiscalYear();

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

    React.useEffect(() => {
        if (filters.awardType) {
            setAwardType(filters.awardType);
        }
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

    // ============================================
    // TEMPORARY: A/B Testing - Different Reset behaviors
    // Approach A: Reset restores to current filters (NOT CURRENT - needs fix)
    // Approach B: Reset clears all selections (CURRENT behavior)
    // ============================================
    const resetFilter = () => {
        if (useApproachB) {
            // Approach B: Clear all selections (current behavior)
            setFiscalYear([]);
            setPortfolio([]);
            setProjectTitle([]);
            setAgreementType([]);
            setAgreementName([]);
            setContractNumber([]);
            setAwardType([]);
        } else {
            // Approach A: Restore to current filters
            setFiscalYear(filters.fiscalYear || []);
            setPortfolio(filters.portfolio || []);
            setProjectTitle(filters.projectTitle || []);
            setAgreementType(filters.agreementType || []);
            setAgreementName(filters.agreementName || []);
            setContractNumber(filters.contractNumber || []);
            setAwardType(filters.awardType || []);
        }
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
        resetFilter,
        currentFiscalYear
    };
};

export default useAgreementsFilterButton;
