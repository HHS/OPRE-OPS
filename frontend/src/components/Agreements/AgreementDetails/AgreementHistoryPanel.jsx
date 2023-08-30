import PropTypes from "prop-types";
import { useGetAgreementHistoryByIdQuery } from "../../../api/opsAPI";
import { historyData } from "../../../pages/agreements/details/data";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay } from "../../../helpers/utils";

const findObjectTitle = (historyItem) => {
    if (historyItem.class_name === "BudgetLineItem") {
        return historyItem.event_details.line_description;
    } else {
        return historyItem.event_details.name;
    }
};

const summaryMessage = (historyItem) => {
    const className = convertCodeForDisplay("className", historyItem.class_name);
    const user_name = historyItem.created_by_user_full_name;
    const objectTitle = findObjectTitle(historyItem);
    const classAndTitle = `${className}, "${objectTitle}",`;
    if (historyItem.event_type === "NEW") {
        return `New ${classAndTitle} created by ${user_name}.`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${classAndTitle} updated by ${user_name}.`;
    } else if (historyItem.event_type === "DELETED") {
        return `${classAndTitle} deleted by ${user_name}.`;
    }
    return `${className} ${historyItem.event_type} ${user_name}`;
};

const getPropertyLabel = (className, fieldName) => {
    if (className === "BudgetLineItem") return convertCodeForDisplay("budgetLineItemPropertyLabels", fieldName);
    return convertCodeForDisplay("agreementPropertyLabels", fieldName);
};

const usersToNames = (users) => {
    return users.map((user) => user.full_name);
};

const ChangesDetails = ({ historyItem }) => {
    const changes = historyItem.changes;
    const eventType = historyItem.event_type;
    if (eventType != "UPDATED") return;
    console.log("ChangesDetails.changes:", changes);
    const prepChanges = Object.entries(changes).map(([key, change]) => {
        if ("collection_of" in change) {
            const added = change.collection_of == "User" ? usersToNames(change.added) : change.added;
            const deleted = change.collection_of == "User" ? usersToNames(change.deleted) : change.deleted;
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, key),
                isCollection: true,
                added: added,
                deleted: deleted,
            };
        } else if (key === "procurement_shop_id") {
            const new_val = historyItem.event_details?.procurement_shop?.name;
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, "procurement_shop"),
                to: new_val,
            };
        } else if (key === "product_service_code_id") {
            const new_val = historyItem.event_details?.product_service_code?.name;
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, "product_service_code"),
                to: new_val,
            };
        } else if (key === "project_officer") {
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, "project_officer"),
            };
        } else if (key === "research_project_id") {
            const new_val = historyItem.event_details?.research_project?.title;
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, "research_project"),
                to: new_val,
            };
        } else if (key === "can_id") {
            const new_val = historyItem.event_details?.can?.number;
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, "can"),
                to: new_val,
            };
        } else
            return {
                propertyLabel: getPropertyLabel(historyItem.class_name, key),
                from: change.old,
                to: change.new,
            };
    });

    return (
        <dl>
            {prepChanges.map((change) => (
                <>
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
                </>
            ))}
        </dl>
    );
};

const AgreementHistoryPanel = ({ agreementId }) => {
    const {
        data: agreementHistory,
        error: errorAgreementHistory,
        isLoading: isLoadingAgreementHistory,
    } = useGetAgreementHistoryByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
    });

    if (isLoadingAgreementHistory) {
        return <div>Loading...</div>;
    }
    if (errorAgreementHistory) {
        if (errorAgreementHistory.status === 404) {
            return <p>Sorry no history</p>;
        }
        return (
            <div>
                Oops, an error occurred
                <pre>{JSON.stringify(errorAgreementHistory, null, 2)}</pre>
            </div>
        );
    }

    if (!agreementHistory) {
        return <p>Sorry no history</p>;
    }

    return (
        <>
            {historyData.length > 0 ? (
                <ul
                    className="usa-list--unstyled overflow-y-scroll"
                    style={{ height: "15rem" }}
                    tabIndex={0}
                    data-cy="agreement-history-list"
                >
                    {agreementHistory.map((item) => (
                        <LogItem
                            key={item.id}
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

AgreementHistoryPanel.propTypes = {
    agreementId: PropTypes.number.isRequired,
};

export default AgreementHistoryPanel;
