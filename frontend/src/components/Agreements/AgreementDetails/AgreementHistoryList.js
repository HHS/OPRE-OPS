import PropTypes from "prop-types";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { Fragment } from "react";

const findObjectTitle = (historyItem) => {
    if (historyItem.class_name === "BudgetLineItem") {
        return historyItem.event_details.line_description;
    } else {
        return historyItem.event_details.name;
    }
};

const logItemTitle = (historyItem) => {
    const className = convertCodeForDisplay("className", historyItem.class_name);
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
    const className = convertCodeForDisplay("className", historyItem.class_name);
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

const relationsMap = {
    procurement_shop_id: "procurement_shop",
    product_service_code_id: "product_service_code",
    research_project_id: "research_project",
    can_id: "can",
    project_officer: null,
};

const ChangesDetails = ({ historyItem }) => {
    const rawChanges = historyItem.changes;
    const eventType = historyItem.event_type;
    if (eventType != "UPDATED") return;
    const preparedChanges = Object.entries(rawChanges).map(([key, change]) => {
        let preparedChange = {
            key: key,
            propertyLabel: getPropertyLabel(historyItem.class_name, key),
        };
        if ("collection_of" in change) {
            preparedChange["isCollection"] = true;
            preparedChange["added"] = objectsToJoinedNames(change.added);
            preparedChange["deleted"] = objectsToJoinedNames(change.deleted);
        } else if (key in relationsMap) {
            const rel = relationsMap[key];
            if (rel) {
                preparedChange["propertyLabel"] = getPropertyLabel(historyItem.class_name, rel);
                preparedChange["to"] = historyItem.event_details[rel].display_name;
            }
        } else {
            preparedChange["from"] = change.old;
            preparedChange["to"] = change.new;
        }
        return preparedChange;
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
    return (
        <>
            {agreementHistory && agreementHistory.length > 0 ? (
                <ul className="usa-list--unstyled" data-cy="agreement-history-list">
                    {agreementHistory.map((item, index) => (
                        <LogItem
                            key={index}
                            title={logItemTitle(item)}
                            createdOn={item.created_on}
                            message={summaryMessage(item)}
                        >
                            <ChangesDetails historyItem={item} />
                        </LogItem>
                    ))}
                </ul>
            ) : (
                <p>Sorry no history</p>
            )}
        </>
    );
};

AgreementHistoryList.propTypes = {
    agreementHistory: PropTypes.arrayOf(Object),
};

export default AgreementHistoryList;
