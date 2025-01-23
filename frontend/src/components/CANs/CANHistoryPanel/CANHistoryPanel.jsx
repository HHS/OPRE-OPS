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
        isError,
        isLoading,
        isFetching
    } = useGetCanHistoryQuery({
        canId,
        limit: 5,
        offset: offset
    });

    useEffect(() => {
        if (canHistoryItems && canHistoryItems.length > 0) {
            setCanHistory([...cantHistory, ...canHistoryItems]);
        }
        if (!isLoading && canHistoryItems && canHistoryItems.length === 0) {
            setStopped(true);
        }
        if (isError) {
            setStopped(true);
        }
    }, [canHistoryItems]);

    const fetchMoreData = () => {
        if (stopped) return;
        if (!isFetching) {
            setOffset(offset + 5);
        }
        return Promise.resolve();
    };

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
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                    tabIndex={0}
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
