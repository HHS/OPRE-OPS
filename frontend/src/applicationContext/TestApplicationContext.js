import "jest";
import { authConfig, backEndConfig } from "../helpers/test";

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
