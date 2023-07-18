import "@testing-library/jest-dom";
import { authConfig, backEndConfig } from "../helpers/test";
import { jest } from "@jest/globals";

class TestApplicationContext {
    static #helpers = {
        callBackend: jest.fn(),
        authConfig,
        backEndConfig,
    };

    static helpers() {
        return this.#helpers;
    }
}

export default TestApplicationContext;
