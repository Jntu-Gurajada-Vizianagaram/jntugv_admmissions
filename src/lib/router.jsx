import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RouterContext, getLocationState, normalizeTo, useLocation, useNavigate } from './routerHooks';

export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(getLocationState);

  useEffect(() => {
    const handlePopState = () => setLocation(getLocationState());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to, options = {}) => {
    const href = normalizeTo(to);
    const state = { usr: options.state || null };
    if (options.replace) {
      window.history.replaceState(state, '', href);
    } else {
      window.history.pushState(state, '', href);
    }
    setLocation(getLocationState());
  }, []);

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function Link({ to, replace = false, state = null, onClick, children, ...props }) {
  const navigate = useNavigate();
  const href = normalizeTo(to);

  const handleClick = (event) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      props.target
    ) {
      return;
    }
    event.preventDefault();
    navigate(href, { replace, state });
  };

  return <a {...props} href={href} onClick={handleClick}>{children}</a>;
}

export function NavLink({ className, to, ...props }) {
  const location = useLocation();
  const href = normalizeTo(to);
  const isActive = location.pathname === href.split(/[?#]/)[0];
  const resolvedClassName = typeof className === 'function'
    ? className({ isActive })
    : [className, isActive ? 'active' : ''].filter(Boolean).join(' ');

  return <Link {...props} to={to} className={resolvedClassName} />;
}

export function Routes({ children }) {
  const location = useLocation();
  const routes = React.Children.toArray(children);
  const matchedRoute = routes.find((route) => {
    if (!React.isValidElement(route)) return false;
    const { path } = route.props;
    return path === '*' || path === location.pathname;
  });

  return matchedRoute?.props.element || null;
}

export function Route() {
  return null;
}

export function Navigate({ to, replace = false, state = null }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);

  return null;
}
