import PropTypes from "prop-types";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay, formatDateNeeded } from "../../../helpers/utils";
import { Fragment } from "react";
import useGetUserFullNameFromId from "../../../helpers/user-hooks";
import {
    useGetNameForProductServiceCodeId,
    useGetNameForProcurementShopId,
    useGetNameForResearchProjectId,
    useGetNameForCanId,
} from "../../../helpers/lookup-hooks";
import { useGetCansQuery } from "../../../api/opsAPI";

const findObjectTitle = (historyItem) => {
    return historyItem.event_details.display_name;
};

const eventLogItemTitle = (historyItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    if (historyItem.event_type === "NEW") {
        return `New ${className} Created`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${className} Updated`;
    } else if (historyItem.event_type === "DELETED") {
        return `${className} Deleted`;
    }
    return `${className} ${historyItem.event_type}`;
};

const eventMessage = (historyItem) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    const classNameLower = className.toLowerCase();
    const classNameSentence = classNameLower.charAt(0).toUpperCase() + classNameLower.slice(1);
    const userFullName = historyItem.created_by_user_full_name;
    const objectTitle = findObjectTitle(historyItem);
    if (historyItem.event_type === "NEW") {
        return `New ${classNameLower}, “${objectTitle}”, created by ${userFullName}.`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${classNameSentence}, “${objectTitle}”, updated by ${userFullName}.`;
    } else if (historyItem.event_type === "DELETED") {
        return `${classNameSentence}, “${objectTitle}”, deleted by ${userFullName}.`;
    }
    return `${className} ${historyItem.event_type} ${userFullName}`;
};

const eventLogItem = (historyItem) => {
    if (!["NEW", "DELETED"].includes(eventType)) return;
    return {
        title: eventLogItemTitle(historyItem),
        createdOn: historyItem.created_on,
        message: eventMessage(historyItem),
    };
};

const propertyLogItemTitle = (historyItem, changedPropertyLabel) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    if (historyItem.event_type === "NEW") {
        return `${changedPropertyLabel} Created`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${changedPropertyLabel} Edited`;
    } else if (historyItem.event_type === "DELETED") {
        return `Deleted`;
    }
    return `${changedPropertyLabel} ${historyItem.event_type}`;
};

const getPropertyLabel = (className, fieldName) => {
    if (className === "BudgetLineItem") return convertCodeForDisplay("agreementHistoryBliFieldLogLabels", fieldName);
    return convertCodeForDisplay("agreementHistoryFieldLogLabels", fieldName);
};

const objectsToJoinedNames = (objects) => {
    return objects.map((obj) => obj.display_name).join(", ");
};

const objectsToNames = (objects) => {
    return objects.map((obj) => obj.display_name);
};

const relationsMap = {
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

const renderField = (fieldName, value) => {
    if (!fieldName || !value) return;
    switch (fieldName) {
        case "date_needed":
            return formatDateNeeded(value);
        case "amount":
            return "$" + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        default:
            return value;
    }
};

const prepareChanges = (historyItem) => {
    const rawChanges = historyItem.changes;
    const preparedChanges = Object.entries(rawChanges).map(([key, change]) => {
        // const propertyLabel = getPropertyLabel(historyItem.class_name, key);
        console.log(`~~~key: ${key}, change:`, change);
        let preparedChange = {
            key: key,
            propertyLabel: getPropertyLabel(historyItem.class_name, key),
        };
        if ("collection_of" in change) {
            preparedChange["isCollection"] = true;
            preparedChange["added"] = objectsToNames(change.added);
            preparedChange["deleted"] = objectsToNames(change.deleted);
        } else if (key in relationsMap) {
            const eventKey = relationsMap[key]["eventKey"];
            const lookupQuery = relationsMap[key]["lookupQuery"];
            if (eventKey) {
                preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, eventKey);
                preparedChange["to"] = historyItem.event_details[eventKey]?.display_name;
            }
            if (lookupQuery) {
                if (!eventKey) {
                    const newName = change.new ? lookupQuery(change.new) : null;
                    preparedChange["to"] = newName;
                }
                const oldName = change.old ? lookupQuery(change.old) : null;
                preparedChange["from"] = oldName;
            }
        } else {
            preparedChange["from"] = change.old;
            preparedChange["to"] = change.new;
        }
        return preparedChange;
    });
    return preparedChanges;
};

const propertyLogItems = (historyItem) => {
    console.log("propertyLogItems");
    console.log("historyItem>>>", historyItem);
    const eventType = historyItem.event_type;
    console.log(eventType);
    // if (!["UPDATED", "NEW"].includes(eventType)) return;
    if (eventType !== "UPDATED") return;
    const preparedChanges = prepareChanges(historyItem);
    console.log("preparedChanges:", preparedChanges);

    const logItems = preparedChanges.map((change) => {
        let msg = "Changed";
        if (change.from) msg += ` from ${renderField(change.key, change.from)}`;
        if (change.to) msg += ` to ${renderField(change.key, change.to)}`;
        msg += ` by ${historyItem.created_by_user_full_name}`;
        return {
            title: propertyLogItemTitle(historyItem, change.propertyLabel),
            createdOn: historyItem.created_on,
            message: msg,
        };
    });
    console.log("logItems:", logItems);

    return logItems;
};

const AgreementHistoryList = ({ agreementHistory }) => {
    console.log("agreementHistory:", typeof agreementHistory, agreementHistory);
    if (!(agreementHistory && agreementHistory.length > 0)) {
        return <p>Sorry no history</p>;
    }
    let logItems = [];

    agreementHistory.forEach(function (historyItem) {
        console.log("historyItem:", historyItem);
        const eventType = historyItem["event_type"];

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
                <p>Well now</p>
            )}
        </>
    );
};

AgreementHistoryList.propTypes = {
    agreementHistory: PropTypes.arrayOf(Object),
};

export default AgreementHistoryList;
