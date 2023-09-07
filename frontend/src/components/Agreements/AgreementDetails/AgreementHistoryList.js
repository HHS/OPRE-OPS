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

const summaryMessage = (historyItem) => {
    const className = convertCodeForDisplay("className", historyItem.class_name);
    const userFullName = historyItem.created_by_user_full_name;
    const objectTitle = findObjectTitle(historyItem);
    const classAndTitle = `${className}, "${objectTitle}",`;
    if (historyItem.event_type === "NEW") {
        return `New ${classAndTitle} created by ${userFullName}.`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${classAndTitle} updated by ${userFullName}.`;
    } else if (historyItem.event_type === "DELETED") {
        return `${classAndTitle} deleted by ${userFullName}.`;
    }
    return `${className} ${historyItem.event_type} ${userFullName}`;
};

const getPropertyLabel = (className, fieldName) => {
    if (className === "BudgetLineItem") return convertCodeForDisplay("budgetLineItemPropertyLabels", fieldName);
    return convertCodeForDisplay("agreementPropertyLabels", fieldName);
};

const usersToNames = (users) => {
    return users.map((user) => user.full_name);
};

const ChangesDetails = ({ historyItem }) => {
    const rawChanges = historyItem.changes;
    const eventType = historyItem.event_type;
    if (eventType != "UPDATED") return;
    const preparedChanges = Object.entries(rawChanges).map(([key, change]) => {
        if ("collection_of" in change) {
            const added = change.collection_of == "User" ? usersToNames(change.added) : change.added;
            const deleted = change.collection_of == "User" ? usersToNames(change.deleted) : change.deleted;
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, key),
                isCollection: true,
                added: added,
                deleted: deleted,
            };
        } else if (key === "procurement_shop_id") {
            const new_val = historyItem.event_details?.procurement_shop?.name;
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, "procurement_shop"),
                to: new_val,
            };
        } else if (key === "product_service_code_id") {
            const new_val = historyItem.event_details?.product_service_code?.name;
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, "product_service_code"),
                to: new_val,
            };
        } else if (key === "project_officer") {
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, "project_officer"),
            };
        } else if (key === "research_project_id") {
            const new_val = historyItem.event_details?.research_project?.title;
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, "research_project"),
                to: new_val,
            };
        } else if (key === "can_id") {
            const new_val = historyItem.event_details?.can?.number;
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, "can"),
                to: new_val,
            };
        } else
            return {
                key: key,
                propertyLabel: getPropertyLabel(historyItem.class_name, key),
                from: change.old,
                to: change.new,
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
                                {change.added && <> added: {JSON.stringify(change.added)}</>}
                                {change.removed && <> removed: {JSON.stringify(change.deleted)}</>}
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
                            title={item.created_by_user_full_name}
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
