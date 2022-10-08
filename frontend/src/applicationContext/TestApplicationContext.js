import "jest";
import { authConfig } from "../helpers/test";

class TestApplicationContext {
    static #helpers = {
        callBackend: jest.fn(),
        authConfig,
    };

    static helpers() {
        return this.#helpers;
    }
}

export default TestApplicationContext;
