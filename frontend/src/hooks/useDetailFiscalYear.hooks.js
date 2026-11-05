import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import constants from "../constants";
import { breadcrumbAncestors, LIST_CRUMBS, trailIncludesList } from "../helpers/breadcrumb.helpers";
import { parseFiscalYearParam } from "../helpers/utils";
import { setDetailFiscalYear, syncListFiscalYear } from "../sessionUISlice";
import { useBreadcrumbTrail } from "./useBreadcrumbTrail.hooks";

/**
 * List pages that follow a year picked on a detail page they lead to. The
 * other lists default to "All" years and keep their own selection.
 */
const FY_SYNCED_LISTS = ["portfolios", "cans"];

/** A specific fiscal year as a number, or null (e.g. for "All" or a missing value). */
const toFiscalYear = (value) => parseFiscalYearParam(String(value ?? ""));

/** @returns {number | null} The fiscal year shared by the detail pages, if one has been chosen. */
const useSharedFiscalYear = () => useSelector((state) => state.sessionUI?.detailFiscalYear ?? null);

/**
 * The fiscal year for a portfolio, CAN or project detail page.
 *
 * These pages share one fiscal year for the session: picking a year on one of
 * them applies to the others, including pages visited earlier, so going back
 * (by breadcrumb or browser Back) shows the year the user last picked. A picked
 * year also applies to the Portfolios and CANs lists in the page's breadcrumb
 * (its trail or, without one, `fallbackCrumb`), so going all the way back to
 * the list shows it too. List pages hand their own year over when a row is
 * opened (see `useHandOverFiscalYear`).
 *
 * The page's year is the shared one; until there is one, the `?fy=` param
 * (from a link, a refresh or a copied URL), and failing that `fallbackFiscalYear`.
 * A `?fy=` year also becomes the shared one, so it survives a tab switch (tab
 * links carry no query) and applies to the pages before it.
 *
 * @param {number | string | null} [fallbackFiscalYear] - The page's default when no year has been chosen.
 * @param {Object} [options]
 * @param {import("../helpers/breadcrumb.helpers").BreadcrumbAncestor} [options.fallbackCrumb] - The list crumb
 *   the page's breadcrumb shows when no trail was carried here.
 * @returns {{ fiscalYear: number | string | null, setFiscalYear: (fiscalYear: number | string) => void }}
 */
export const useDetailFiscalYear = (fallbackFiscalYear = null, { fallbackCrumb } = {}) => {
    const dispatch = useDispatch();
    const trail = useBreadcrumbTrail();
    const syncedLists = useMemo(() => {
        const shown = { ancestors: breadcrumbAncestors(trail, fallbackCrumb) };
        return FY_SYNCED_LISTS.filter((key) => trailIncludesList(shown, LIST_CRUMBS[key]));
    }, [trail, fallbackCrumb]);
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
            if (!next) return;
            dispatch(setDetailFiscalYear(next));
            // A year the lists' dropdowns don't offer would leave them blank.
            if (!constants.fiscalYears.includes(next)) return;
            // Lists store their year as a string, like their dropdowns' values.
            for (const page of syncedLists) {
                dispatch(syncListFiscalYear({ page, selectedFiscalYear: String(next) }));
            }
        },
        [dispatch, syncedLists]
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
