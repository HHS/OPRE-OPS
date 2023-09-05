import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useGetAgreementHistoryByIdQuery } from "../../../api/opsAPI";
import AgreementHistoryList from "./AgreementHistoryList";
import InfiniteScroll from "./InfiniteScroll";
import { getAgreementHistoryByIdAndPage } from "../../../api/getAgreementHistory";

const AgreementHistoryPanel = ({ agreementId }) => {
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [stopped, setStopped] = useState(false);
    const [agreementHistory, setAgreementHistory] = useState([]);

    const fetchMoreData = async () => {
        console.log(`fetchMoreData> stopped: ${stopped}, page: ${page}`);
        if (stopped) return;
        setIsLoading(true);
        // Replace with your data fetching logic
        await getAgreementHistoryByIdAndPage(agreementId, page)
            .then(function (response) {
                setAgreementHistory([...agreementHistory, ...response]);
                setPage(page + 1);
                return response;
            })
            .catch(function (error) {
                // console.log(error);
                setStopped(true);
            });
        setIsLoading(false);
    };

    const noData = !agreementHistory || agreementHistory.length == 0;

    return (
        <div className="overflow-y-scroll" style={{ height: "15rem" }} tabIndex={0}>
            {stopped && noData ? (
                "Sorry, no history."
            ) : (
                <>
                    <AgreementHistoryList agreementHistory={agreementHistory} />
                    {!stopped && <InfiniteScroll fetchMoreData={fetchMoreData} isLoading={isLoading} />}
                </>
            )}
        </div>
    );
};

AgreementHistoryPanel.propTypes = {
    agreementId: PropTypes.number.isRequired,
};

export default AgreementHistoryPanel;
