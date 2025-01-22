import { useState } from "react";
import InfiniteScroll from "../../Agreements/AgreementDetails/InfiniteScroll";

const CanHistoryPanel = ({ canId, fetchMoreData, isLoading, stopped }) => {
    const [canHistory, setCantHistory] = useState([]);
    console.log(canHistory, setCantHistory, canId);

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

export default CanHistoryPanel;
