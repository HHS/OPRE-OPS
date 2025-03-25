import PropTypes from "prop-types";
import { useState } from "react";
import AgreementHistoryList from "./AgreementHistoryList";
import InfiniteScroll from "./InfiniteScroll";
import { getAgreementHistoryByIdAndPage } from "../../../api/getAgreementHistory";

/**
 * @component
 * @param {Object} props - The component props.
 * @param {number} props.agreementId
 * @param {string} props.agreementType
 * @returns {JSX.Element} - The rendered component.
 */

const AgreementHistoryPanel = ({ agreementId, agreementType }) => {
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [stopped, setStopped] = useState(false);
    const [agreementHistory, setAgreementHistory] = useState([]);

    const fetchMoreData = async () => {
        if (stopped) return;
        setIsLoading(true);
        await getAgreementHistoryByIdAndPage(agreementId, page)
            .then(function (response) {
                setAgreementHistory([...agreementHistory, ...response]);
                setPage(page + 1);
                return response;
            })
            .catch(function (error) {
                if (error.response.status !== 404) console.log("Error loading history:", error);
                setStopped(true);
            });
        setIsLoading(false);
    };

    return (
        <div
            className="overflow-y-scroll force-show-scrollbars"
            style={{ height: "15rem" }}
            data-cy="agreement-history-container"
            role="region"
            aria-live="polite"
            aria-label="Agreement History"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
        >
            <>
                <AgreementHistoryList
                    agreementHistory={agreementHistory}
                    agreementType={agreementType}
                />
                {!stopped && (
                    <InfiniteScroll
                        fetchMoreData={fetchMoreData}
                        isLoading={isLoading}
                    />
                )}
            </>
        </div>
    );
};

AgreementHistoryPanel.propTypes = {
    agreementId: PropTypes.number.isRequired
};

export default AgreementHistoryPanel;
