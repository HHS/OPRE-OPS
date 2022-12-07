import { library } from "@fortawesome/fontawesome-svg-core";
import { faSquare } from "@fortawesome/free-solid-svg-icons";
import cssClasses from "./styles.module.css";

library.add(faSquare);

const RoundedBox = ({ ...props }) => {
    const cardContainer = `bg-base-lightest font-family-sans ${cssClasses.container}`;

    return (
        <div className={cardContainer} {...props}>
            {props.children}
        </div>
    );
};

export default RoundedBox;
