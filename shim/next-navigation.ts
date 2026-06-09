"use client";

import {
  useParams as useRouterParams,
  useNavigate,
  useLocation,
} from "react-router-dom";

export function useParams<T extends Record<string, string | undefined> = Record<string, string>>() {
  return useRouterParams() as T;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, { replace: true }),
    back: () => navigate(-1),
    refresh: () => navigate(0),
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export function useSearchParams() {
  return new URLSearchParams(useLocation().search);
}
