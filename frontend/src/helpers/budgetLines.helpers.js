import {NO_DATA} from "../constants";
import {getTypesCounts} from "../pages/cans/detail/Can.helpers";
import {formatDateNeeded, formatDateToMonthDayYear} from "./utils";
import {setAlert} from "../components/UI/Alert/alertSlice.js";
/** @typedef {import("../types/BudgetLineTypes").BudgetLine} BudgetLine */

/**
 * Enum representing the possible statuses of a budget line item.
 * @readonly
 * @enum {string}
 * @property {string} DRAFT - Initial status for newly created budget lines.
 * @property {string} PLANNED - Status for budget lines that have been planned but not yet executed.
 * @property {string} EXECUTING - Status for budget lines currently in execution phase.
 * @property {string} OBLIGATED - Status for budget lines that have been fully obligated.
 */
export const BLI_STATUS = {
    DRAFT: "DRAFT",
    PLANNED: "PLANNED",
    EXECUTING: "IN_EXECUTION",
    OBLIGATED: "OBLIGATED"
};

/**
 * Validates if the given budget line is an object.
 * @param {BudgetLine} budgetLine - The budget line to validate.
 * @throws {Error} Will throw an error if the budget line is not an object.
 */
const handleBLIProp = (budgetLine) => {
    if (typeof budgetLine !== "object") {
        throw new Error(`BudgetLine must be an object, but got ${typeof budgetLine}`);
    }
};

/**
 * Validates if the given budget lines parameter is an array.
 * @param {BudgetLine[]} budgetLines - The budget lines array to validate.
 * @throws {Error} Will throw an error if the budget lines parameter is not an array.
 */
const handleBLIArrayProp = (budgetLines) => {
    if (!Array.isArray(budgetLines)) {
        throw new Error(`BudgetLines must be an array, but got ${typeof budgetLines}`);
    }
};

/**
 * Returns the created date of a budget line in a formatted string.
 * If the budget line does not have a created_on property, returns today's date in a formatted string.
 *
 * @param {BudgetLine} budgetLine - The budget line object to get the created date from.
 * @returns {string} The formatted created date of the budget line.
 */
export const getBudgetLineCreatedDate = (budgetLine) => {
    handleBLIProp(budgetLine);
    const today = new Date();
    const formattedToday = formatDateToMonthDayYear(today);

    return budgetLine?.created_on ? formatDateToMonthDayYear(budgetLine.created_on) : formattedToday;
};

/**
 * Returns the total amount of a budget line.
 * @param {BudgetLine[]} budgetLines - The budget line to get the total amount from.
 * @returns {number} The total amount of the budget line.
 */
export const budgetLinesTotal = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines.reduce((n, {amount}) => n + (amount || 0), 0);
};

/**
 * Returns an array of budget lines filtered by status.
 * @param {BudgetLine[]} budgetLines - The budget lines to filter.
 * @param {string[]} status - The status to filter by.
 * @returns {BudgetLine[]} An array of budget lines filtered by status.
 */
export const getBudgetByStatus = (budgetLines, status) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.filter((bli) => status.includes(bli.status));
};

/**
 * Returns an array of budget lines that are OBE or not in draft status.
 * @param {BudgetLine[]} budgetLines - The budget lines to filter.
 * @returns {BudgetLine[]} An array of budget lines that are OBE or not in draft status.
 */
export const getNonDRAFTBudgetLines = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.filter((bli) => bli.is_obe || bli.status !== BLI_STATUS.DRAFT);
};

/**
 * Returns a boolean indicating if any of the budget lines are in review.
 * @param {BudgetLine[]} budgetLines - The budget lines to check.
 * @returns {boolean} Whether any of the budget lines are in review.
 */
export const hasBlIsInReview = (budgetLines) => {
    handleBLIArrayProp(budgetLines);
    return budgetLines?.some((bli) => bli.in_review);
};

/**
 * Returns a boolean indicating if any of the budget lines are obligated.
 * @param {BudgetLine[]} budgetLines - The budget lines to check.
 * @param {BLI_STATUS} status - The status to check.
 * @returns {boolean} Whether any of the budget lines are obligated.
 */
export const hasAnyBliInSelectedStatus = (budgetLines, status) => {
    if (!budgetLines?.length) {
        return false;
    }

    return budgetLines?.some((bli) => bli.status === status);
};

/**
 * Returns an array of budget lines grouped by services component.
 * @param {BudgetLine[]} budgetLines - The budget lines to group.
 * @returns {BudgetLine[]} An array of budget lines grouped by services component.
 */
export const groupByServicesComponent = (budgetLines) => {
    try {
        handleBLIArrayProp(budgetLines);

        return budgetLines
            .reduce((acc, budgetLine) => {
                const servicesComponentId = budgetLine.services_component_id;
                const index = acc.findIndex((item) => item.servicesComponentId === servicesComponentId);
                if (index === -1) {
                    acc.push({servicesComponentId, budgetLines: [budgetLine]});
                } else {
                    acc[index].budgetLines.push(budgetLine);
                }
                return acc;
            }, [])
            .sort((a, b) => {
                if (a.servicesComponentId === null) return 1;
                if (b.servicesComponentId === null) return -1;
                return a.servicesComponentId - b.servicesComponentId;
            });
    } catch (error) {
        console.error("Error in groupByServicesComponent:", error);
        return [];
    }
};

/**
 * Returns whether the given budget line is permanent.
 * @param {BudgetLine} budgetLine - The budget line to check.
 * @returns {boolean} Whether the budget line is permanent.
 */
export const isBLIPermanent = (budgetLine) => {
    handleBLIProp(budgetLine);

    return budgetLine?.created_on ? true : false;
};

/**
 * Returns the display can label of a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the can label from.
 * @returns {string} The can label of the budget line.
 * canDisplayName is for temporary BLIs, can.number is for permanent BLIs
 */
export const canLabel = (budgetLine) =>
    isBLIPermanent(budgetLine) ? budgetLine?.can?.display_name : budgetLine?.canDisplayName || "TBD";

/**
 * Returns display label of a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the BLI label from.
 * @returns {string} The BLI label of the budget line.
 */
export const BLILabel = (budgetLine) => (isBLIPermanent(budgetLine) ? budgetLine?.id : "TBD");

/**
 * @typedef ItemCount
 * @property {string} type
 * @property {number} count
 */
/**
 * @param {import("../types/BudgetLineTypes").BudgetLine[]} budgetlines
 * @returns {ItemCount[]}
 */
export const getAgreementTypesCount = (budgetlines) => {
    const budgetLinesAgreements = budgetlines?.filter((item) => item.agreement).map((item) => item.agreement);
    const uniqueBudgetLineAgreements =
        budgetLinesAgreements?.reduce((acc, item) => {
            // Skip if item is null or doesn't have a name
            if (!item?.name) return acc;

            if (!acc.some((existingItem) => existingItem?.name === item.name)) {
                acc.push(item);
            }
            return acc;
        }, []) ?? [];
    const agreementTypesCount = getTypesCounts(uniqueBudgetLineAgreements ?? [], "agreement_type");
    return agreementTypesCount;
};

/**
 * @param {BudgetLine[]} budgetlines
 * @returns {boolean}
 */
export const areAllBudgetLinesInReview = (budgetlines) => {
    if (budgetlines.length === 0) {
        return false;
    }
    return budgetlines.every((bl) => bl.in_review);
};

/**
 * Returns a tooltip label for a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the tooltip label from.
 * @returns {string} The tooltip label of the budget line.
 */
export const getTooltipLabel = (budgetLine) => {
    let label = "";
    if (budgetLine?.status === BLI_STATUS.EXECUTING) {
        label = "If you need to edit a budget line in Executing Status, please contact the budget team";
    } else if (budgetLine?.status === BLI_STATUS.OBLIGATED) {
        label = "Obligated budget lines cannot be edited";
    } else if (budgetLine?.is_obe === true) {
        label = "Budget lines that are overcome by events (OBE) cannot be edited";
    }
    return label;
};

/**
 * Returns the fee percentage of a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the fee percentage from.
 * @param {number} [currentProcShopFeePercentage=0] - The current procurement shop fee percentage.
 * @returns {number} The fee percentage of the budget line.
 */
export const calculateProcShopFeePercentage = (budgetLine, currentProcShopFeePercentage = 0) => {
    handleBLIProp(budgetLine);

    return budgetLine?.procurement_shop_fee ? budgetLine?.procurement_shop_fee?.fee || 0 : currentProcShopFeePercentage;
};
/**
 * Returns a description of the fee rate based on the budget line status.
 * @private
 * @param {BudgetLine} budgetLine - The budget line to get the fee rate description from.
 * @returns {string} The fee rate description of the budget line.
 */
const feeRateDescription = (budgetLine) => {
    handleBLIProp(budgetLine);

    return budgetLine.status === BLI_STATUS.OBLIGATED ? `FY ${budgetLine.fiscal_year} Fee Rate` : "Current Fee Rate";
};
/**
 * Returns a tooltip for the procurement shop fee of a budget line.
 * @param {BudgetLine} budgetLine - The budget line to get the tooltip from.
 * @param {number} [currentProcShopFeePercentage=0] - The current procurement shop fee percentage.
 * @returns {string} The tooltip for the procurement shop fee of the budget line.
 */
export const getProcurementShopFeeTooltip = (budgetLine, currentProcShopFeePercentage = 0) => {
    handleBLIProp(budgetLine);

    if (budgetLine?.status === BLI_STATUS.OBLIGATED && budgetLine?.procurement_shop_fee !== null) {
        const abbr = budgetLine.procurement_shop_fee?.procurement_shop.abbr || "";
        return `${feeRateDescription(budgetLine)}: ${abbr} ${calculateProcShopFeePercentage(budgetLine)}%`;
    } else {
        const abbr = budgetLine?.agreement?.procurement_shop?.abbr || "";
        return `${feeRateDescription(budgetLine)}: ${abbr} ${calculateProcShopFeePercentage(budgetLine, currentProcShopFeePercentage)}%`;
    }
};

/**
 * Returns a formatted label for the procurement shop based on the budget line status and fee.
 * @param {BudgetLine} budgetLine - The budget line to get the tooltip from.
 * @param {string} [procShopCode=NO_DATA] - The procurement shop code to include in the label.
 * @param {number} [currentProcShopFeePercentage=0] - The current procurement shop fee percentage.
 * @returns {string} The formatted procurement shop label.
 */
export const getProcurementShopLabel = (budgetLine, procShopCode = NO_DATA, currentProcShopFeePercentage = 0) => {
    handleBLIProp(budgetLine);

    if (budgetLine?.status === BLI_STATUS.OBLIGATED && budgetLine?.procurement_shop_fee !== null) {
        return `${procShopCode} - ${feeRateDescription(budgetLine)} : ${calculateProcShopFeePercentage(budgetLine)}%`;
    } else {
        return `${procShopCode} - ${feeRateDescription(budgetLine)} :  ${calculateProcShopFeePercentage(budgetLine, currentProcShopFeePercentage)}%`;
    }
};

/** Handles the export of budget line items to an Excel file.
 * Fetches all necessary data, including procurement shops, service components, and portfolios,
 * and maps them to the corresponding budget lines before exporting.
 *
 * @param {function} exportTableToXlsx - Function to export data to an Excel file.
 * @param {function} setIsExporting - Function to set the exporting state.
 * @param {object} filters - Filters to apply when fetching budget lines.
 * @param {BudgetLine[]} budgetLineItems - The initial list of budget line items.
 * @param {function} budgetLineTrigger - Function to fetch budget lines with pagination.
 * @param {function} procShopTrigger - Function to fetch procurement shops.
 * @param {function} serviceComponentTrigger - Function to fetch service component details by ID.
 * @param {function} portfolioTrigger - Function to fetch portfolio details by ID.
 */
export const handleExport = async (exportTableToXlsx, setIsExporting, filters, budgetLineItems, budgetLineTrigger, procShopTrigger, serviceComponentTrigger, portfolioTrigger) => {
    try {
        if (!budgetLineItems || budgetLineItems.length === 0) {
            return;
        }

        setIsExporting(true);
        const totalCount = budgetLineItems[0]._meta?.total_count ?? 0;
        const fetchLimit = 50;
        const totalPages = Math.ceil(totalCount / fetchLimit);

        const budgetLinePromises = Array.from({length: totalPages}, (_, page) =>
            budgetLineTrigger({
                filters,
                limit: fetchLimit,
                page
            })
        );
        let procShopResponses = [];
        try {
            procShopResponses = await procShopTrigger({}).unwrap();
        } catch (procShopError) {
            console.error("Failed to fetch procurement shops, using fallback values", procShopError);
        }
        const budgetLineResponses = await Promise.all(budgetLinePromises);
        const flattenedBudgetLineResponses = budgetLineResponses.flatMap((page) => page.data);

        // Get the service component name for each budget line individually
        const serviceComponentPromises = flattenedBudgetLineResponses
            .filter((budgetLine) => budgetLine?.services_component_id)
            .map((budgetLine) => serviceComponentTrigger(budgetLine.services_component_id).unwrap());

        const serviceComponentResponses = await Promise.all(serviceComponentPromises);

        // Get the Portfolio name for each budget line individually
        const portfolioPromises = flattenedBudgetLineResponses
            .filter((budgetLine) => budgetLine?.portfolio_id)
            .map((budgetLine) => portfolioTrigger(budgetLine.portfolio_id).unwrap()
            );

        const portfolioResponses = await Promise.all(portfolioPromises);

        /** @type {Record<number, {service_component_name: string}>, {portfolio_name: string}} */
        const budgetLinesDataMap = {};
        /** @type {Record<number, import("../../../types/AgreementTypes").ProcurementShop >} */
        const procShopMap = {};
        flattenedBudgetLineResponses.forEach((budgetLine) => {
            const agreementAwardingEntityId = budgetLine.agreement?.awarding_entity_id;
            if (agreementAwardingEntityId) {
                const procShop = procShopResponses.find((shop) => shop.id === agreementAwardingEntityId);
                if (procShop) {
                    procShopMap[budgetLine.id] = procShop.fee_percentage;
                }
            }
            const serviceComponentResponse = serviceComponentResponses.find(
                (resp) => resp && resp.id === budgetLine?.services_component_id
            );

            const portfolioResponse = portfolioResponses.find(
                (resp) => resp && resp.id === budgetLine?.portfolio_id
            );

            budgetLinesDataMap[budgetLine.id] = {
                service_component_name: serviceComponentResponse?.display_name || "TBD", // Use optional chaining and fallback
                portfolio_name: portfolioResponse?.name || NO_DATA
            };
        });

        const header = [
            "BL ID #",
            "Portfolio",
            "Project",
            "Agreement",
            "SC",
            "Agreement Type",
            "Description",
            "Obligate By",
            "FY",
            "CAN",
            "SubTotal",
            "Procurement shop",
            "Procurement shop fee",
            "Procurement shop fee rate",
            "Status",
            "Comments"
        ];

        await exportTableToXlsx({
            data: flattenedBudgetLineResponses,
            headers: header,
            rowMapper:
                /** @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine */
                    (budgetLine) => {
                    const feeRate = calculateProcShopFeePercentage(budgetLine, procShopMap[budgetLine.id] || 0);
                    return [
                        budgetLine.id,
                        budgetLinesDataMap[budgetLine.id]?.portfolio_name,
                        budgetLine.agreement?.project?.title ?? NO_DATA,
                        budgetLine.agreement?.name ?? NO_DATA,
                        budgetLinesDataMap[budgetLine.id]?.service_component_name,
                        budgetLine.agreement?.agreement_type ?? NO_DATA,
                        budgetLine.line_description,
                        formatDateNeeded(budgetLine?.date_needed ?? ""),
                        budgetLine.fiscal_year,
                        budgetLine.can?.display_name ?? NO_DATA,
                        budgetLine.amount ?? 0,
                        budgetLine.procurement_shop_fee?.procurement_shop?.abbr ?? "None",
                        budgetLine.fees ?? 0,
                        feeRate,
                        budgetLine.in_review ? "In Review" : budgetLine?.status,
                        budgetLine.comments
                    ];
                },
            filename: "budget_lines",
            currencyColumns: [10, 12]
        });
    } catch (error) {
        console.error("Failed to export data:", error);
        setAlert({
            type: "error",
            heading: "Error",
            message: "An error occurred while exporting the data.",
            redirectUrl: "/error"
        });
    } finally {
        setIsExporting(false);
    }
};
