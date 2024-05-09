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

const findObjectTitle = (historyItem) => {
    return historyItem.target_display_name;
};

const omitChangeDetailsFor = ["description", "notes", "comments"];

const eventLogItemTitle = (historyItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    if (historyItem.event_type === "NEW") {
        return `${className} Created`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${className} Updated`;
    } else if (historyItem.event_type === "DELETED") {
        return `${className} Deleted`;
    }
    return `${className} ${historyItem.event_type}`;
};

const propertyLogItemTitle = (historyItem, change) => {
    let title = `${change.propertyLabel} Edited`;
    if (historyItem.class_name === "BudgetLineItem") {
        title = `Budget Line ${change.propertyLabel} Edited`;
    } else if (historyItem.class_name === "BudgetLineItemChangeRequest") {
        if (historyItem.event_type === "IN_REVIEW") {
            title = `Edit to BL ${change.propertyLabel} In Review`;
        } else if (historyItem.event_type === "APPROVED") {
            title = `Edit to BL ${change.propertyLabel} Approved`;
        } else if (historyItem.event_type === "REJECTED") {
            title = `Edit to BL ${change.propertyLabel} Rejected`;
        } else {
            title = `${historyItem.event_type} ${change.propertyLabel} Edited`;
        }
    }
    return title;
};

const propertyLogItemMessageBeginning = (historyItem, change) => {
    let msg = `${change.propertyLabel} changed`;
    if (historyItem.class_name === "BudgetLineItem") {
        if (change.key !== "line_description") {
            msg = `${findObjectTitle(historyItem)} ${change.propertyLabel} changed`;
        } else {
            msg = `${change.propertyLabel} changed`;
        }
    } else if (historyItem.class_name === "BudgetLineItemChangeRequest") {
        msg = `${findObjectTitle(historyItem)} ${change.propertyLabel} edited`;
    }
    return msg;
};

const propertyLogItemMessageAddendum = (historyItem) => {
    let msg = "";
    if (historyItem.class_name === "BudgetLineItemChangeRequest") {
        if (historyItem.event_type === "IN_REVIEW") {
            msg = ` This budget change is currently In Review for approval.`;
        } else if (historyItem.event_type === "APPROVED") {
            // TODO: change these placeholder messages when working on approvals
            msg = ` This budget change has been approved.`;
        } else if (historyItem.event_type === "REJECTED") {
            msg = ` This budget change has been rejected.`;
        }
    }
    return msg;
};

const eventMessage = (historyItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    const createdByName = historyItem.created_by_user_full_name;
    let titleName = className;
    switch (historyItem.event_type) {
        case "NEW":
            if (historyItem.class_name === "BudgetLineItem") {
                return `${findObjectTitle(historyItem)} created by ${createdByName}`;
            } else {
                return `${titleName} created by ${createdByName}`;
            }
        case "UPDATED":
            return `${titleName} updated by ${createdByName}`;
        case "DELETED":
            if (historyItem.class_name === "BudgetLineItem") {
                return `${findObjectTitle(historyItem)} deleted by ${createdByName}`;
            } else {
                return `${titleName} deleted by ${createdByName}`;
            }

        default:
            return `${className} ${historyItem.event_type} by ${createdByName}`;
    }
};

const getPropertyLabel = (className, fieldName) => {
    if (["BudgetLineItem", "BudgetLineItemChangeRequest"].includes(className))
        return `${convertCodeForDisplay("budgetLineItemPropertyLabels", fieldName)}`;
    return convertCodeForDisplay("agreementPropertyLabels", fieldName);
};

const objectsToNames = (objects) => {
    return objects.map((obj) => obj.display_name);
};

const relations = {
    procurement_shop_id: {
        eventKey: "procurement_shop"
    },
    product_service_code_id: {
        eventKey: "product_service_code"
    },
    project_id: {
        eventKey: "project"
    },
    can_id: {
        eventKey: "can"
    },
    project_officer_id: {
        eventKey: "project_officer"
    }
};

/**
 * For a single history record process the changes field and convert the object
 * into array of changes with values of foreign keys resolved to display names
 * @returns {*[]} - array of changes
 * @param historyItem - a record from ops_db_history
 */
const prepareChanges = (historyItem) => {
    const rawChanges = historyItem.changes;
    let preparedChanges = [];

    Object.entries(rawChanges).forEach(([key, change]) => {
        // hiding changes with proc_shop_fee_percentage which seem confusing since it's changed by system
        if (["proc_shop_fee_percentage"].includes(key)) return;
        let preparedChange = {
            key: key,
            propertyLabel: getPropertyLabel(historyItem.class_name, key),
            createdOn: historyItem.created_on,
            createdByName: historyItem.created_by_user_full_name
        };
        if ("collection_of" in change) {
            preparedChange["isCollection"] = true;
            preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, key + "_item");
            preparedChange["added"] = objectsToNames(change.added);
            preparedChange["deleted"] = objectsToNames(change.deleted);
        } else if (key in relations) {
            preparedChange["isRelation"] = true;
            const eventKey = relations[key]["eventKey"];
            if (eventKey) {
                preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, eventKey);
                preparedChange["toId"] = change.new;
            } else {
                preparedChange["toId"] = change.new;
            }
            preparedChange["fromId"] = change.old;
        } else {
            if (!omitChangeDetailsFor.includes(key)) {
                preparedChange["from"] = change.old;
                preparedChange["to"] = change.new;
            }
        }
        preparedChanges.push(preparedChange);
    });

    return preparedChanges;
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

const RenderProperty = ({ className, propertyKey, value, id: lookupId }) => {
    if (typeof value !== "undefined") {
        if (value === null) return <>none</>;
        return <>{renderField(className, propertyKey, value)}</>;
    }
    if (components[propertyKey]) {
        if (!lookupId) return "none";
        const Component = components[propertyKey];
        return <Component id={lookupId} />;
    }
    return <>(unable to render value for {propertyKey})</>;
};

const CollectionLogItems = ({ historyItem, change, baseKey }) => {
    const eventType = historyItem.event_type;
    if (!["UPDATED"].includes(eventType)) return;

    let logItems = [];

    change.added.forEach((member) => {
        logItems.push({
            title: `${change.propertyLabel} Added`,
            createdOn: change.createdOn,
            message: `${change.propertyLabel} ${member} added by ${change.createdByName}`
        });
    });
    change.deleted.forEach((member) => {
        logItems.push({
            title: `${change.propertyLabel} Removed`,
            createdOn: change.createdOn,
            message: `${change.propertyLabel} ${member} removed by ${change.createdByName}`
        });
    });

    return (
        <>
            {logItems.map((logItem, index) => (
                <LogItem
                    key={`${baseKey}_${index}`}
                    title={logItem.title}
                    message={logItem.message}
                    createdOn={logItem.createdOn}
                />
            ))}
        </>
    );
};

const PropertyLogItems = ({ historyItem, baseKey }) => {
    const eventType = historyItem.event_type;
    if (!["UPDATED", "IN_REVIEW", "APPROVED", "REJECTED"].includes(eventType)) return;
    const preparedChanges = prepareChanges(historyItem);

    return preparedChanges.map((change, index) => {
        const key = `${baseKey}_${index}`;

        // for collections like, team_members, create log items for each item add/removed
        if (change.isCollection) {
            return (
                <CollectionLogItems
                    key={key}
                    historyItem={historyItem}
                    change={change}
                    baseKey={key}
                />
            );
        }

        const title = propertyLogItemTitle(historyItem, change);
        const createdOn = historyItem.created_on;
        const messageBeginning = propertyLogItemMessageBeginning(historyItem, change);
        const messageAddendum = propertyLogItemMessageAddendum(historyItem);
        const shouldRenderDetails = !omitChangeDetailsFor.includes(change.key);
        const from = (
            <RenderProperty
                className={historyItem.class_name}
                propertyKey={change.key}
                value={change.from}
                id={change.fromId}
            />
        );
        const to = (
            <RenderProperty
                className={historyItem.class_name}
                propertyKey={change.key}
                value={change.to}
                id={change.toId}
            />
        );
        const createdBy = change.createdByName;

        return (
            <LogItem
                key={key}
                title={title}
                createdOn={createdOn}
            >
                {messageBeginning}
                {shouldRenderDetails && (
                    <>
                        {" "}
                        from {from} to {to}
                    </>
                )}{" "}
                by {createdBy}. {messageAddendum}
            </LogItem>
        );
    });
};

const AgreementHistoryList = ({ agreementHistory }) => {
    if (!agreementHistory || agreementHistory.length === 0) {
        return <span className="font-12px">{noDataMessage}</span>;
    }

    const renderHistoryItem = (historyItem, index) => {
        console.log("~~~>>> renderHistoryItem historyItem.log_items", historyItem.log_items);
        // for create and delete, display a single log item
        if (["NEW", "DELETED"].includes(historyItem.event_type)) {
            return (
                <LogItem
                    key={index}
                    title={eventLogItemTitle(historyItem)}
                    message={eventMessage(historyItem)}
                    createdOn={historyItem.created_on}
                />
            );
        }
        // for updates, display a log item for each property change
        return (
            <PropertyLogItems
                key={index}
                historyItem={historyItem}
                baseKey={index}
            />
        );
    };

    return (
        <ul
            className="usa-list--unstyled"
            data-cy="agreement-history-list"
        >
            {agreementHistory.map(renderHistoryItem)}
        </ul>
    );
};

AgreementHistoryList.propTypes = {
    agreementHistory: PropTypes.arrayOf(Object)
};

export default AgreementHistoryList;
