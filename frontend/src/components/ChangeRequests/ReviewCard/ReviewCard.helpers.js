import { toSlugCase } from "../../../helpers/utils";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants";

/**
 * @param {CHANGE_REQUEST_TYPES} changeRequestType
 * @returns string
 */
export const titleGenerator = (changeRequestType) => {
    switch (changeRequestType) {
        case CHANGE_REQUEST_TYPES.PROCUREMENT_SHOP:
            return "Budget Change";
        default:
            return changeRequestType;
    }
};

/**
 * @param {CHANGE_REQUEST_TYPES} changeRequestType
 * @param {number} agreementId
 * @param {string} bliToStatus
 * @returns string
 */
export const urlGenerator = (changeRequestType, agreementId, bliToStatus) => {
    switch (changeRequestType) {
        case CHANGE_REQUEST_TYPES.BUDGET:
            return `/agreements/approve/${agreementId}?type=${toSlugCase(changeRequestType)}`;
        case CHANGE_REQUEST_TYPES.PROCUREMENT_SHOP:
            return `/agreements/approve/${agreementId}?type=${toSlugCase(changeRequestType)}`;
        default:
            return `/agreements/approve/${agreementId}?type=${toSlugCase(changeRequestType)}&to=${bliToStatus.toLowerCase()}`;
    }
};
