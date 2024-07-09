import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import store from "../../../store";
import ApproveAgreement from "./ApproveAgreement";
import { useGetUserByIdQuery } from "../../../api/opsAPI";

vi.mock("../../../api/opsAPI");
describe("ApproveAgreement", () => {
    useGetUserByIdQuery.mockReturnValue({
        data: {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            email: ""
        },
        isSuccess: true
    });

    it.todo("should render the approve agreement page", () => {
        render(
            <Provider store={store}>
                <BrowserRouter>
                    <ApproveAgreement />
                </BrowserRouter>
            </Provider>
        );
    });
    it.todo("should update heading based on Change Request type");
});
