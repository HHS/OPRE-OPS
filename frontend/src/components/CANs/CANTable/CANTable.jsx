import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { opsApi } from "../../../api/opsAPI";
import { ITEMS_PER_PAGE, NO_DATA } from "../../../constants";
import PaginationNav from "../../UI/PaginationNav";
import CANTableLoading from "./CANTableLoading";
import { formatObligateBy } from "./CANTable.helpers";
import CANTableHead from "./CANTableHead";
import CANTableRow from "./CANTableRow";
import styles from "./style.module.css";

/**
 * CANTable component of CanList
 * @component
 * @typedef {import("../../../types/CANTypes").CAN} CAN
 * @param {Object} props
 * @param {CAN[]} props.cans - Array of CANs
 * @param {number} props.fiscalYear - Fiscal year to filter by
 * @param {string} props.sortConditions - The condition to sort the table on
 * @param {boolean} props.sortDescending - Whether the table should be sorted descending or not
 * @param {function} props.setSortConditions - The function responsible for updating the sort condition and direction
 * @returns {JSX.Element}
 */
const CANTable = ({ cans, fiscalYear, sortConditions, sortDescending, setSortConditions }) => {
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [fundingSummariesByCanId, setFundingSummariesByCanId] = React.useState({});
    const [hasFundingError, setHasFundingError] = React.useState(false);
    const cansPerPage = React.useMemo(
        () => cans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [cans, currentPage]
    );
    const getFundingCacheKey = React.useCallback((canId) => `${fiscalYear}-${canId}`, [fiscalYear]);
    const missingFundingCanIds = React.useMemo(
        () => cansPerPage.map((can) => can.id).filter((canId) => !fundingSummariesByCanId[getFundingCacheKey(canId)]),
        [cansPerPage, fundingSummariesByCanId, getFundingCacheKey]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [fiscalYear, cans]);

    useEffect(() => {
        if (missingFundingCanIds.length === 0) {
            setHasFundingError(false);
            return;
        }

        let isCancelled = false;
        setHasFundingError(false);

        const requests = missingFundingCanIds.map((canId) =>
            dispatch(
                opsApi.endpoints.getCanFunding.initiate({ id: canId, fiscalYear }, { forceRefetch: true })
            )
        );

        Promise.all(
            requests.map((request, index) => request.unwrap().then((data) => [missingFundingCanIds[index], data]))
        )
            .then((entries) => {
                if (!isCancelled) {
                    setFundingSummariesByCanId((currentSummaries) => ({
                        ...currentSummaries,
                        ...Object.fromEntries(entries.map(([canId, data]) => [getFundingCacheKey(canId), data]))
                    }));
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setHasFundingError(true);
                }
            });

        return () => {
            isCancelled = true;
            requests.forEach((request) => request.unsubscribe?.());
        };
    }, [dispatch, fiscalYear, getFundingCacheKey, missingFundingCanIds]);

    if (cans.length === 0) {
        return <p className="text-center">No CANs found</p>;
    }

    if (missingFundingCanIds.length > 0) {
        return <CANTableLoading />;
    }

    if (hasFundingError) {
        return <p className="text-center">Unable to load CAN funding details.</p>;
    }

    return (
        <>
            <table className={`usa-table usa-table--borderless width-full ${styles.tableHover}`}>
                <CANTableHead
                    onClickHeader={setSortConditions}
                    selectedHeader={sortConditions}
                    sortDescending={sortDescending}
                />
                <tbody>
                    {cansPerPage.map((can) => (
                        <CANTableRow
                            key={can.id}
                            canId={can.id}
                            name={can.display_name ?? NO_DATA}
                            nickname={can.nick_name ?? NO_DATA}
                            portfolio={can.portfolio.abbreviation}
                            fiscalYear={fiscalYear}
                            fundingSummary={fundingSummariesByCanId[getFundingCacheKey(can.id)]?.funding}
                            activePeriod={can.active_period ?? 0}
                            obligateBy={formatObligateBy(can.obligate_by)}
                        />
                    ))}
                </tbody>
            </table>

            {cans.length > ITEMS_PER_PAGE && (
                <PaginationNav
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    items={cans}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            )}
        </>
    );
};

export default CANTable;
