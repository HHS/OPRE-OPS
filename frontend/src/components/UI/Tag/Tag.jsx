import styles from "./styles.module.css";

const Tag = ({ tagStyle, text }) => {
    let tagClasses;
    if (tagStyle === "darkTextLightBackground") {
        tagClasses = `bg-brand-neutral-lightest text-brand-neutral-dark font-sans-3xs ${styles.tag}`;
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses = `bg-brand-dataviz-dark-blue text-brand-neutral-lightest font-sans-3xs ${styles.tag}`;
    }
    return <div className={tagClasses}>{text}</div>;
};

export default Tag;
