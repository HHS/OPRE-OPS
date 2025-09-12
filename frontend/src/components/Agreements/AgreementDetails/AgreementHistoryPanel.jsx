import { useState } from "react";
import InfiniteScroll from "./InfiniteScroll";
import { getAgreementHistoryByIdAndPage } from "../../../api/getAgreementHistory";
import LogItem from "../../UI/LogItem";

/**
 * @component
 * @param {Object} props - The component props.
 * @param {number} props.agreementId
 * @returns {JSX.Element} - The rendered component.
 */

const AgreementHistoryPanel = ({ agreementId }) => {
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

    const sortedAgreementHistory = agreementHistory?.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

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
                <ul
                    className="usa-list--unstyled"
                    data-cy="agreement-history-list"
                >
                    {sortedAgreementHistory?.map((item) => (
                        <LogItem
                        key={item.id}
                        title={item.history_title}
                        createdOn={item.timestamp}
                        message={item.history_message}
                    />
                ))}
                </ul>
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

export default AgreementHistoryPanel;
