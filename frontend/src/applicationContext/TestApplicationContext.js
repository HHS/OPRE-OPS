import "jest";
import { authConfig } from "../helpers/backend";

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
