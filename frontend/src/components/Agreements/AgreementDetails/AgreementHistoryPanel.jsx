import PropTypes from "prop-types";
import { useGetAgreementHistoryByIdQuery } from "../../../api/opsAPI";
import React from "react";
import { historyData } from "../../../pages/agreements/details/data";
import LogItem from "../../UI/LogItem";
import StatusTag from "../../UI/Tag/StatusTag";

const summaryMessage = (historyItem, created_by_user_full_name) => {
    let msg = "Message";
    if (historyItem.event_type === "NEW") {
        return `New ${historyItem.class_name} created by ${created_by_user_full_name}.`;
    } else if (historyItem.event_type === "UPDATED") {
        return `${historyItem.class_name} updated by ${created_by_user_full_name}.`;
    } else if (historyItem.event_type === "DELETED") {
        return `${historyItem.class_name} deleted by ${created_by_user_full_name}.`;
    }
    return `${historyItem.class_name} ${historyItem.event_type} ${created_by_user_full_name}`;
};

const ChangesDetails = ({ changes, eventType }) => {
    if (eventType != "UPDATED") return;
    console.log("ChangesDetails.changes:", changes);
    return (
        <dl>
            {Object.entries(changes).map(([key, value]) => (
                <>
                    <dt>{key}</dt>
                    <dd>
                        changed from &ldquo;{value.old}&rdquo; to &ldquo;{value.new}&rdquo;
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

    console.log("agreementHistory:", agreementHistory);
    // const historyData = Object.entries(agreementHistory).map(([key, hist]) => {
    //     let msg = "Message";
    //     if (hist.event_type === "NEW") {
    //         msg = `New ${hist.class_name} created.`;
    //     } else if (hist.event_type === "UPDATED") {
    //         msg = `${hist.class_name} updated.`;
    //         msg += buildChangeMessage(key, hist.changes, hist.event_type);
    //     }
    //     return {
    //         key: hist.id,
    //         title: hist.created_by_user_full_name,
    //         created_on: hist.created_on,
    //         message: msg,
    //     };
    // });
    // const historyData = agreementHistory.map((hist) => {
    //     let msg = "Message";
    //     if (hist.event_type === "NEW") {
    //         msg = `New ${hist.class_name} created.`;
    //     } else if (hist.event_type === "UPDATED") {
    //         msg = `${hist.class_name} updated. \n`;
    //         msg += buildChangeMessage(hist.changes, hist.event_type);
    //     }
    //     return {
    //         key: hist.id,
    //         title: hist.created_by_user_full_name,
    //         created_on: hist.created_on,
    //         message: msg,
    //     };
    // });
    console.log("historyData:", historyData);

    return (
        <>
            {historyData.length > 0 ? (
                <ul className="usa-list--unstyled overflow-y-scroll" style={{ height: "7.3125rem" }} tabIndex={0}>
                    {agreementHistory.map((item) => (
                        <LogItem
                            key={item.id}
                            title={item.created_by_user_full_name}
                            createdOn={item.created_on}
                            message={summaryMessage(item, item.created_by_user_full_name)}
                        >
                            <ChangesDetails changes={item.changes} eventType={item.event_type} />
                        </LogItem>
                    ))}
                </ul>
            ) : (
                <p>Sorry no history</p>
            )}
            <div>
                agreementId: {agreementId}
                <pre>{JSON.stringify(agreementHistory, null, 2)}</pre>
            </div>
        </>
    );
};

AgreementHistoryPanel.propTypes = {
    agreementId: PropTypes.number.isRequired,
};

export default AgreementHistoryPanel;
