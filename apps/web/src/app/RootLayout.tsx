import { Outlet, ScrollRestoration } from 'react-router';
// Wraps every route. ScrollRestoration scrolls to the top on each new navigation
// (or to the #hash target) and restores the old position on back/forward.
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
