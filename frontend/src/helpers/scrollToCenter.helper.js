/** 
@param {string} id
*/
export const scrollToCenter = (id) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
};
