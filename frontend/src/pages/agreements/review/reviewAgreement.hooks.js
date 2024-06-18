import * as React from "react";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { actionOptions } from "./ReviewAgreement.constants";
import suite from "./suite";

export const useReviewAgreement = (agreement, isSuccess) => {
    const [action, setAction] = React.useState(""); // for the action accordion
    const [budgetLines, setBudgetLines] = React.useState([]);
    const [pageErrors, setPageErrors] = React.useState({});
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [mainToggleSelected, setMainToggleSelected] = React.useState(false);
    const [notes, setNotes] = React.useState("");

    let res = suite.get();

    React.useEffect(() => {
        const newBudgetLines =
            agreement?.budget_line_items?.map((bli) => ({
                ...bli,
                selected: false, // for use in the BLI table
                actionable: false // based on action accordion
            })) ?? [];
        setBudgetLines(newBudgetLines);
    }, [agreement]);

    React.useEffect(() => {
        if (isSuccess) {
            suite({
                ...agreement
            });
        }
        return () => {
            suite.reset();
        };
    }, [isSuccess, agreement]);

    React.useEffect(() => {
        if (isSuccess && !res.isValid()) {
            setIsAlertActive(true);
            setPageErrors(res.getErrors());
        }
        return () => {
            setPageErrors({});
            setIsAlertActive(false);
        };
    }, [res, isSuccess]);

    const handleSelectBLI = (bliId) => {
        const newBudgetLines = budgetLines.map((bli) => {
            if (+bli.id === +bliId) {
                return {
                    ...bli,
                    selected: !bli.selected
                };
            }
            return bli;
        });

        setBudgetLines(newBudgetLines);
    };

    const handleActionChange = (action) => {
        setAction(action);
        setMainToggleSelected(false);

        const newBudgetLines = budgetLines.map((bli) => {
            switch (action) {
                case actionOptions.CHANGE_DRAFT_TO_PLANNED:
                    return {
                        ...bli,
                        selected: false,
                        actionable: bli.status === BLI_STATUS.DRAFT && !bli.in_review
                    };
                case actionOptions.CHANGE_PLANNED_TO_EXECUTING:
                    return {
                        ...bli,
                        selected: false,
                        actionable: bli.status === BLI_STATUS.PLANNED && !bli.in_review
                    };
                default:
                    return bli;
            }
        });
        setBudgetLines(newBudgetLines);
    };

    const toggleSelectActionableBLIs = () => {
        const BLIIsActionable = bli.actionable && !mainToggleSelected && !bli.in_review;
        const newBudgetLines = budgetLines.map((bli) => ({
            ...bli,
            selected: BLIIsActionable
        }));
        setBudgetLines(newBudgetLines);
    };

    return {
        action,
        setAction,
        budgetLines,
        setBudgetLines,
        handleSelectBLI,
        pageErrors,
        isAlertActive,
        res,
        handleActionChange,
        toggleSelectActionableBLIs,
        mainToggleSelected,
        setMainToggleSelected,
        notes,
        setNotes
    };
};

export default useReviewAgreement;
