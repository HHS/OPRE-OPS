import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { vi } from "vitest";
import CanComboBox from "./CanComboBox";
import TestApplicationContext from "../../../applicationContext/TestApplicationContext";
import store from "../../../store";

const mockFn = TestApplicationContext.helpers().mockFn;

// Mock the ComboBox component
vi.mock("../../UI/Form/ComboBox", () => ({
    default: vi.fn((props) => (
        <div data-testid="mocked-combobox">
            <select
                aria-label="CAN"
                disabled={props.isDisabled}
                data-testid="can-select"
            >
                <option value="">Select a CAN</option>
                {props.data?.map((can) => (
                    <option key={can.id} value={can.id}>
                        {can.display_name || can.number}
                    </option>
                ))}
            </select>
        </div>
    ))
}));

// Mock the API hook
vi.mock("../../../api/opsAPI", () => ({
    useGetCansQuery: vi.fn(() => ({
        data: [
            {
                id: 500,
                number: "G99HRF2",
                display_name: "G99HRF2",
                description: "Test CAN 1"
            },
            {
                id: 501,
                number: "G99IA14",
                display_name: "G99IA14",
                description: "Test CAN 2"
            }
        ],
        error: null,
        isLoading: false
    }))
}));

describe("CanComboBox", () => {
    const defaultProps = {
        name: "can",
        selectedCan: null,
        setSelectedCan: mockFn,
        onChange: mockFn,
        legendClassname: "test-legend"
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders without crashing", () => {
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} />
            </Provider>
        );

        expect(screen.getByTestId("mocked-combobox")).toBeInTheDocument();
    });

    it("should enable the ComboBox when isDisabled is false", () => {
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} isDisabled={false} />
            </Provider>
        );

        const selectElement = screen.getByTestId("can-select");
        expect(selectElement.disabled).toBe(false);
    });

    it("should disable the ComboBox when isDisabled is true", () => {
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} isDisabled={true} />
            </Provider>
        );

        const selectElement = screen.getByTestId("can-select");
        expect(selectElement.disabled).toBe(true);
    });

    it("should enable the ComboBox when isDisabled is not provided (default behavior)", () => {
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} />
            </Provider>
        );

        const selectElement = screen.getByTestId("can-select");
        expect(selectElement.disabled).toBe(false);
    });

    it("should pass the correct data to ComboBox", () => {
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} />
            </Provider>
        );

        // Verify that CAN options are rendered
        expect(screen.getByText("G99HRF2")).toBeInTheDocument();
        expect(screen.getByText("G99IA14")).toBeInTheDocument();
    });

    it("should handle pending state", () => {
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} pending={true} />
            </Provider>
        );

        expect(screen.getByTestId("mocked-combobox")).toBeInTheDocument();
    });

    it("should handle error messages", () => {
        const messages = ["This field is required"];
        render(
            <Provider store={store}>
                <CanComboBox {...defaultProps} messages={messages} />
            </Provider>
        );

        expect(screen.getByTestId("mocked-combobox")).toBeInTheDocument();
    });
});
