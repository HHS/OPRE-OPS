import { useState, useEffect } from "react";
import { useLazyGetCansQuery } from "../api/opsAPI";

/**
 * Custom hook to fetch ALL CANs by making multiple paginated requests using RTK Query
 * @returns {{ cans: Array, isLoading: boolean, isError: boolean, error: any }}
 */
export const useGetAllCans = () => {
    const [allCans, setAllCans] = useState([]);
    const [isLoadingAll, setIsLoadingAll] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorObj, setErrorObj] = useState(null);

    // Lazy query trigger for fetching all pages
    const [getCansTrigger] = useLazyGetCansQuery();

    useEffect(() => {
        const fetchAllPages = async () => {
            try {
                const limit = 50;

                // Fetch first page to get total count
                const firstPageResponse = await getCansTrigger({
                    page: 0,
                    limit
                }).unwrap();

                const { cans: firstPageCans, count } = firstPageResponse;
                const totalPages = Math.ceil(count / limit);

                // If everything fits in first page, we're done
                if (totalPages <= 1) {
                    setAllCans(firstPageCans);
                    setIsLoadingAll(false);
                    return;
                }

                // Fetch remaining pages in parallel
                const fetchPromises = [];
                for (let page = 1; page < totalPages; page++) {
                    fetchPromises.push(
                        getCansTrigger({
                            page,
                            limit
                        }).unwrap()
                    );
                }

                // Fetch all remaining pages in parallel
                const allResponses = await Promise.all(fetchPromises);

                // Combine all CANs from all pages
                const allRemainingCans = allResponses.flatMap((response) => response?.cans || []);
                const combinedCans = [firstPageCans, ...allRemainingCans];

                setAllCans(combinedCans);
                setIsLoadingAll(false);
            } catch (err) {
                setHasError(true);
                setErrorObj(err);
                setIsLoadingAll(false);
            }
        };

        fetchAllPages();
    }, [getCansTrigger]);

    return {
        cans: allCans,
        isLoading: isLoadingAll,
        isError: hasError,
        error: errorObj
    };
};
