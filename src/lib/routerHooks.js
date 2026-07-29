import { createContext, useContext, useMemo } from 'react';

export const RouterContext = createContext(null);

export const getLocationState = () => ({
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash,
  state: window.history.state?.usr || null,
});

export const normalizeTo = (to) => {
  if (typeof to === 'string') return to;
  return `${to.pathname || window.location.pathname}${to.search || ''}${to.hash || ''}`;
};

const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('Router hooks must be used inside BrowserRouter');
  return context;
};

export const useLocation = () => useRouter().location;

export const useNavigate = () => useRouter().navigate;

export const useSearchParams = () => {
  const { location } = useRouter();
  return [useMemo(() => new URLSearchParams(location.search), [location.search])];
};
