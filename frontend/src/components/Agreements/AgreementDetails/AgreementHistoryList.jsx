import PropTypes from "prop-types";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay, renderField } from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import {
    useGetNameForCanId,
    useGetNameForProcurementShopId,
    useGetNameForProductServiceCodeId,
    useGetNameForResearchProjectId
} from "../../../hooks/lookup.hooks";
import { useGetServicesComponentDisplayName } from "../../../hooks/useServicesComponents.hooks.js";

const HISTORY_EVENT_TYPE = {
    // standard event types
    NEW: "NEW",
    UPDATED: "UPDATED",
    DELETED: "DELETED",
    // change request event types
    IN_REVIEW: "IN_REVIEW",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED"
};

const noDataMessage = "There is currently no history for this agreement.";

const findObjectTitle = (logItem) => {
    return logItem.target_display_name;
};

const omitChangeDetailsFor = ["description", "notes", "comments"];

const logItemTitle = (logItem) => {
    if (logItem.scope === "OBJECT") {
        return objectLogItemTitle(logItem);
    } else {
        // PROPERTY or PROPERTY_COLLECTION_ITEM
        return propertyLogItemTitle(logItem);
    }
};

const objectLogItemTitle = (logItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", logItem.target_class_name);
    if (logItem.event_type === HISTORY_EVENT_TYPE.NEW) {
        return `${className} Created`;
    } else if (logItem.event_type === HISTORY_EVENT_TYPE.UPDATED) {
        return `${className} Updated`;
    } else if (logItem.event_type === HISTORY_EVENT_TYPE.DELETED) {
        return `${className} Deleted`;
    }
    return `${className} ${logItem.event_type}`;
};

const objectLogItemMessage = (logItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", logItem.target_class_name);
    const createdByName = logItem.created_by_user_full_name;
    let titleName = className;
    switch (logItem.event_type) {
        case HISTORY_EVENT_TYPE.NEW:
            if (logItem.class_name === "BudgetLineItem") {
                return `${findObjectTitle(logItem)} created by ${createdByName}`;
            } else {
                return `${titleName} created by ${createdByName}`;
            }
        case HISTORY_EVENT_TYPE.UPDATED:
            return `${titleName} updated by ${createdByName}`;
        case HISTORY_EVENT_TYPE.DELETED:
            if (logItem.class_name === "BudgetLineItem") {
                return `${findObjectTitle(logItem)} deleted by ${createdByName}`;
            } else {
                return `${titleName} deleted by ${createdByName}`;
            }

        default:
            return `${className} ${logItem.event_type} by ${createdByName}`;
    }
};

const getLogItemPropertyLabel = (logItem) => {
    if (logItem.scope === "PROPERTY_COLLECTION_ITEM")
        return getPropertyLabel(logItem.target_class_name, logItem.property_key + "_item");
    const key = logItem.property_key in relations ? relations[logItem.property_key] : logItem.property_key;
    return getPropertyLabel(logItem.target_class_name, key);
};

const getPropertyLabel = (className, fieldName) => {
    if (["BudgetLineItem", "BudgetLineItemChangeRequest"].includes(className))
        return `${convertCodeForDisplay("budgetLineItemPropertyLabels", fieldName)}`;
    return convertCodeForDisplay("agreementPropertyLabels", fieldName);
};

const propertyLogItemTitle = (logItem) => {
    const propertyLabel = getLogItemPropertyLabel(logItem);
    // NOTE: currently no collections are a part of change requests
    if (logItem.scope === "PROPERTY_COLLECTION_ITEM") {
        if (logItem.change.added) return `${propertyLabel} Added`;
        if (logItem.change.deleted) return `${propertyLabel} Removed`;
    }
    let title = `${propertyLabel} Edited`;
    if (logItem.event_class_name === "BudgetLineItem") {
        title = `Budget Line ${propertyLabel} Edited`;
    } else if (logItem.event_class_name === "BudgetLineItemChangeRequest") {
        title =
            logItem.property_key === "status"
                ? `Status Change to ${renderField(null, "status", logItem.change.new)}`
                : `Budget Change to ${propertyLabel}`;
        if (logItem.event_type === HISTORY_EVENT_TYPE.IN_REVIEW) {
            title += " In Review";
        } else if (logItem.event_type === HISTORY_EVENT_TYPE.APPROVED) {
            title += "  Approved";
        } else if (logItem.event_type === HISTORY_EVENT_TYPE.REJECTED) {
            title += "  Declined";
        } else {
            title = `${logItem.event_type} ${propertyLabel} Edited`;
        }
    }
    return title;
};

const LogItemMessage = ({ logItem }) => {
    if (logItem.scope === "OBJECT") {
        return <>{objectLogItemMessage(logItem)}.</>;
    }
    const eventType = logItem.event_type;
    const change = logItem.change;
    const createdBy = logItem.created_by_user_full_name;
    if (
        ![
            HISTORY_EVENT_TYPE.UPDATED,
            HISTORY_EVENT_TYPE.IN_REVIEW,
            HISTORY_EVENT_TYPE.APPROVED,
            HISTORY_EVENT_TYPE.IN_REVIEW
        ].includes(eventType)
    )
        return;

    if (logItem.scope === "PROPERTY_COLLECTION_ITEM") {
        if (change.added) {
            return (
                <>
                    {getLogItemPropertyLabel(logItem)} {change.added.display_name} added by {createdBy}.
                </>
            );
        }
        if (change.deleted) {
            return (
                <>
                    {getLogItemPropertyLabel(logItem)} {change.deleted.display_name} removed by {createdBy}.
                </>
            );
        }
    }

    const messageBeginning = propertyLogItemMessageBeginning(logItem);
    const shouldRenderDetails = !omitChangeDetailsFor.includes(logItem.property_key);
    const from = (
        <RenderProperty
            className={logItem.target_class_name}
            propertyKey={logItem.property_key}
            value={logItem.change.old}
        />
    );
    const to = (
        <RenderProperty
            className={logItem.target_class_name}
            propertyKey={logItem.property_key}
            value={logItem.change.new}
        />
    );

    // change requests
    if (logItem.event_class_name === "BudgetLineItemChangeRequest") {
        const changeType = logItem.property_key === "status" ? "status" : "budget";
        const requestedBy = logItem.changes_requested_by_user_full_name;
        if (logItem.event_type === HISTORY_EVENT_TYPE.IN_REVIEW) {
            return (
                <>
                    {requestedBy} requested a {changeType} change on {logItem.target_display_name} from {from} to {to}{" "}
                    and it&apos;s currently In Review for approval.
                </>
            );
        } else if (logItem.event_type === HISTORY_EVENT_TYPE.APPROVED) {
            return (
                <>
                    {createdBy} approved the {changeType} change on {logItem.target_display_name} from {from} to {to} as
                    requested by {requestedBy}.
                </>
            );
        } else if (logItem.event_type === HISTORY_EVENT_TYPE.REJECTED) {
            return (
                <>
                    {createdBy} declined the {changeType} change on {logItem.target_display_name} from {from} to {to} as
                    requested by {requestedBy}.
                </>
            );
        }
    }

    return (
        <>
            {messageBeginning}
            {shouldRenderDetails && (
                <>
                    {" "}
                    from {from} to {to}
                </>
            )}{" "}
            by {createdBy}.
        </>
    );
};

const propertyLogItemMessageBeginning = (logItem) => {
    const change = logItem.change;
    const propertyLabel = getLogItemPropertyLabel(logItem);
    let msg = `${propertyLabel} changed`;
    if (logItem.event_class_name === "BudgetLineItem") {
        if (change.key !== "line_description") {
            msg = `${findObjectTitle(logItem)} ${propertyLabel} changed`;
        } else {
            msg = `${propertyLabel} changed`;
        }
    } else if (logItem.event_class_name === "BudgetLineItemChangeRequest") {
        msg = `${findObjectTitle(logItem)} ${propertyLabel} edited`;
    }
    return msg;
};

const relations = {
    procurement_shop_id: "procurement_shop",
    product_service_code_id: "product_service_code",
    project_id: "project",
    can_id: "can",
    project_officer_id: "project_officer",
    services_component_id: "services_component"
};

const UserName = ({ id }) => {
    const name = useGetUserFullNameFromId(id);
    return <>{name}</>;
};

const ProcurementShopName = ({ id }) => {
    const name = useGetNameForProcurementShopId(id);
    return <>{name}</>;
};

const ProductServiceCodeName = ({ id }) => {
    const name = useGetNameForProductServiceCodeId(id);
    return <>{name}</>;
};

const ResearchProjectName = ({ id }) => {
    const name = useGetNameForResearchProjectId(id);
    return <>{name}</>;
};

const CanName = ({ id }) => {
    const name = useGetNameForCanId(id);
    return <>{name}</>;
};

const ServicesComponentName = ({ id }) => {
    const name = useGetServicesComponentDisplayName(id);
    return <>{name}</>;
};

const components = {
    project_officer_id: UserName,
    procurement_shop_id: ProcurementShopName,
    product_service_code_id: ProductServiceCodeName,
    project_id: ResearchProjectName,
    can_id: CanName,
    services_component_id: ServicesComponentName
};

const RenderProperty = ({ className, propertyKey, value }) => {
    if (components[propertyKey]) {
        const lookupId = value;
        if (!lookupId) return "none";
        const Component = components[propertyKey];
        return <Component id={lookupId} />;
    }
    if (typeof value !== "undefined") {
        if (value === null) return <>none</>;
        return <>{renderField(className, propertyKey, value)}</>;
    }

    return <>(unable to render value for {propertyKey})</>;
};

const AgreementHistoryList = ({ agreementHistory }) => {
    if (!agreementHistory || agreementHistory.length === 0) {
        return <span className="font-12px">{noDataMessage}</span>;
    }
    const allLogItems = agreementHistory.flatMap((historyItem) => historyItem.log_items);

    const renderHistoryLogItem = (logItem, index) => {
        // remove log items for changes that were made by a change request (which has its own log item)
        if (logItem.updated_by_change_request) return;
        return (
            <LogItem
                key={index}
                title={logItemTitle(logItem)}
                createdOn={logItem.created_on}
            >
                <LogItemMessage
                    logItem={logItem}
                    baseKey={index}
                />
            </LogItem>
        );
    };

    return (
        <ul
            className="usa-list--unstyled"
            data-cy="agreement-history-list"
        >
            {allLogItems.map(renderHistoryLogItem)}
        </ul>
    );
};

AgreementHistoryList.propTypes = {
    agreementHistory: PropTypes.arrayOf(Object)
};

export default AgreementHistoryList;
