import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import cssClasses from "./styles.module.css";

library.add(faSquare);

const RoundedBox = ({ children, className }) => {
    const cardContainer = `bg-base-lightest font-family-sans display-flex ${cssClasses.container} ${className}`;

    return <div className={cardContainer}>{children}</div>;
};

export default RoundedBox;
