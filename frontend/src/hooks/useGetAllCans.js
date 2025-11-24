import {useState, useEffect} from "react";
import {useLazyGetCansQuery} from "../api/opsAPI";

/**
 * Custom hook to fetch ALL CANs by making multiple paginated requests using RTK Query
 * @param {{ fiscalYear?: number }} params - Optional query parameters
 * @returns {{ cans: Array, isLoading: boolean, isError: boolean, error: any }}
 */
export const useGetAllCans = (params = {}) => {
    const [allCans, setAllCans] = useState([]);
    const [isLoadingAll, setIsLoadingAll] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorObj, setErrorObj] = useState(null);

    // Lazy query trigger for fetching all pages
    const [getCansTrigger] = useLazyGetCansQuery();

    useEffect(() => {
        let cancelled = false;

        const fetchAllPages = async () => {
            try {
                const limit = 50;

                const firstPageResponse = await getCansTrigger({
                    page: 0,
                    limit,
                    ...params
                }).unwrap();

                if (cancelled) return;

                const {cans: firstPageCans, count} = firstPageResponse;
                const totalPages = Math.ceil(count / limit);

                if (totalPages <= 1) {
                    if (!cancelled) {
                        setAllCans(firstPageCans);
                        setIsLoadingAll(false);
                    }
                    return;
                }

                const fetchPromises = [];
                for (let page = 1; page < totalPages; page++) {
                    fetchPromises.push(
                        getCansTrigger({
                            page,
                            limit,
                            ...params
                        }).unwrap()
                    );
                }

                const allResponses = await Promise.all(fetchPromises);

                if (!cancelled) {
                    const allRemainingCans = allResponses.flatMap((response) => response?.cans || []);
                    const combinedCans = [...firstPageCans, ...allRemainingCans];
                    setAllCans(combinedCans);
                    setIsLoadingAll(false);
                }
            } catch (err) {
                if (!cancelled) {
                    setHasError(true);
                    setErrorObj(err);
                    setIsLoadingAll(false);
                }
            }
        };

        fetchAllPages();

        return () => {
            cancelled = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getCansTrigger, params.fiscalYear]);

    return {
        cans: allCans,
        isLoading: isLoadingAll,
        isError: hasError,
        error: errorObj
    };
};
