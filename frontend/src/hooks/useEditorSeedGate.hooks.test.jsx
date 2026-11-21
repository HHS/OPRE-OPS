import { configureStore } from "@reduxjs/toolkit";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { useReducer } from "react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it } from "vitest";
import { useEditorSeedGate } from "./useEditorSeedGate.hooks";

// Real RTK Query hooks and store, so the test exercises RTK's own timing: a query with refetchOnMountOrArgChange
// starts its refetch from an effect, after the first render has already returned the cached data. The store
// batches notifications to React (autoBatch), so the tests wait with waitFor/findBy rather than a fixed tick.
let resolveNextFetch;
let serverAmount;
const pendingFetch = () =>
    new Promise((resolve) => {
        resolveNextFetch = () => resolve({ data: { amount: serverAmount } });
    });

const testApi = createApi({
    reducerPath: "opsApi",
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        getAgreement: builder.query({ queryFn: pendingFetch })
    })
});

const buildStore = () =>
    configureStore({
        reducer: { [testApi.reducerPath]: testApi.reducer },
        middleware: (getDefault) => getDefault().concat(testApi.middleware)
    });

// Seeds once on mount, like EditAgreementProvider.
const SeededEditor = ({ amount }) => {
    const [draft] = useReducer((state) => state, { amount });
    return <div data-testid="editor">draft:{draft.amount}</div>;
};

const EditorPage = () => {
    const { data, isLoading, isFetching } = testApi.useGetAgreementQuery(1, { refetchOnMountOrArgChange: true });
    const { isEditorOpen } = useEditorSeedGate({
        isEditing: true,
        isDataFetching: isLoading || isFetching,
        hasLoadFailed: false
    });
    return isEditorOpen ? <SeededEditor amount={data.amount} /> : <p>Loading...</p>;
};

describe("useEditorSeedGate with real RTK Query", () => {
    afterEach(() => {
        resolveNextFetch = undefined;
    });

    it("waits for the mount-triggered refetch before opening the editor on a warm cache", async () => {
        const store = buildStore();

        // Warm the cache with the old amount, then drop the subscription (as after leaving the page).
        serverAmount = 100;
        const warmUp = store.dispatch(testApi.endpoints.getAgreement.initiate(1));
        await waitFor(() => expect(resolveNextFetch).toBeTypeOf("function"));
        resolveNextFetch();
        await warmUp;
        warmUp.unsubscribe();
        resolveNextFetch = undefined;

        // The server now has a newer amount; the page's mount refetch is still in flight.
        serverAmount = 200;
        render(
            <Provider store={store}>
                <EditorPage />
            </Provider>
        );
        // Without the mount-effects wait, the editor opens on this first render with the cached 100.
        expect(screen.queryByTestId("editor")).not.toBeInTheDocument();

        await waitFor(() => expect(resolveNextFetch).toBeTypeOf("function"));
        expect(screen.queryByTestId("editor")).not.toBeInTheDocument();

        act(() => resolveNextFetch());

        expect(await screen.findByTestId("editor")).toHaveTextContent("draft:200");
    });

    it("opens the editor after the first load on a cold cache", async () => {
        const store = buildStore();
        resolveNextFetch = undefined;
        serverAmount = 300;
        render(
            <Provider store={store}>
                <EditorPage />
            </Provider>
        );

        await waitFor(() => expect(resolveNextFetch).toBeTypeOf("function"));
        expect(screen.queryByTestId("editor")).not.toBeInTheDocument();

        act(() => resolveNextFetch());

        expect(await screen.findByTestId("editor")).toHaveTextContent("draft:300");
    });
});
