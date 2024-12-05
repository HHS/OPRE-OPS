import React from "react";
import {
    useGetCansQuery,
    useGetProcurementShopsQuery,
    useGetProductServiceCodesQuery,
    useGetResearchProjectsQuery,
    useGetAgreementByIdQuery,
    useGetBudgetLineItemQuery
} from "../api/opsAPI";
import { totalBudgetLineAmountPlusFees, totalBudgetLineFeeAmount } from "../helpers/utils";

/**
 * This hook returns the display name given the id.
 * @param {number} id - The id of the Product Service Code.
 * @returns {string} - The display name of the related object.
 * @example
 * const displayName = useGetDisplayNameForProductServiceCodeId(1);
 */
export const useGetNameForProductServiceCodeId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetProductServiceCodesQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

/**
 * This hook returns the display name of a Procurement Shop given the id.
 * @param {number} id - The id of the Procurement Shop.
 * @returns {string} - The display name of the Procurement Shop.
 */
export const useGetNameForProcurementShopId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetProcurementShopsQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

/**
 * This hook returns the abbreviation of a Procurement Shop given the id.
 * @param {number} id - The id of the Procurement Shop.
 * @returns {string} - The abbreviation of the Procurement Shop.
 */
export const useGetAbbreviationForProcurementShopId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetProcurementShopsQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.abbr}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

/**
 * This hook returns the display name of a Research Project given the id.
 * @param {number} id - The id of the Research Project.
 * @returns {string} - The display name of the Research Project.
 */
export const useGetNameForResearchProjectId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetResearchProjectsQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

/**
 * This hook returns the display name of a CAN given the id.
 * @param {number} id - The id of the CAN.
 * @returns {string} - The display name of the CAN.
 */
export const useGetNameForCanId = (id) => {
    const [displayName, setDisplayName] = React.useState("unknown");

    const { data, isSuccess } = useGetCansQuery();

    React.useEffect(() => {
        if (isSuccess) {
            const item = data.find((element) => element.id === id);
            if (item) setDisplayName(`${item.display_name}`);
        }
    }, [id, data, isSuccess]);

    return displayName;
};


/**
 * This hook returns the display name of an Agreement given the id.
 * @param {number} id - The id of the Agreement.
 * @returns {string} - The display name of the Agreement.
 */
export const useGetAgreementName = (id) => {
    const [displayName, setDisplayName] = React.useState("TBD");
    const { data, isSuccess } = useGetAgreementByIdQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setDisplayName(data?.display_name);
        }
    }, [id, data, isSuccess]);

    return displayName;
};

/**
 * This hook returns the status of a Budget Line Item given the id.
 * @param {number} id - The id of the Budget Line Item.
 * @returns {string} - The status of the Budget Line Item.
 */
export const useGetBLIStatus = (id) => {
    const [status, setStatus] = React.useState("TBD");
    const { data, isSuccess } = useGetBudgetLineItemQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            setStatus(data?.status);
        }
    }, [id, data, isSuccess]);

    return status;
};

/**
 * This hook returns the total amount( plus fees) of a Budget Line Item given the id.
 * @param {number} id - The id of the Budget Line Item.
 * @returns {number} - The status of the Budget Line Item.
 */
export const useGetBLITotal = (id) => {
    const [amount, setAmount] = React.useState(0);
    const { data: budgetLine, isSuccess } = useGetBudgetLineItemQuery(id);

    React.useEffect(() => {
        if (isSuccess) {
            const feeTotal = totalBudgetLineFeeAmount(budgetLine?.amount, budgetLine?.proc_shop_fee_percentage);
            const budgetLineTotalPlusFees = totalBudgetLineAmountPlusFees(budgetLine?.amount, feeTotal);
            setAmount(budgetLineTotalPlusFees);
        }
    }, [id, budgetLine, isSuccess]);

    return amount;
};
