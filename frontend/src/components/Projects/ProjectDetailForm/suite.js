import { create, test, enforce } from "vest";

const suite = create((data = {}) => {
    test("title", "This is required information", () => {
        enforce(data["title"]).isNotBlank();
    });
});

export default suite;
