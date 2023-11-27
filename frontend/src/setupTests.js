// import ApplicationContext from "./applicationContext/ApplicationContext";
// import TestApplicationContext from "./applicationContext/TestApplicationContext";
// import "@testing-library/jest-dom/extend-expect";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
// import { setupStore } from "./store";
// import { server } from "./helpers/mocks";
// import { opsApi } from "./api/opsAPI";
import { afterEach } from "vitest";

// ApplicationContext.registerApplicationContext(TestApplicationContext);

// const store = setupStore({});

// beforeAll(() => {
//     server.listen();
// });

afterEach(() => {
    // server.resetHandlers();
    // store.dispatch(opsApi.util.resetApiState());
    cleanup();
});

// afterAll(() => server.close());
