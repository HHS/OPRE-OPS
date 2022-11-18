import styles from "./styles.module.css";

const Tag = (props) => {
    const tagClasses = `text-bold font-sans-3xs ${styles.tag}`;

    return <div className={tagClasses}>{props.text}</div>;
};

export default Tag;
