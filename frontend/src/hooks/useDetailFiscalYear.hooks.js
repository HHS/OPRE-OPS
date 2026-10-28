import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import { parseFiscalYearParam } from "../helpers/utils";
import { setDetailFiscalYear } from "../sessionUISlice";

/** A specific fiscal year as a number, or null (e.g. for "All" or a missing value). */
const toFiscalYear = (value) => parseFiscalYearParam(String(value ?? ""));

/** @returns {number | null} The fiscal year shared by the detail pages, if one has been chosen. */
const useSharedFiscalYear = () => useSelector((state) => state.sessionUI?.detailFiscalYear ?? null);

/**
 * The fiscal year for a portfolio, CAN or project detail page.
 *
 * These pages share one fiscal year for the session: picking a year on one of
 * them applies to the others, including pages visited earlier, so going back
 * (by breadcrumb or browser Back) shows the year the user last picked. List
 * pages keep their own fiscal year and hand it over when a row is opened (see
 * `useHandOverFiscalYear`).
 *
 * The page's year is the shared one; until there is one, the `?fy=` param
 * (from a link, a refresh or a copied URL), and failing that `fallbackFiscalYear`.
 * A `?fy=` year also becomes the shared one, so it survives a tab switch (tab
 * links carry no query) and applies to the pages before it.
 *
 * @param {number | string | null} [fallbackFiscalYear] - The page's default when no year has been chosen.
 * @returns {{ fiscalYear: number | string | null, setFiscalYear: (fiscalYear: number | string) => void }}
 */
export const useDetailFiscalYear = (fallbackFiscalYear = null) => {
    const dispatch = useDispatch();
    const sharedFiscalYear = useSharedFiscalYear();
    const [searchParams] = useSearchParams();
    const urlFiscalYear = parseFiscalYearParam(searchParams.get("fy"));
    const fiscalYear = sharedFiscalYear ?? urlFiscalYear ?? fallbackFiscalYear;

    useEffect(() => {
        if (sharedFiscalYear === null && urlFiscalYear) dispatch(setDetailFiscalYear(urlFiscalYear));
    }, [dispatch, sharedFiscalYear, urlFiscalYear]);

    const setFiscalYear = useCallback(
        (value) => {
            const next = toFiscalYear(value);
            if (next) dispatch(setDetailFiscalYear(next));
        },
        [dispatch]
    );

    return { fiscalYear, setFiscalYear };
};

/**
 * Keep the `?fy=` param in step with the fiscal year a detail page shows, so a
 * refresh or a copied URL opens the same year. The param is replaced in place
 * (no new history entry, location state kept) only when it would otherwise be
 * wrong; a page showing its default with no param is left alone.
 *
 * @param {number | string | null} shownFiscalYear - The fiscal year the page is showing.
 */
export const useSyncFiscalYearParam = (shownFiscalYear) => {
    const sharedFiscalYear = useSharedFiscalYear();
    const [searchParams, setSearchParams] = useSearchParams();
    const { state } = useLocation();
    const shown = toFiscalYear(shownFiscalYear);
    const inUrl = parseFiscalYearParam(searchParams.get("fy"));

    useEffect(() => {
        if (!shown || shown === inUrl || (inUrl === null && sharedFiscalYear === null)) return;
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set("fy", String(shown));
                return next;
            },
            { replace: true, state }
        );
    }, [shown, inUrl, sharedFiscalYear, setSearchParams, state]);
};

/**
 * For a list page's links into detail pages: hands the list's fiscal year to
 * the detail pages when the link is followed, so the page opens on that year.
 * A list showing all fiscal years hands nothing over, and the detail pages keep
 * their shared year. Clicks that open a new tab or window are ignored; that tab
 * reads `?fy=` from the link instead.
 *
 * @returns {(fiscalYear: number | string | null | undefined) => (event: React.MouseEvent) => void} An `onClick` factory.
 */
export const useHandOverFiscalYear = () => {
    const dispatch = useDispatch();
    return useCallback(
        (fiscalYear) => (event) => {
            const next = toFiscalYear(fiscalYear);
            const opensElsewhere =
                event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
            if (next && !opensElsewhere) dispatch(setDetailFiscalYear(next));
        },
        [dispatch]
    );
};
