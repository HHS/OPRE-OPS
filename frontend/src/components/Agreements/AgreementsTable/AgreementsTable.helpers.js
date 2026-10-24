import { formatDate } from "../../../helpers/utils";
import { getAgreementDisplayName } from "../../../helpers/agreement.helpers";

const handleAgreementProp = (agreement) => {
    if (typeof agreement !== "object") {
        throw new Error(`Agreement must be an object, but got ${typeof agreement}`);
    }
};

/**
 * Nickname-preferred agreement label for the agreements table row. Delegates to the
 * shared `getAgreementDisplayName` helper (see agreement.helpers.js) so all callers of
 * this table (AgreementTableRow, ProjectSpendingAgreementRow, ProcurementDetailsTableRow)
 * pick up the nickname-preference for free. Ref: issue #6144.
 */
export const getAgreementName = (agreement) => {
    handleAgreementProp(agreement);
    return getAgreementDisplayName(agreement);
};

export const getResearchProjectName = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.project?.title;
};

export const getAgreementContractNumber = (agreement) => {
    handleAgreementProp(agreement);

    return agreement?.contract_number;
};

export const getAgreementStartDate = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.sc_start_date ? formatDate(new Date(agreement.sc_start_date + "T00:00:00Z")) : "TBD";
};

export const getAgreementEndDate = (agreement) => {
    handleAgreementProp(agreement);
    return agreement.sc_end_date ? formatDate(new Date(agreement.sc_end_date + "T00:00:00Z")) : "TBD";
};

export const getProcurementShopDisplay = (agreement) => {
    handleAgreementProp(agreement);
    const shop = agreement.procurement_shop;
    if (!shop || !shop.abbr) {
        return "TBD";
    }
    return `${shop.abbr} - Fee Rate: ${shop.fee_percentage}%`;
};

/**
 * Determine the tooltip message for a locked (non-editable and/or non-deletable) agreement.
 *
 * The frontend-owned edit locks (not a team member, agreement type not developed yet) take
 * precedence over the backend's delete-specific lockedMessage, since the Edit and Delete icons
 * share this single tooltip whenever editing itself is disabled (see ChangeIcons.jsx). Only once
 * those are ruled out do we defer to the backend's message (e.g. a non-draft budget line, an
 * awarded agreement) — mirroring getTooltipLabel's precedence for budget line items.
 * @param {import("../../../types/AgreementTypes").Agreement} agreement
 * @param {boolean} isSuperUser
 * @returns {string}
 */
export const getAgreementLockedMessage = (agreement, isSuperUser, isAgreementTypeNotDeveloped) => {
    handleAgreementProp(agreement);

    const canUserEditAgreement = agreement._meta?.isEditable ?? false;

    if (!canUserEditAgreement) {
        return "Only team members on this agreement can edit or delete";
    }
    if (isAgreementTypeNotDeveloped && !isSuperUser) {
        return "This agreement cannot be edited because it is not developed yet, \nplease contact the Budget Team.";
    }
    if (agreement._meta?.lockedMessage) {
        return agreement._meta.lockedMessage;
    }
    return isSuperUser ? "" : "Disabled";
};
