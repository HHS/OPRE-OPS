import _ from "lodash";

/**
 * Filters an array of budget line items based on the provided filters.
 * @param {Array<any>} budgetLineItems - The array of budget line items to filter.
 * @param {Object} filters - An object containing the filters to apply.
 * @param {Array<any>} filters.fiscalYears - An array of fiscal years to filter by.
 * @param {Array<any>} filters.portfolios - An array of portfolios to filter by.
 * @param {Array<any>} filters.bliStatus - An array of BLI statuses to filter by.
 * @returns {Array<any>} - The filtered array of budget line items.
 */

export const uniqueBudgetLinesFiscalYears = (budgetLineItems) => {
    const fiscalYears = budgetLineItems.map((bli) => bli.fiscal_year);
    return _.uniq(fiscalYears);
};

export const filterBudgetLineItems = (budgetLineItems, filters) => {
    let filteredBudgetLineItems = _.cloneDeep(budgetLineItems);

    // filter by fiscal year
    filteredBudgetLineItems = filteredBudgetLineItems.filter((bli) => {
        return (
            _.isNull(filters.fiscalYears) ||
            _.isEmpty(filters.fiscalYears) ||
            filters.fiscalYears.some((fy) => {
                return fy.id === bli.fiscal_year;
            })
        );
    });

    // filter by portfolio
    filteredBudgetLineItems = filteredBudgetLineItems.filter((bli) => {
        return (
            _.isNull(filters.portfolios) ||
            _.isEmpty(filters.portfolios) ||
            filters.portfolios.some((portfolio) => {
                return portfolio.id === bli.portfolio_id;
            })
        );
    });

    // filter by BLI status
    filteredBudgetLineItems = filteredBudgetLineItems.filter((bli) => {
        return (
            _.isNull(filters.bliStatus) ||
            _.isEmpty(filters.bliStatus) ||
            filters.bliStatus.some((bliStatus) => {
                return bliStatus.status === bli.status;
            })
        );
    });

    return filteredBudgetLineItems;
};

export const sortBLIs = (budgetLines) => {
    return budgetLines.sort((a, b) => {
        return new Date(a.date_needed) - new Date(b.date_needed);
    });
};

export const handleFilterByUrl = (myBudgetLineItemsUrl, filteredBudgetLineItems, agreements, activeUser) => {
    if (myBudgetLineItemsUrl) {
        const myBLIs = filteredBudgetLineItems.filter((budgetLine) => {
            const teamMembers = budgetLine.team_members;
            const agreement = agreements.find((agreement) => agreement.id === budgetLine.agreement_id);
            const projectOfficerId = agreement?.project_officer_id;

            return teamMembers?.some((teamMember) => {
                return teamMember.id === activeUser.id || projectOfficerId === activeUser.id;
            });
        });
        return sortBLIs(myBLIs);
    }
    // all-budget-line-items
    return sortBLIs(filteredBudgetLineItems);
};

export const addCanAndAgreementNameToBudgetLines = (sortedBLIs, cans, agreements) => {
    return sortedBLIs.map((budgetLine) => {
        const can = cans.find((can) => can.id === budgetLine.can_id);
        const agreement = agreements.find((agreement) => agreement.id === budgetLine.agreement_id);
        const procurementShopAbbr = agreement?.procurement_shop?.abbr;

        return {
            ...budgetLine,
            can_number: can?.number,
            agreement_name: agreement?.name,
            procShopCode: procurementShopAbbr
        };
    });
};
