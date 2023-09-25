import PropTypes from "prop-types";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay, renderField } from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../helpers/user-hooks";
import {
    useGetNameForCanId,
    useGetNameForProcurementShopId,
    useGetNameForProductServiceCodeId,
    useGetNameForResearchProjectId,
} from "../../../helpers/lookup-hooks";

const noDataMessage = "There is currently no history for this agreement.";

const findObjectTitle = (historyItem) => {
    return historyItem.event_details.display_name;
};

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

const eventMessage = (historyItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    const createdByName = historyItem.created_by_user_full_name;
    let titleName = className;
    if (historyItem.class_name === "BudgetLineItem") titleName += ` ${findObjectTitle(historyItem)}`;
    if (historyItem.event_type === "NEW") {
        return `${titleName} created by ${createdByName}`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${titleName} updated by ${createdByName}`;
    } else if (historyItem.event_type === "DELETED") {
        return `${titleName} deleted by ${createdByName}`;
    }
    return `${className} ${historyItem.event_type} by ${createdByName}`;
};

const getPropertyLabel = (className, fieldName) => {
    if (className === "BudgetLineItem") return `${convertCodeForDisplay("budgetLineItemPropertyLabels", fieldName)}`;
    return convertCodeForDisplay("agreementPropertyLabels", fieldName);
};

const objectsToNames = (objects) => {
    return objects.map((obj) => obj.display_name);
};

const relations = {
    procurement_shop_id: {
        eventKey: "procurement_shop",
        lookupQuery: useGetNameForProcurementShopId,
    },
    product_service_code_id: {
        eventKey: "product_service_code",
        lookupQuery: useGetNameForProductServiceCodeId,
    },
    research_project_id: {
        eventKey: "research_project",
        lookupQuery: useGetNameForResearchProjectId,
    },
    can_id: {
        eventKey: "can",
        lookupQuery: useGetNameForCanId,
    },
    project_officer: {
        lookupQuery: useGetUserFullNameFromId,
    },
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
        if (["psc_fee_amount"].includes(key)) return;
        let preparedChange = {
            key: key,
            propertyLabel: getPropertyLabel(historyItem.class_name, key),
            createdOn: historyItem.created_on,
            createdByName: historyItem.created_by_user_full_name,
        };
        if ("collection_of" in change) {
            preparedChange["isCollection"] = true;
            preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, key + "_item");
            preparedChange["added"] = objectsToNames(change.added);
            preparedChange["deleted"] = objectsToNames(change.deleted);
        } else if (key in relations) {
            const eventKey = relations[key]["eventKey"];
            const lookupQuery = relations[key]["lookupQuery"];
            if (eventKey) {
                preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, eventKey);
                preparedChange["to"] = historyItem.event_details[eventKey]?.display_name;
            }
            if (lookupQuery) {
                if (!eventKey) {
                    preparedChange["to"] = change.new ? lookupQuery(change.new) : null;
                }
                preparedChange["from"] = change.old ? lookupQuery(change.old) : null;
            }
        } else {
            if (!["description", "notes"].includes(key)) {
                preparedChange["from"] = change.old;
                preparedChange["to"] = change.new;
            }
        }
        preparedChanges.push(preparedChange);
    });

    return preparedChanges;
};

/**
 * For a single history record create data for LogItems.  Convert the history record's changes object
 * into array of log items with an item for each field level change and for collection fields,
 * such as team_members, create an item for each added/removed member.
 * @param historyItem - a record from ops_db_history
 * @returns {*[]} - array of log items with title, createdOn, message fields
 */
const propertyLogItems = (historyItem) => {
    const eventType = historyItem.event_type;
    if (eventType !== "UPDATED") return;
    const preparedChanges = prepareChanges(historyItem);

    let logItems = [];

    preparedChanges.forEach((change) => {
        if (change.isCollection) {
            change.added.forEach((member) => {
                logItems.push({
                    title: `${change.propertyLabel} Added`,
                    createdOn: change.createdOn,
                    message: `${change.propertyLabel} ${member} added by ${change.createdByName}`,
                });
            });
            change.deleted.forEach((member) => {
                logItems.push({
                    title: `${change.propertyLabel} Removed`,
                    createdOn: change.createdOn,
                    message: `${change.propertyLabel} ${member} removed by ${change.createdByName}`,
                });
            });
        } else {
            let title = `${change.propertyLabel} Edited`;
            let msg = `${change.propertyLabel} changed`;
            if (historyItem.class_name === "BudgetLineItem") {
                if (change.key !== "line_description") {
                    msg = `Budget Line ${findObjectTitle(historyItem)} ${change.propertyLabel} changed `;
                } else {
                    msg = `Budget Line ${change.propertyLabel} changed `;
                }
                title = "Budget Line " + title;
            }

            if (typeof change.from != "undefined")
                msg += ` from ${renderField(historyItem.class_name, change.key, change.from)}`;
            if (typeof change.to != "undefined")
                msg += ` to ${renderField(historyItem.class_name, change.key, change.to)}`;
            msg += ` by ${change.createdByName}`;
            logItems.push({
                title: title,
                createdOn: change.createdOn,
                message: msg,
            });
        }
    });

    return logItems;
};

const AgreementHistoryList = ({ agreementHistory }) => {
    if (!(agreementHistory && agreementHistory.length > 0)) {
        return <span className="font-12px">{noDataMessage}</span>;
    }
    let logItems = [];

    agreementHistory.forEach(function (historyItem) {
        const eventType = historyItem["event_type"];

        // for creates, deletes just display one LogItem
        // and for updates convert change details into many LogItems
        if (["NEW", "DELETED"].includes(eventType)) {
            logItems.push({
                title: eventLogItemTitle(historyItem),
                createdOn: historyItem.created_on,
                message: eventMessage(historyItem),
            });
        } else if (eventType === "UPDATED") {
            const propLogItems = propertyLogItems(historyItem);
            logItems = logItems.concat(propLogItems);
        }
    });

    return (
        <>
            {logItems.length > 0 ? (
                <ul className="usa-list--unstyled" data-cy="agreement-history-list">
                    {logItems.map((item, index) => (
                        <LogItem
                            key={index}
                            title={item.title}
                            createdOn={item.createdOn}
                            message={item.message}
                        ></LogItem>
                    ))}
                </ul>
            ) : (
                <span className="font-12px">{noDataMessage}</span>
            )}
        </>
    );
};

AgreementHistoryList.propTypes = {
    agreementHistory: PropTypes.arrayOf(Object),
};

export default AgreementHistoryList;
