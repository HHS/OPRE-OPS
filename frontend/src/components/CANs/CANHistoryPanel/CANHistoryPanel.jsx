import { useEffect, useState } from "react";
import InfiniteScroll from "../../Agreements/AgreementDetails/InfiniteScroll";
import { useGetCanHistoryQuery } from "../../../api/opsAPI";
import LogItem from "../../UI/LogItem";

/**
 * @typedef {Object} CanHistoryPanelProps
 * @property {number} canId
 */

/**
 * @param {CanHistoryPanelProps} props
 */

const CanHistoryPanel = ({ canId }) => {
    const [offset, setOffset] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    const [stopped, setStopped] = useState(false);
    /**
     * @type {CanHistoryItem[]}
     */
    const initialHistory = [];
    /**
     * @typedef {import('../../CANs/CANTypes').CanHistoryItem} CanHistoryItem
     * @type {[CanHistoryItem[], React.Dispatch<React.SetStateAction<CanHistoryItem[]>>]}
     */
    const [cantHistory, setCanHistory] = useState(initialHistory);

    const {
        data: canHistoryItems,
        error,
        isLoading
    } = useGetCanHistoryQuery({
        canId,
        limit: 5,
        offset: offset
    });

    useEffect(() => {
        if (canHistoryItems && canHistoryItems.length > 0) {
            console.log({ canHistoryItems });
            setCanHistory([...cantHistory, ...canHistoryItems]);
        }
        if (error) {
            setStopped(true);
        }
    }, [canHistoryItems]);

    const fetchMoreData = () => {
        if (stopped) return;
        if (!isFetching && !stopped) {
            setIsFetching(true);
            setOffset(offset + 5);
            setIsFetching(false);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {cantHistory.length > 0 ? (
                <div
                    className="overflow-y-scroll force-show-scrollbars"
                    style={{ height: "15rem" }}
                    data-cy="can-history-container"
                    role="region"
                    aria-live="polite"
                    aria-label="CAN History"
                >
                    <ul
                        className="usa-list--unstyled"
                        data-cy="can-history-list"
                    >
                        {cantHistory.map((item) => (
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
