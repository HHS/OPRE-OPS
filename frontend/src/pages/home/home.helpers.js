/**
 * Builds the home page greeting, personalized when the active user's first name is known.
 * @param {string} [firstName] - The active user's first name.
 * @returns {string} The greeting to render as the page title.
 */
export const getGreeting = (firstName) =>
    firstName ? `Welcome back ${firstName}! Here’s the latest` : "Welcome to OPS! Here’s the latest";
