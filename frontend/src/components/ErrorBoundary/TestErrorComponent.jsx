/**
 * @typedef {Object} TestErrorComponentProps
 * @property {boolean} shouldError
 */
/**
 * @param {TestErrorComponentProps} props
 * @returns {React.ReactNode}
 */
const TestErrorComponent = ({ shouldError = false }) => {
    if (shouldError) {
        throw new Error("Test error");
    }
    return <div>Test Component</div>;
};

export default TestErrorComponent;
