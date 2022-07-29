import "jest";

class TestApplicationContext {
    static #helpers = {
        callBackend: jest.fn(),
    };

    static helpers() {
        return this.#helpers;
    }
}

export default TestApplicationContext;
