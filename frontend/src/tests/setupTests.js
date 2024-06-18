import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import ApplicationContext from "../applicationContext/ApplicationContext";
import TestApplicationContext from "../applicationContext/TestApplicationContext";
import { setupStore } from "../store";
import { server } from "./mocks";
import { opsApi } from "../api/opsAPI";

ApplicationContext.registerApplicationContext(TestApplicationContext);

const store = setupStore({});

beforeAll(() => {
    server.listen();
});

afterEach(() => {
    server.resetHandlers();
    store.dispatch(opsApi.util.resetApiState());
    cleanup();
});

afterAll(() => server.close());
