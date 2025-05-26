import { useEffect, useState, useMemo } from "react";
import InfiniteScroll from "../../Agreements/AgreementDetails/InfiniteScroll";
import { useGetCanHistoryQuery } from "../../../api/opsAPI";
import LogItem from "../../UI/LogItem";

/**
 * @typedef {Object} CanHistoryPanelProps
 * @property {number} canId
 * @property {number} fiscalYear
 */

/**
 * @param {CanHistoryPanelProps} props
 */

const CanHistoryPanel = ({ canId, fiscalYear }) => {
    const [offset, setOffset] = useState(0);
    const [stopped, setStopped] = useState(false);
    /**
     * @type {CanHistoryItem[]}
     */
    const initialHistory = useMemo(() => [], []);
    /**
     * @typedef {import('../../../types/CANTypes').CanHistoryItem} CanHistoryItem
     * @type {[CanHistoryItem[], React.Dispatch<React.SetStateAction<CanHistoryItem[]>>]}
     */
    const [canHistory, setCanHistory] = useState(initialHistory);

    const {
        data: canHistoryItems,
        isError,
        isLoading,
        isFetching
    } = useGetCanHistoryQuery({
        canId,
        limit: 5,
        offset: offset,
        fiscalYear: fiscalYear
    });

    useEffect(() => {
        setOffset(0);
        setStopped(false);
        setCanHistory(initialHistory);
    }, [fiscalYear, initialHistory]);

    useEffect(() => {
        if (canHistoryItems && canHistoryItems.length > 0) {
            setCanHistory([...canHistory, ...canHistoryItems]);
        }
        if (!isLoading && canHistoryItems && canHistoryItems.length === 0) {
            setStopped(true);
        }
        if (isError) {
            setStopped(true);
        }
    }, [canHistoryItems, isLoading, isError, canHistory]);

    const fetchMoreData = () => {
        if (stopped) return;
        if (!isFetching) {
            setOffset(offset + 5);
        }
        return Promise.resolve();
    };
    const sortedCanHistory = canHistory.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return (
        <>
            {canHistory.length > 0 ? (
                <div
                    className="overflow-y-scroll force-show-scrollbars"
                    style={{ height: "15rem" }}
                    data-cy="can-history-container"
                    role="region"
                    aria-live="polite"
                    aria-label="CAN History"
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                    tabIndex={0}
                >
                    <ul
                        className="usa-list--unstyled"
                        data-cy="can-history-list"
                    >
                        {sortedCanHistory.map((item) => (
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
                            isLoading={isFetching}
                        />
                    )}
                </div>
            ) : (
                <p>No History</p>
            )}
        </>
    );
};

export default CanHistoryPanel;
