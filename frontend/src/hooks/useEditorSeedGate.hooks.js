import * as React from "react";
import { useSelector } from "react-redux";

// After this long waiting, a page can tell the user how to get out if a request has hung.
const EDITOR_SLOW_LOAD_MS = 10000;

/**
 * Whether any query or mutation in the opsApi slice is in flight.
 * Reads the "opsApi" reducerPath (src/api/opsAPI.js) by name rather than importing opsApi, so page tests that
 * mock the API module don't have to provide it.
 * @param {Object} state - The Redux state.
 * @returns {boolean}
 */
const selectIsAnyOpsApiRequestPending = (state) =>
    Object.values(state.opsApi?.queries ?? {}).some((query) => query?.status === "pending") ||
    Object.values(state.opsApi?.mutations ?? {}).some((mutation) => mutation?.status === "pending");

/**
 * Decides when it's safe to mount EditAgreementProvider, which seeds its draft from its props only once.
 *
 * A save only invalidates the RTK Query cache, so right after one (or when a page re-enters with cached data)
 * the queries still hold the pre-save data while they refetch, with isLoading false. Mounting the editor then
 * would freeze stale data, and the next save would write the old values back. RTK Query's default "delayed"
 * invalidation also holds a refetch while any other request in the slice is in flight, so the gate waits until
 * nothing in the slice is pending: at that point every held refetch has run.
 *
 * The gate also stays closed until the page's mount effects have run. RTK Query starts a
 * refetchOnMountOrArgChange refetch from an effect, so on the first render a warm cache still reads as idle and
 * fulfilled. After the effects run, that refetch (or one started by a parent's query) is pending.
 *
 * Once open, the editor stays open until editing stops or a load fails: saving from the editor starts refetches
 * while the save is still running, and unmounting would drop that save. After a failure, a retry has to finish
 * before the editor reopens.
 *
 * @param {Object} options
 * @param {boolean} options.isEditing - Whether the page wants the editor open.
 * @param {boolean} options.isDataFetching - Whether any query the editor seeds from is loading or refetching.
 * @param {boolean} [options.hasLoadFailed=false] - Whether any query the editor seeds from failed.
 * @returns {{isEditorOpen: boolean, isWaitingForEditor: boolean, isEditorLoadSlow: boolean}}
 */
export const useEditorSeedGate = ({ isEditing, isDataFetching, hasLoadFailed = false }) => {
    const isAnyApiRequestPending = useSelector(selectIsAnyOpsApiRequestPending);
    const [haveMountEffectsRun, setHaveMountEffectsRun] = React.useState(false);
    React.useEffect(() => setHaveMountEffectsRun(true), []);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const canOpenEditor =
        haveMountEffectsRun && isEditing && !hasLoadFailed && !isDataFetching && !isAnyApiRequestPending;
    if (canOpenEditor && !isEditorOpen) {
        setIsEditorOpen(true);
    }
    if ((!isEditing || hasLoadFailed) && isEditorOpen) {
        setIsEditorOpen(false);
    }

    // No request timeout is set, so a hung request would otherwise keep the page waiting with no explanation.
    const isWaitingForEditor = isEditing && !hasLoadFailed && !isEditorOpen;
    const [isEditorLoadSlow, setIsEditorLoadSlow] = React.useState(false);
    if (!isWaitingForEditor && isEditorLoadSlow) {
        setIsEditorLoadSlow(false);
    }
    React.useEffect(() => {
        if (!isWaitingForEditor) return;
        const timer = setTimeout(() => setIsEditorLoadSlow(true), EDITOR_SLOW_LOAD_MS);
        return () => clearTimeout(timer);
    }, [isWaitingForEditor]);

    return { isEditorOpen, isWaitingForEditor, isEditorLoadSlow };
};
