import PropTypes from "prop-types";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { Fragment } from "react";

const findObjectTitle = (historyItem) => {
    return historyItem.event_details.display_name;
};

const logItemTitle2 = (historyItem, changedPropertyLabel) => {
    const className = convertCodeForDisplay("baseClassNameLabels", historyItem.class_name);
    if (historyItem.event_type === "NEW") {
        return `${className} ${changedPropertyLabel} Created`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${className} ${changedPropertyLabel} Edited`;
    } else if (historyItem.event_type === "DELETED") {
        return `${className} Deleted`;
    }
    return `${className} ${changedPropertyLabel} ${historyItem.event_type}`;
};

const logItemTitle = (historyItem) => {
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

const summaryMessage = (historyItem) => {
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

const getPropertyLabel = (className, fieldName) => {
    if (className === "BudgetLineItem") return convertCodeForDisplay("budgetLineItemPropertyLabels", fieldName);
    return convertCodeForDisplay("agreementPropertyLabels", fieldName);
};

const objectsToJoinedNames = (objects) => {
    return objects.map((obj) => obj.display_name).join(", ");
};

const objectsToNames = (objects) => {
    return objects.map((obj) => obj.display_name);
};

const relationsMap = {
    procurement_shop_id: "procurement_shop",
    product_service_code_id: "product_service_code",
    research_project_id: "research_project",
    can_id: "can",
    project_officer: null,
};

const propertyLogItems = (historyItem) => {
    console.log("propertyLogItems");
    console.log("historyItem>>>", historyItem);
    const rawChanges = historyItem.changes;
    const eventType = historyItem.event_type;
    console.log(eventType);
    if (!["UPDATED", "NEW"].includes(eventType)) return;
    // if (eventType !== "UPDATED") return;
    const preparedChanges = Object.entries(rawChanges).map(([key, change]) => {
        let preparedChange = {
            key: key,
            propertyLabel: getPropertyLabel(historyItem.class_name, key),
        };
        if ("collection_of" in change) {
            preparedChange["isCollection"] = true;
            preparedChange["added"] = objectsToNames(change.added);
            preparedChange["deleted"] = objectsToNames(change.deleted);
        } else if (key in relationsMap) {
            const rel = relationsMap[key];
            if (rel) {
                preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, rel);
                preparedChange["to"] = historyItem.event_details[rel]?.display_name;
            }
        } else {
            preparedChange["from"] = change.old;
            preparedChange["to"] = change.new;
        }
        return preparedChange;
    });
    console.log("preparedChanges:", preparedChanges);

    const logItems = preparedChanges.map((change) => {
        let msg = "Changed";
        if (change.from) msg += ` from ${change.from}`;
        if (change.to) msg += ` to ${change.to}`;
        msg += ` by ${historyItem.created_by_user_full_name}`;
        return {
            title: logItemTitle2(historyItem, change.propertyLabel),
            createdOn: historyItem.created_on,
            message: msg,
        };
    });
    console.log("logItems:", logItems);

    return logItems;
};

const ChangesDetails = ({ historyItem }) => {
    const rawChanges = historyItem.changes;
    const eventType = historyItem.event_type;
    console.log(eventType);
    console.log(historyItem);
    if (["UPDATED", "NEW"].includes(eventType)) return;
    // if (eventType !== "UPDATED") return;
    const preparedChanges = Object.entries(rawChanges).map(([key, change]) => {
        let preparedChange = {
            key: key,
            propertyLabel: getPropertyLabel(historyItem.class_name, key),
        };
        if ("collection_of" in change) {
            preparedChange["isCollection"] = true;
            preparedChange["added"] = objectsToNames(change.added);
            preparedChange["deleted"] = objectsToNames(change.deleted);
        } else if (key in relationsMap) {
            const rel = relationsMap[key];
            if (rel) {
                preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, rel);
                preparedChange["to"] = historyItem.event_details[rel]?.display_name;
            }
        } else {
            preparedChange["from"] = change.old;
            preparedChange["to"] = change.new;
        }
        return preparedChange;
    });

    const logItems = preparedChanges.map((change) => {
        let msg = "???? Changed";
        if (change.from) msg += ` from ${change.from}`;
        if (change.to) msg += ` from ${change.to}`;
        return {
            title: logItemTitle2(historyItem, change.propertyLabel),
            createdOn: historyItem.created_on,
            message: msg,
        };
    });

    return (
        <dl>
            {preparedChanges.map((change, index) => (
                <Fragment key={index}>
                    <dt>{change.propertyLabel}</dt>
                    <dd>
                        {change.isCollection ? (
                            <>
                                {change.added?.length > 0 && <> added: {JSON.stringify(change.added)}</>}
                                {change.added?.length > 0 && change.deleted?.length > 0 && <>, </>}
                                {change.deleted?.length > 0 && <> removed: {JSON.stringify(change.deleted)}</>}
                            </>
                        ) : (
                            <>
                                changed {"from" in change && <>from &ldquo;{change.from}&rdquo; </>}
                                {"to" in change && <>to &ldquo;{change.to}&rdquo;</>}
                            </>
                        )}
                    </dd>
                </Fragment>
            ))}
        </dl>
    );
};

const AgreementHistoryList = ({ agreementHistory }) => {
    console.log("agreementHistory:", typeof agreementHistory, agreementHistory);
    if (!(agreementHistory && agreementHistory.length > 0)) {
        return <p>Sorry no history</p>;
    }
    let logItems = [];
    //
    // console.log(agreementHistory[1]);
    // const propLogItems = propertyLogItems(agreementHistory[1]);
    // logItems = logItems.concat(propLogItems);
    //
    // console.log("logItems.concat ===>", logItems);
    // let foo;
    agreementHistory.forEach(function (item) {
        console.log("item:", item);
        const propLogItems = propertyLogItems(item);
        logItems = logItems.concat(propLogItems);
    });
    // for (foo in agreementHistory) {
    //     console.log("item:", foo);
    //     // const propLogItems = propertyLogItems(item);
    //     // logItems = logItems.concat(propLogItems);
    // }
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

// const AgreementHistoryList = ({ agreementHistory }) => {
//     return (
//         <>
//             {agreementHistory && agreementHistory.length > 0 ? (
//                 <ul className="usa-list--unstyled" data-cy="agreement-history-list">
//                     {agreementHistory.map((item, index) => (
//                         <LogItem
//                             key={index}
//                             title={logItemTitle(item)}
//                             createdOn={item.created_on}
//                             message={summaryMessage(item)}
//                         >
//                             <ChangesDetails historyItem={item} />
//                         </LogItem>
//                     ))}
//                 </ul>
//             ) : (
//                 <p>Sorry no history</p>
//             )}
//         </>
//     );
// };

AgreementHistoryList.propTypes = {
    agreementHistory: PropTypes.arrayOf(Object),
};

export default AgreementHistoryList;
