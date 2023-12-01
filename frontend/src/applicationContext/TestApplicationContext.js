import { vi } from "vitest";
import { authConfig, backEndConfig } from "../helpers/test";

class TestApplicationContext {
    static #helpers = {
        callBackend: vi.fn(),
        authConfig,
        backEndConfig,
        mockFn: vi.fn()
    };

    static helpers() {
        return this.#helpers;
    }
}

export default TestApplicationContext;
