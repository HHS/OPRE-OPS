import HighlightedText from "./HighlightedText";

export default {
    title: "UI/Header/HeaderSearch/HighlightedText",
    component: HighlightedText
};

export const Match = {
    args: {
        text: "Child Care Study",
        query: "care"
    }
};

export const NoMatch = {
    args: {
        text: "Head Start Study",
        query: "zzz"
    }
};

export const EmptyText = {
    args: {
        text: null,
        query: "care"
    }
};
