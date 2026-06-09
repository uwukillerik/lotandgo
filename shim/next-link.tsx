"use client";

import { forwardRef, type ComponentProps } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  href: string;
};

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { href, ...props },
  ref,
) {
  return <RouterLink ref={ref} to={href} {...props} />;
});

export default Link;
