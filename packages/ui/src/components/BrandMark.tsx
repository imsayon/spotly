import type { SVGProps } from "react";

/** Two places meeting: the same mark on both sides of a visit. */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="32"
      viewBox="0 0 28 32"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M25 2H15C8.4 2 4 6.5 4 12c0 3.4 1.8 5.5 4.7 6.8L25 2Z"
        fill="currentColor"
      />
      <path
        d="M3 30h10c6.6 0 11-4.5 11-10 0-3.4-1.8-5.5-4.7-6.8L3 30Z"
        fill="currentColor"
      />
    </svg>
  );
}
