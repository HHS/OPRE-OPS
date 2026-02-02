import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import PortfolioSpending from "./PortfolioSpending";
import CanCard from "../../CANs/CanCard/CanCard";
import { vi } from "vitest";

// This is needed because Nivo (charting library) uses the ResizeObserver on the client and so needs to be
// mocked for unit tests.
window.ResizeObserver =
    window.ResizeObserver ||
    vi.fn().mockImplementation(() => ({
        disconnect: vi.fn(),
        observe: vi.fn(),
        unobserve: vi.fn()
    }));

// TODO: Skipping test for now because this component contains many sub-components which currently do not have tests -
// TODO: the sub-components will need to mock the backend calls (current ApplicationContext does not support this)
it.todo("renders without crashing", () => {
    render(
        <Provider store={store}>
            <PortfolioSpending
                portfolioId={1}
                canCards={[
                    <CanCard
                        key={1}
                        can={{
                            id: 1,
                            number: "1XXXX",
                            nick_name: "Can #1"
                        }}
                        fiscalYear={2023}
                    />
                ]}
            />
        </Provider>
    );
});
