import styles from "./styles.module.css";

const Tag = ({ tagStyle, text, className = "" }) => {
    let tagClasses;
    if (tagStyle === "darkTextLightBackground") {
        tagClasses = `bg-brand-neutral-lightest text-brand-neutral-dark font-sans-3xs padding-05 ${styles.tag}`;
    } else if (tagStyle === "lightTextDarkBackground") {
        tagClasses = `bg-brand-dataviz-dark-blue text-brand-neutral-lightest font-sans-3xs padding-05 ${styles.tag}`;
    }
    return <span className={`${tagClasses} ${className}`}>{text}</span>;
};

export default Tag;
