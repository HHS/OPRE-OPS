import { calculatePercent } from "../../../helpers/utils";
import { AGREEMENT_TYPE_ORDER } from "./AgreementSpendingCards.constants";

/**
 * Transforms API agreement spending data into chart data format for HorizontalStackedBar
 * @param {Array} agreementTypes - Array of agreement type spending objects from API
 * @param {number} totalSpending - Total spending across all types
 * @returns {Array} Data array with { id, label, value, color, percent }
 */
export const transformToChartData = (agreementTypes, totalSpending) => {
    if (!agreementTypes || !Array.isArray(agreementTypes) || !totalSpending) {
        return [];
    }

    return AGREEMENT_TYPE_ORDER.flatMap((config) => {
        const typeData = agreementTypes.find((at) => at.type === config.type);
        const newAmount = Number(typeData?.new || 0);
        const continuingAmount = Number(typeData?.continuing || 0);

        const segments = [];

        if (newAmount > 0) {
            segments.push({
                id: config.type,
                label: `${config.label} (New)`,
                value: newAmount,
                color: config.color,
                percent: calculatePercent(newAmount, totalSpending)
            });
        }

        if (continuingAmount > 0) {
            segments.push({
                id: `${config.type}_CONTINUING`,
                label: `${config.label} (Continuing)`,
                value: continuingAmount,
                color: config.continuingColor,
                percent: calculatePercent(continuingAmount, totalSpending)
            });
        }

        return segments;
    });
};
