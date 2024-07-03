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
    if (logItem.event_type === "NEW") {
        return `${className} Created`;
    } else if (logItem.event_type === "UPDATED") {
        return `${className} Updated`;
    } else if (logItem.event_type === "DELETED") {
        return `${className} Deleted`;
    }
    return `${className} ${logItem.event_type}`;
};

const objectLogItemMessage = (logItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", logItem.target_class_name);
    const createdByName = logItem.created_by_user_full_name;
    let titleName = className;
    switch (logItem.event_type) {
        case "NEW":
            if (logItem.class_name === "BudgetLineItem") {
                return `${findObjectTitle(logItem)} created by ${createdByName}`;
            } else {
                return `${titleName} created by ${createdByName}`;
            }
        case "UPDATED":
            return `${titleName} updated by ${createdByName}`;
        case "DELETED":
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
        // const targetLabel =  logItem.property_key === "status" ?  renderField(null, "status", logItem.change.new) : propertyLabel;
        title = logItem.property_key === "status" ? `Status Change to ${renderField(null, "status", logItem.change.new)}` : `Budget Change to ${propertyLabel}`;
        if (logItem.event_type === "IN_REVIEW") {
            title += " In Review";
        } else if (logItem.event_type === "APPROVED") {
            title += "  Approved";
        } else if (logItem.event_type === "REJECTED") {
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
    if (!["UPDATED", "IN_REVIEW", "APPROVED", "REJECTED"].includes(eventType)) return;

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
    const messageAddendum = propertyLogItemMessageAddendum(logItem);
    const from = (
        <RenderProperty
            className={logItem.target_class_name}
            propertyKey={logItem.property_key}
            value={logItem.change.old}
            // id={change.fromId}
        />
    );
    const to = (
        <RenderProperty
            className={logItem.target_class_name}
            propertyKey={logItem.property_key}
            value={logItem.change.new}
            // id={change.toId}
        />
    );

    return (
        <>
            {messageBeginning}
            {shouldRenderDetails && (
                <>
                    {" "}
                    from {from} to {to}
                </>
            )}{" "}
            by {createdBy}. {messageAddendum}
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

const propertyLogItemMessageAddendum = (logItem) => {
    let msg = "";
    if (logItem.event_class_name === "BudgetLineItemChangeRequest") {
        if (logItem.event_type === "IN_REVIEW") {
            msg = ` This budget change is currently In Review for approval.`;
        } else if (logItem.event_type === "APPROVED") {
            // TODO: change these placeholder messages when working on approvals
            msg = ` This budget change has been approved.`;
        } else if (logItem.event_type === "REJECTED") {
            msg = ` This budget change has been rejected.`;
        }
    }
    return msg;
};

const relations = {
    procurement_shop_id: "procurement_shop",
    product_service_code_id: "product_service_code",
    project_id: "project",
    can_id: "can",
    project_officer_id: "project_officer"
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

const components = {
    project_officer_id: UserName,
    procurement_shop_id: ProcurementShopName,
    product_service_code_id: ProductServiceCodeName,
    project_id: ResearchProjectName,
    can_id: CanName
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
