import store from "../../../store";
import { Provider } from "react-redux";
import { render } from "@testing-library/react";
import BudgetAndFunding from "./BudgetAndFunding";
import CanCard from "../../CANs/CanCard/CanCard";

// This is needed because Nivo (charting library) uses the ResizeObserver on the client and so needs to be
// mocked for unit tests.
window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));

// TODO: Skipping test for now because this component contains many sub-components which currently do not have tests -
// TODO: the sub-components will need to mock the backend calls (current ApplicationContext does not support this)
it.skip("renders without crashing", () => {
    render(
        <Provider store={store}>
            <BudgetAndFunding
                portfolioId={1}
                canCards={[
                    <CanCard
                        key={1}
                        can={{
                            id: 1,
                            number: "1XXXX",
                            nickname: "Can #1",
                        }}
                        fiscalYear={2023}
                    />,
                ]}
            />
        </Provider>
    );
});
