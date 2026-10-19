import SearchInfoTip from "./SearchInfoTip";

export default {
    title: "UI/Header/HeaderSearch/SearchInfoTip",
    component: SearchInfoTip,
    decorators: [
        (Story) => (
            <div style={{ position: "relative", padding: "1rem 12rem 8rem 1rem" }}>
                <Story />
            </div>
        )
    ]
};

export const Default = {};
