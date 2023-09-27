import PropTypes from "prop-types";
import LogItem from "../../UI/LogItem";
import { convertCodeForDisplay, renderField } from "../../../helpers/utils";
import useGetUserFullNameFromId from "../../../helpers/user-hooks";
import {
    useGetNameForCanId,
    useGetNameForProcurementShopId,
    useGetNameForProductServiceCodeId,
    useGetNameForResearchProjectId
} from "../../../helpers/lookup-hooks";

const noDataMessage = "There is currently no history for this agreement.";

const findObjectTitle = (historyItem) => {
    return historyItem.event_details.display_name;
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
        title = "Budget Line " + title;
    }
    return title;
};

const changeMessageBeginning = (historyItem, change) => {
    let msg = `${change.propertyLabel} changed`;
    if (historyItem.class_name === "BudgetLineItem") {
        if (change.key !== "line_description") {
            msg = `Budget Line ${findObjectTitle(historyItem)} ${change.propertyLabel} changed`;
        } else {
            msg = `Budget Line ${change.propertyLabel} changed`;
        }
    }
    return msg;
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
        eventKey: "procurement_shop"
    },
    product_service_code_id: {
        eventKey: "product_service_code"
    },
    research_project_id: {
        eventKey: "research_project"
    },
    can_id: {
        eventKey: "can"
    },
    project_officer: {}
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
                preparedChange["to"] = historyItem.event_details[eventKey]?.display_name;
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
    project_officer: UserName,
    procurement_shop_id: ProcurementShopName,
    product_service_code_id: ProductServiceCodeName,
    research_project_id: ResearchProjectName,
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
    if (eventType !== "UPDATED") return;

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
    if (eventType !== "UPDATED") return;
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
        const messageBeginning = changeMessageBeginning(historyItem, change);
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
                by {createdBy}
            </LogItem>
        );
    });
};

const AgreementHistoryList = ({ agreementHistory }) => {
    if (!agreementHistory || agreementHistory.length === 0) {
        return <span className="font-12px">{noDataMessage}</span>;
    }

    const renderHistoryItem = (historyItem, index) => {
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
