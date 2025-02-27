import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useLazyGetBudgetLineItemQuery } from "../../../api/opsAPI";
import { getTypesCounts } from "../../../pages/cans/detail/Can.helpers";
import CANBudgetLineTable from "../../CANs/CANBudgetLineTable";
import PortfolioBudgetSummary from "../PortfolioBudgetSummary";

const PortfolioSpending = () => {
    const [budgetLineItems, setBudgetLineItems] = React.useState([]);
    const [budgetLineTypesCount, setBudgetLineTypesCount] = React.useState([]);
    const [agreementTypesCount, setAgreementTypesCount] = React.useState([]);
    // NOTE: Portfolio 1 with FY 2021 is a good example to test this component
    const {
        fiscalYear,
        budgetLineIds,
        projectTypesCount,
        inDraftFunding,
        totalFunding,
        inExecutionFunding,
        obligatedFunding,
        plannedFunding
    } = useOutletContext();
    // Lazy query hook
    const [trigger, { isLoading }] = useLazyGetBudgetLineItemQuery();
    const fetchBudgetLineItems = async () => {
        const promises = budgetLineIds.map((id) => {
            return trigger(id).unwrap();
        });

        try {
            const budgetLineItemsData = await Promise.all(promises);
            const filteredBudgetLineItems = budgetLineItemsData.filter((item) => item.fiscal_year === fiscalYear);
            setBudgetLineItems(filteredBudgetLineItems);
            const newBudgetLineTypesCount = getTypesCounts(filteredBudgetLineItems ?? [], "status");
            setBudgetLineTypesCount(newBudgetLineTypesCount);
            const budgetLinesAgreements = filteredBudgetLineItems?.map((item) => item.agreement) ?? [];
            const uniqueBudgetLineAgreements =
                budgetLinesAgreements?.reduce((acc, item) => {
                    if (!acc.some((existingItem) => existingItem.name === item.name)) {
                        acc.push(item);
                    }
                    return acc;
                }, []) ?? [];
            const newAgreementTypesCount = getTypesCounts(uniqueBudgetLineAgreements ?? [], "agreement_type");
            setAgreementTypesCount(newAgreementTypesCount);
        } catch (error) {
            console.error("Failed to fetch budgetLineItems:", error);
        }
    };

    useEffect(() => {
        // Reset states when fiscal year changes
        setBudgetLineItems([]);
        setBudgetLineTypesCount([]);
        setAgreementTypesCount([]);

        if (budgetLineIds?.length) {
            fetchBudgetLineItems();
        }
    }, [budgetLineIds, fiscalYear]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <h2 className="font-sans-lg">Portfolio Budget & Spending Summary</h2>
            <p className="font-sans-sm">
                The summary below shows the budget and spending for this Portfolio for the selected fiscal year.
            </p>
            <PortfolioBudgetSummary
                fiscalYear={fiscalYear}
                projectTypesCount={projectTypesCount}
                budgetLineTypesCount={budgetLineTypesCount}
                agreementTypesCount={agreementTypesCount}
                inDraftFunding={inDraftFunding}
                totalFunding={totalFunding}
                inExecutionFunding={inExecutionFunding}
                obligatedFunding={obligatedFunding}
                plannedFunding={plannedFunding}
            />
            <section>
                <h2>Portfolio Budget Lines</h2>
                <p>
                    This is a list of all budget lines allocating funding from this Portfolio&apos;s CANs for the
                    selected fiscal year.
                </p>
            </section>
            <CANBudgetLineTable
                budgetLines={budgetLineItems}
                totalFunding={totalFunding}
                fiscalYear={fiscalYear}
                tableType="portfolio"
            />
        </>
    );
};

export default PortfolioSpending;
