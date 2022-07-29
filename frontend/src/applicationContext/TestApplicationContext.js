import "jest";

class TestApplicationContext {
    static helpers() {
        return {
            callBackend: jest.fn(),
        };
    }
}

export default TestApplicationContext;
