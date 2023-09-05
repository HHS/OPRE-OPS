import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useGetAgreementHistoryByIdQuery } from "../../../api/opsAPI";
import AgreementHistoryList from "./AgreementHistoryList";
import InfiniteScroll from "./InfiniteScroll";

const AgreementHistoryPanel = ({ agreementId }) => {
    const [page, setPage] = useState(1);
    const [prevFirstId, setPrevFirstId] = useState(0);
    const [stopped, setStopped] = useState(false);
    const [agreementHistory, setAgreementHistory] = useState([]);
    const { isSuccess, isFetching, data, error, isLoading } = useGetAgreementHistoryByIdQuery(
        { id: agreementId, page: page },
        {
            refetchOnMountOrArgChange: true,
        }
    );

    useEffect(() => {
        console.log(`isSuccess: ${isSuccess}`);
        if (isSuccess) {
            const firstId = data && data.length > 0 ? data[0].id : 0;
            console.log(`isFetching: ${isFetching}, isSuccess: ${isSuccess}, page: ${page}, firstId: ${firstId}`);
            console.log(data);
            data.forEach((item) => {
                console.log(`data.ID:${item.id}`);
            });
            // setAgreementHistory(data);
            if (firstId !== prevFirstId) {
                setAgreementHistory((prevHist) => [...prevHist, ...data]);
                setPrevFirstId(firstId);
            }
        }
    }, [isSuccess]);

    useEffect(() => {
        // if we run out of data (404) or have some other error then stop trying to get data
        if (error) {
            console.log("stopping for error", error);
            setStopped(true);
        }
    }, [error]);

    const fetchMoreData = () => {
        console.log(`fetchMoreData> isLoading:${isLoading}, page:${page}, stop:${stopped}`);
        if (isLoading || stopped || page > 5) {
            return;
        }
        setPage(page + 1);
    };

    const noData = !agreementHistory || agreementHistory.length == 0;

    return (
        <div className="overflow-y-scroll" style={{ height: "15rem" }} tabIndex={0}>
            {stopped && noData ? (
                "Sorry, no history."
            ) : (
                <>
                    <AgreementHistoryList agreementHistory={agreementHistory} />
                    <InfiniteScroll fetchMoreData={fetchMoreData} isLoading={isLoading} />
                </>
            )}
        </div>
    );
};

AgreementHistoryPanel.propTypes = {
    agreementId: PropTypes.number.isRequired,
};

export default AgreementHistoryPanel;
