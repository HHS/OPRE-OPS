import { useState, useEffect, useMemo } from "react";
import { useLazyGetProcurementTrackersByAgreementIdsQuery } from "../api/opsAPI";

const BATCH_SIZE = 50;

export const useGetAllProcurementTrackers = (agreementIds, options = {}) => {
    const [procurementTrackers, setProcurementTrackers] = useState([]);
    const [isLoading, setIsLoading] = useState(!options.skip);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);

    const idsKey = useMemo(() => JSON.stringify(agreementIds), [agreementIds]);

    const [trigger] = useLazyGetProcurementTrackersByAgreementIdsQuery();

    useEffect(() => {
        if (options.skip) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const batches = [];
                for (let i = 0; i < agreementIds.length; i += BATCH_SIZE) {
                    batches.push(agreementIds.slice(i, i + BATCH_SIZE));
                }

                const results = await Promise.all(batches.map((batch) => trigger(batch).unwrap()));

                if (!cancelled) {
                    setProcurementTrackers(results.flat());
                    setIsLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setIsError(true);
                    setError(err);
                    setIsLoading(false);
                }
            }
        };

        fetchAll();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger, idsKey, options.skip]);

    return { procurementTrackers, isLoading, isError, error };
};
