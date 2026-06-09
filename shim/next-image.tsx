"use client";

import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  alt?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
};

export default function Image({
  src,
  alt = "",
  fill,
  className,
  style,
  priority: _priority,
  unoptimized: _unoptimized,
  sizes: _sizes,
  ...props
}: Props) {
  const imgStyle: CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", ...style }
    : (style ?? {});

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} style={imgStyle} {...props} />
  );
}
