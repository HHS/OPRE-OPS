import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import cssClasses from "./styles.module.css";

library.add(faSquare);

const styles = {
    root: {
        width: 175,
        height: 175,
    },
    cardBody: {
        display: "flex",
        flexDirection: "column",
        alignItems: "left",
        borderColor: "#FFF",
    },
    cardGroup: {
        display: "flex",
        marginBottom: "7%",
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: "250px",
    },
    cardItem: {
        display: "flex",
        flex: "1",
    },
    iconStyle: {
        verticalAlign: "middle",
        paddingRight: "4px",
    },
};

const RoundedBox = (props) => {
    const cardContainer = `bg-base-lightest font-family-sans ${cssClasses.container}`;

    return <div className={cardContainer}>{props.children}</div>;
};

export default RoundedBox;
