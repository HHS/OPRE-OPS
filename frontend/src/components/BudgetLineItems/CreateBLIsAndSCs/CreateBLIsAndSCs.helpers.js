import cryptoRandomString from "crypto-random-string";
import { cleanAgreementForApi, cleanBudgetLineItemsForApi, formatTeamMember } from "../../../helpers/agreement.helpers";
import { BLI_STATUS } from "../../../helpers/budgetLines.helpers";
import { formatDateForApi, renderField } from "../../../helpers/utils";

/**
 * Whether deleting this budget line routes through an approval change request instead of an
 * immediate hard delete. Mirrors the backend delete contract: DRAFT (or a super user) is hard-
 * deleted (HTTP 200); a non-super delete of a PLANNED/IN_EXECUTION line creates a deletion change
 * request (HTTP 202) and the line is left intact until approved. We infer this from the line's
 * status + the user's role (the same way the edit-via-change-request messaging is inferred), since
 * the delete mutation response does not surface the HTTP status code.
 *
 * Only PLANNED and IN_EXECUTION are approval-routed. Other statuses can't reach the delete control
 * here (deletability mirrors editability — EDITABLE_STATUSES is DRAFT/PLANNED/IN_EXECUTION — so
 * OBLIGATED, PLANNED_MOD, in-review, and OBE lines are not deletable in the wizard), so this returns
 * false for them, matching the DRAFT/super immediate-delete branch.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine - The budget line being deleted.
 * @param {boolean} isSuperUser - Whether the acting user is a super user.
 * @returns {boolean} True if the deletion routes to an approval change request.
 */
export const isDeletionRoutedToApproval = (budgetLine, isSuperUser) => {
    if (isSuperUser) return false;
    return budgetLine?.status === BLI_STATUS.PLANNED || budgetLine?.status === BLI_STATUS.EXECUTING;
};

/**
 * @param {number} agreementId - The id of the agreement.
 * @returns {string} The path to the agreement's budget lines page.
 */
export const getBudgetLinesUrl = (agreementId) => `/agreements/${agreementId}/budget-lines`;

/**
 *
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLineItem
 * @param {Array<import("../../../types/ServicesComponents").ServicesComponents>} createdServiceComponents
 */
export const addServiceComponentIdToBLI = (budgetLineItem, createdServiceComponents) => {
    let matchServiceComponent;
    // for new BLIs without a grouping label, match only on number
    if (!budgetLineItem.serviceComponentGroupingLabel) {
        matchServiceComponent = createdServiceComponents
            .filter((serviceComponent) => !serviceComponent.sub_component)
            .find((sC) => sC.number === budgetLineItem.services_component_number);
    } else {
        // for existing BLIs with a grouping label, match on full grouping label
        matchServiceComponent = createdServiceComponents.find((sc) => {
            const scGroupingLabel = sc.sub_component ? `${sc.number}-${sc.sub_component}` : `${sc.number}`;
            return scGroupingLabel === budgetLineItem.serviceComponentGroupingLabel;
        });
    }

    return {
        ...budgetLineItem,
        services_component_id: matchServiceComponent?.id ?? null,
        services_component_number: undefined, // Remove this property immutably
        serviceComponentGroupingLabel: undefined // Remove this property immutably
    };
};

/**
 * Grant analog of addServiceComponentIdToBLI. Resolves grant_number_id by matching the
 * editor-state grant_number_number against the (possibly just-created) grant numbers and
 * strips the UI-only key. See plan §9/§11.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLineItem
 * @param {Array<import("../../../types/GrantNumbers").GrantNumber>} createdGrantNumbers
 */
export const addGrantNumberIdToBLI = (budgetLineItem, createdGrantNumbers) => {
    // For persisted BLIs (have a grant_number_id), prefer ID-based matching so a renamed
    // grant number (same id, changed number) is not incorrectly disassociated on save.
    if (budgetLineItem.grant_number_id != null) {
        const byId = createdGrantNumbers.find((gn) => gn.id === budgetLineItem.grant_number_id);
        return {
            ...budgetLineItem,
            grant_number_id: byId?.id ?? null,
            grant_number_number: undefined
        };
    }
    // New BLIs have no ID yet — fall back to number matching.
    // When a grant number is deleted mid-edit its referencing BLIs retain their
    // grant_number_number but the number no longer resolves. Mirror the SC path
    // (addServiceComponentIdToBLI) and null the link so the BLI is disassociated
    // rather than causing an error.
    const matchGrantNumber = createdGrantNumbers.find((gn) => gn.number === budgetLineItem.grant_number_number);
    return {
        ...budgetLineItem,
        grant_number_id: matchGrantNumber?.id ?? null,
        grant_number_number: undefined
    };
};

/**
 * Build the message(s) describing pending financial change requests for an alert, in bullet points.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} tempBudgetLines - The temporary budget lines
 * @param {import("../../../types/CANTypes").CAN[]} cans - The CANs, used to resolve CAN display names
 * @returns {string} - The message(s) to display in the Alert in bullet points
 */
export const buildBudgetChangeMessages = (tempBudgetLines, cans) => {
    const budgetChangeMessages = new Set();
    const fieldsToCheck = ["date_needed", "can_id", "amount"];

    tempBudgetLines.forEach((tempBudgetLine) => {
        const bliId = `• BL ${tempBudgetLine?.id || "Unknown"}`;
        const { financialSnapshot, tempChangeRequest } = tempBudgetLine;

        fieldsToCheck.forEach((field) => {
            if (tempChangeRequest && tempChangeRequest[field] !== undefined) {
                let oldValue, newValue;

                switch (field) {
                    case "amount":
                        oldValue = renderField("ContractBudgetLineItem", "amount", financialSnapshot.originalAmount);
                        newValue = renderField("ContractBudgetLineItem", "amount", tempChangeRequest.amount);
                        budgetChangeMessages.add(`${bliId} Amount: ${oldValue} to ${newValue}`);
                        break;
                    case "date_needed":
                        oldValue = renderField(
                            "ContractBudgetLineItem",
                            "date_needed",
                            financialSnapshot.originalDateNeeded
                        );
                        newValue = renderField("ContractBudgetLineItem", "date_needed", tempChangeRequest.date_needed);
                        budgetChangeMessages.add(`${bliId} Obligate By Date: ${oldValue} to ${newValue}`);
                        break;
                    case "can_id":
                        oldValue =
                            cans?.find((can) => can.id === financialSnapshot.originalCanID)?.display_name || "Unknown";
                        newValue = cans?.find((can) => can.id === tempChangeRequest.can_id)?.display_name || "Unknown";
                        budgetChangeMessages.add(`${bliId} CAN: ${oldValue} to ${newValue}`);
                        break;
                }
            }
        });
    });

    return Array.from(budgetChangeMessages).join("\n");
};

/**
 * Shape the payload sent to POST /agreements when creating a new agreement, including its
 * not-yet-persisted services components / grant numbers / budget line items.
 * @param {Object} args
 * @param {import("../../../types/AgreementTypes").Agreement} args.agreement - The in-progress agreement.
 * @param {Array<import("../../../types/ServicesComponents").ServicesComponents>} args.servicesComponents
 * @param {Array<import("../../../types/GrantNumbers").GrantNumber>} args.grantNumbers
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} args.tempBudgetLines
 * @param {boolean} args.isGrant - Whether the agreement is a grant (links BLIs by grant number instead of SC).
 * @returns {Object} The payload for the create-agreement API call.
 */
export const buildNewAgreementBudgetPayload = ({
    agreement,
    servicesComponents,
    grantNumbers,
    tempBudgetLines,
    isGrant
}) => {
    const newServicesComponents = servicesComponents
        .filter((sc) => !("created_on" in sc))
        // eslint-disable-next-line no-unused-vars
        .map(({ display_title, has_changed, popStartDate, popEndDate, mode, ...sc }) => ({
            ...sc,
            ref: display_title
        }));

    const newGrantNumbers = grantNumbers
        .filter((gn) => !("created_on" in gn))
        // eslint-disable-next-line no-unused-vars
        .map(({ display_title, popStartDate, popEndDate, mode, has_changed, ...gn }) => ({
            ...gn,
            ref: display_title
        }));

    const newBudgetLineItems = tempBudgetLines
        .filter((budgetLineItem) => !("created_on" in budgetLineItem))
        .map((bli) => {
            if (isGrant) {
                // Link the new grant BLI to a not-yet-persisted grant number by ref.
                const matchedGrantNumber = newGrantNumbers.find((gn) => gn.number === bli.grant_number_number);
                // eslint-disable-next-line no-unused-vars
                const { grant_number_number, ...bliWithoutGnNumber } = bli;
                return {
                    ...bliWithoutGnNumber,
                    grant_number_ref: matchedGrantNumber?.ref ?? null
                };
            }

            const matchedServiceComponent = newServicesComponents.find(
                (sc) => sc.number === bli.services_component_number
            );

            // Create new object without services_component_number
            // eslint-disable-next-line no-unused-vars
            const { services_component_number, ...bliWithoutScNumber } = bli;

            return {
                ...bliWithoutScNumber,
                services_component_ref: matchedServiceComponent?.ref ?? null
            };
        });

    const data = {
        ...agreement,
        team_members: (agreement.team_members ?? []).map((team_member) => formatTeamMember(team_member)),
        requesting_agency_id: agreement.requesting_agency?.id ?? null,
        servicing_agency_id: agreement.servicing_agency?.id ?? null
    };
    // Remove unnecessary fields from data to cut down on payload size and reduce potential errors
    const { cleanData } = cleanAgreementForApi(data);
    const cleanBudgetLines = cleanBudgetLineItemsForApi(newBudgetLineItems);

    return {
        ...cleanData,
        budget_line_items: cleanBudgetLines,
        services_components: newServicesComponents,
        grant_numbers: newGrantNumbers
    };
};

/**
 * Resolve the services-component / grant-number links for an existing agreement's budget lines
 * once their (possibly just-created) SCs and grant numbers are known, ahead of sending the new
 * BLIs to the API.
 * @param {Object} args
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} args.tempBudgetLines
 * @param {boolean} args.isGrant
 * @param {Array<import("../../../types/ServicesComponents").ServicesComponents>} args.createdServiceComponents
 * @param {Array<import("../../../types/ServicesComponents").ServicesComponents>} args.existingServicesComponents
 * @param {Array<import("../../../types/GrantNumbers").GrantNumber>} args.createdGrantNumbers
 * @param {Array<import("../../../types/GrantNumbers").GrantNumber>} args.existingGrantNumbers
 * @returns {{newBudgetLineItemsWithIds: import("../../../types/BudgetLineTypes").BudgetLine[], existingBudgetLineItemsWithIds: import("../../../types/BudgetLineTypes").BudgetLine[]}}
 */
export const linkBudgetLinesToApi = ({
    tempBudgetLines,
    isGrant,
    createdServiceComponents,
    existingServicesComponents,
    createdGrantNumbers,
    existingGrantNumbers
}) => {
    const newBudgetLineItems = tempBudgetLines.filter((budgetLineItem) => !("created_on" in budgetLineItem));
    const existingBudgetLineItems = tempBudgetLines.filter((budgetLineItem) => "created_on" in budgetLineItem);
    const allServicesComponents = [...createdServiceComponents, ...existingServicesComponents];
    const allGrantNumbers = [...createdGrantNumbers, ...existingGrantNumbers];

    // Grant BLIs link via grant_number_id; contract/other BLIs via services_component_id.
    const addLinkToBLI = (bli) =>
        isGrant ? addGrantNumberIdToBLI(bli, allGrantNumbers) : addServiceComponentIdToBLI(bli, allServicesComponents);

    const newBudgetLineItemsWithIds = newBudgetLineItems.map((newBLI) => addLinkToBLI(newBLI));
    const existingBudgetLineItemsWithIds = existingBudgetLineItems.map((existingBLI) => addLinkToBLI(existingBLI));

    return { newBudgetLineItemsWithIds, existingBudgetLineItemsWithIds };
};

/**
 * Build the object-construction half of adding a new budget line item from the current form state.
 * @param {Object} args
 * @param {number|null} args.servicesComponentNumber
 * @param {number|null} args.grantNumberNumber
 * @param {string|null} args.enteredDescription
 * @param {import("../../../types/CANTypes").CAN|null} args.selectedCan
 * @param {import("../../../types/AgreementTypes").Agreement} args.selectedAgreement
 * @param {import("../../../types/AgreementTypes").ProcurementShop} args.selectedProcurementShop
 * @param {number|null} args.enteredAmount
 * @param {string|null} args.needByDate
 * @returns {import("../../../types/BudgetLineTypes").BudgetLine} The new budget line item.
 */
export const buildNewBudgetLineItem = ({
    servicesComponentNumber,
    grantNumberNumber,
    enteredDescription,
    selectedCan,
    selectedAgreement,
    selectedProcurementShop,
    enteredAmount,
    needByDate
}) => ({
    id: cryptoRandomString({ length: 10 }),
    services_component_number: servicesComponentNumber,
    grant_number_number: grantNumberNumber,
    line_description: enteredDescription || "",
    can_id: selectedCan?.id || null,
    can: selectedCan || null,
    canDisplayName: selectedCan?.display_name || null,
    agreement_id: selectedAgreement?.id || null,
    agreement: {
        procurement_shop: {
            ...selectedProcurementShop,
            current_fee: { fee: selectedProcurementShop?.fee_percentage ?? 0 }
        }
    },
    amount: enteredAmount || 0,
    status: BLI_STATUS.DRAFT,
    date_needed: formatDateForApi(needByDate),
    proc_shop_fee_percentage: selectedProcurementShop?.fee_percentage || null,
    fees: (enteredAmount ?? 0) * ((selectedProcurementShop?.fee_percentage ?? 0) / 100),
    _meta: { isEditable: true }
});

/**
 * Build the object-construction half of editing a budget line item from the current form state.
 * @param {Object} args
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} args.currentBudgetLine - The BLI being edited (from tempBudgetLines).
 * @param {import("../../../types/BudgetLineTypes").BudgetLine|undefined} args.originalBudgetLine - The BLI's pre-edit values (from the original budgetLines prop).
 * @param {number|null} args.servicesComponentNumber
 * @param {number|null} args.grantNumberNumber
 * @param {Array<import("../../../types/GrantNumbers").GrantNumber>} args.grantNumbers
 * @param {string|null} args.enteredDescription
 * @param {import("../../../types/CANTypes").CAN|null} args.selectedCan
 * @param {import("../../../types/AgreementTypes").Agreement} args.selectedAgreement
 * @param {import("../../../types/AgreementTypes").ProcurementShop} args.selectedProcurementShop
 * @param {number|null} args.enteredAmount
 * @param {string|null} args.needByDate
 * @param {boolean} args.isGrant
 * @returns {import("../../../types/BudgetLineTypes").BudgetLine} The updated budget line item payload.
 */
export const buildEditedBudgetLinePayload = ({
    currentBudgetLine,
    originalBudgetLine,
    servicesComponentNumber,
    grantNumberNumber,
    grantNumbers,
    enteredDescription,
    selectedCan,
    selectedAgreement,
    selectedProcurementShop,
    enteredAmount,
    needByDate,
    isGrant
}) => {
    // Initialize financialSnapshot
    const financialSnapshot = {
        originalAmount: originalBudgetLine?.amount,
        originalDateNeeded: originalBudgetLine?.date_needed,
        originalCanID: originalBudgetLine?.can_id,
        enteredAmount: enteredAmount,
        needByDate: needByDate,
        selectedCanId: selectedCan?.id
    };

    // Initialize tempChangeRequest
    let tempChangeRequest = currentBudgetLine.tempChangeRequest || {};

    // Compare with the original values in financialSnapshot
    if (enteredAmount !== financialSnapshot.originalAmount) {
        tempChangeRequest.amount = enteredAmount;
    } else {
        delete tempChangeRequest.amount;
    }

    if (formatDateForApi(needByDate) !== financialSnapshot.originalDateNeeded) {
        tempChangeRequest.date_needed = formatDateForApi(needByDate);
    } else {
        delete tempChangeRequest.date_needed;
    }

    if (selectedCan?.id !== financialSnapshot.originalCanID) {
        tempChangeRequest.can_id = selectedCan?.id;
    } else {
        delete tempChangeRequest.can_id;
    }

    const financialSnapshotChanged = Object.keys(tempChangeRequest).length > 0;
    const BLIStatusIsPlannedOrExecuting =
        currentBudgetLine.status === BLI_STATUS.PLANNED || currentBudgetLine.status === BLI_STATUS.EXECUTING;

    // The SC dropdown only offers non-sub-component SCs, so an actual change here can only
    // ever land on a bare number. When the number is unchanged, preserve the original
    // grouping label as-is — it may carry a sub-component suffix (e.g. "2-A") that a bare
    // number would not match in addServiceComponentIdToBLI, silently dropping the BLI's SC
    // link on save.
    const serviceComponentGroupingLabel =
        servicesComponentNumber === currentBudgetLine.services_component_number
            ? currentBudgetLine.serviceComponentGroupingLabel
            : (servicesComponentNumber ?? 0).toString();

    // Keep grant_number_id in sync with the dropdown selection. Spreading currentBudgetLine
    // alone would retain the BLI's original (stale) grant_number_id, and both save paths key
    // off it: the non-bundle path's addGrantNumberIdToBLI resolves by id (ignoring the new
    // selection), and the bundle dirty-check compares grant_number_id (treating a
    // reassignment as no change). For an existing (persisted) grant number we stamp its id
    // now; for a not-yet-persisted in-session grant number there is no id yet, so null it and
    // let the save-time number/ref resolution link it.
    const selectedGrantNumber = grantNumbers?.find((gn) => gn.number === grantNumberNumber);
    const reassignedGrantNumberId =
        selectedGrantNumber && "created_on" in selectedGrantNumber ? selectedGrantNumber.id : null;

    const payload = {
        ...currentBudgetLine,
        // For grants, stamp the grant number key; do NOT re-stamp the SC fields (they would
        // rewrite the BLI as "SC 0" and break grouping). For contracts, keep the SC fields.
        ...(isGrant
            ? { grant_number_number: grantNumberNumber, grant_number_id: reassignedGrantNumberId }
            : {
                  services_component_number: servicesComponentNumber,
                  serviceComponentGroupingLabel
              }),
        line_description: enteredDescription || "",
        can_id: selectedCan?.id || null,
        can: selectedCan || null,
        canDisplayName: selectedCan?.display_name || null,
        agreement_id: selectedAgreement?.id || null,
        agreement: {
            ...currentBudgetLine.agreement,
            procurement_shop: {
                ...selectedProcurementShop,
                current_fee: { fee: selectedProcurementShop?.fee_percentage ?? 0 }
            }
        },
        amount: enteredAmount || 0,
        status: currentBudgetLine.status || BLI_STATUS.DRAFT,
        date_needed: formatDateForApi(needByDate),
        proc_shop_fee_percentage: selectedProcurementShop?.fee_percentage || null,
        financialSnapshot: {
            ...financialSnapshot,
            enteredAmount: enteredAmount,
            needByDate: formatDateForApi(needByDate),
            selectedCanId: selectedCan?.id
        },
        fees: ((enteredAmount ?? 0) * (selectedProcurementShop?.fee_percentage ?? 0)) / 100
    };

    if (financialSnapshotChanged && BLIStatusIsPlannedOrExecuting) {
        payload.financialSnapshotChanged = true;
        payload.tempChangeRequest = tempChangeRequest;
    } else {
        delete payload.financialSnapshotChanged;
        delete payload.tempChangeRequest;
    }

    return payload;
};

/**
 * Build the object-construction half of duplicating a budget line item.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine} budgetLine - The budget line being duplicated.
 * @param {string} loggedInUserFullName - The full name of the logged-in user, stamped as created_by.
 * @returns {import("../../../types/BudgetLineTypes").BudgetLine} The duplicated budget line item.
 */
export const buildDuplicatedBudgetLineItem = (budgetLine, loggedInUserFullName) => {
    const {
        services_component_id,
        services_component_number,
        grant_number_id,
        grant_number_number,
        line_description,
        can_id,
        can,
        agreement_id,
        amount,
        date_needed,
        proc_shop_fee_percentage
    } = budgetLine;

    return {
        id: cryptoRandomString({ length: 10 }),
        services_component_id,
        services_component_number,
        grant_number_id,
        grant_number_number,
        line_description,
        can_id,
        can,
        canDisplayName: can?.display_name || null,
        agreement_id,
        agreement: budgetLine.agreement,
        amount,
        date_needed,
        proc_shop_fee_percentage,
        status: BLI_STATUS.DRAFT,
        created_by: loggedInUserFullName,
        // Mirror handleAddBLI: a duplicated draft BLI must be editable so its
        // edit/delete/duplicate icons stay enabled. Without this the row reads
        // _meta?.isEditable as undefined and renders the disabled icons. (issue #6020)
        _meta: { isEditable: true }
    };
};
