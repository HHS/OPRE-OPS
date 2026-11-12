import { Outlet, ScrollRestoration } from "react-router-dom";

/**
 * Root route element. ScrollRestoration lives here, mounted once, so saved positions survive page
 * changes: new history entries scroll to the top and Back/Forward restores the previous position.
 * Same-page navigations (tabs, query-string updates) opt out with `preventScrollReset`.
 * @component
 */
const RootLayout = () => (
    <>
        <ScrollRestoration />
        <Outlet />
    </>
);

export default RootLayout;
