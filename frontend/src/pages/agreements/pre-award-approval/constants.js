import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";

/**
 * BLI statuses that participate in pre-award validation.
 * DRAFT lines aren't yet committed for approval; OBLIGATED lines have already
 * completed the full award cycle and don't need pre-award checks.
 */
export const VALIDATABLE_BLI_STATUSES = [BLI_STATUS.PLANNED, BLI_STATUS.EXECUTING];
