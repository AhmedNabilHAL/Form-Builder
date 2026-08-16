import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const RouteFocusManager = () => {
  const location = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      const heading = document.querySelector<HTMLElement>("main h1");
      heading?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return null;
};

