import PropTypes from "prop-types";
import { useGetAgreementHistoryByIdQuery } from "../../../api/opsAPI";
import React from "react";
import { historyData } from "../../../pages/agreements/details/data";
import LogItem from "../../UI/LogItem";

const buildChangeMessage = ({change, eventType}) => {

}

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
    const historyData = agreementHistory.map((hist) => {
        let msg = "Message";
        if (hist.event_type === "NEW") {
            msg = `New ${hist.class_name} created.`;
        } else if (hist.event_type === "UPDATED") {
            msg = `${hist.class_name} updated.`;
        }
        return {
            key: hist.id,
            title: hist.created_by_user_full_name,
            created_on: hist.created_on,
            message: msg,
        };
    });
    console.log("historyData:", historyData);

    return (
        <>
            agreementId: {agreementId}
            <div>
                <pre>{JSON.stringify(agreementHistory, null, 2)}</pre>
            </div>
            {historyData.length > 0 ? (
                <ul className="usa-list--unstyled overflow-y-scroll" style={{ height: "7.3125rem" }} tabIndex={0}>
                    {historyData.map((item) => (
                        <LogItem key={item.key} title={item.title} createdOn={item.created_on} message={item.message} />
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
