import type { SVGProps } from "react";

// Line icons drawn on a 24px grid, stroked with currentColor.
const PATHS = {
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4",
    cart: "M3 4h2l2.4 11h10.2L20 8H6.2M9 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01",
    heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
    moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z",
    male: "M10 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm4.2-10.2L20 4m-5 0h5v5",
    female: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 0v7m-3-3h6",
    phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2",
    tablet: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 15h2",
    laptop: "M5 5h14v10H5zM3 18h18l-1 2H4z",
    headphones: "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zm13 0h3v5h-3z",
    watch: "M9 3h6l1 4H8zm0 18h6l1-4H8zm3-14a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 3v2l1.5 1.5",
    camera: "M4 8h4l2-3h4l2 3h4v11H4zm8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    gamepad: "M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.2 2H8.2A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4Zm1 2v4m-2-2h4m5-1h.01M17 13h.01",
    monitor: "M4 5h16v11H4zm5 15h6m-3-4v4",
    keyboard: "M3 7h18v10H3zm4 3h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8",
    mouse: "M12 3a5 5 0 0 1 5 5v8a5 5 0 0 1-10 0V8a5 5 0 0 1 5-5Zm0 3v3",
    speaker: "M7 3h10v18H7zm5 4h.01M12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
    plug: "M9 3v5m6-5v5M7 8h10v3a5 5 0 0 1-10 0zm5 8v5",
    cable: "M7 3v4m-2 0h4v4a2 2 0 0 1-4 0zm2 6v4a4 4 0 0 0 8 0V9m0 0h-2V5h4v4z",
    storage: "M4 6h16v5H4zm0 7h16v5H4zm3-4.5h.01M7 15.5h.01",
    wifi: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
    shirt: "M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3a4 4 0 0 1-8 0Z",
    dress: "M9 3h6l-1 6 5 12H5l5-12z",
    coat: "M9 3h6l4 4v14h-5l-2-9-2 9H5V7zm0 0 3 6 3-6",
    bag: "M5 8h14l-1 12H6zm4 0V6a3 3 0 0 1 6 0v2",
    shoe: "M3 17V9h4l3 4h5l5 2v2zm0 3h17",
    ring: "M12 9V3m-3 12a3 3 0 1 0 6 0 3 3 0 0 0-6 0Zm3 3v3",
    perfume: "M10 3h4v3h-4zm-2 5h8v12H8zm0 4h8",
    tomato: "M12 7a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 0V4m0 3c-2-1-4 0-4 0m4 0c2-1 4 0 4 0",
    apple: "M12 7c-3-2-7 0-7 5 0 4 3 8 5 8 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-8 0-5-4-7-7-5Zm0 0c0-2 1-3 3-4",
    bread: "M4 11a8 4 0 0 1 16 0v8H4zm4 0v8m4-8v8m4-8v8",
    bottle: "M10 3h4v3l2 3v12H8V9l2-3z",
    jar: "M8 4h8v3H8zm-1 3h10v13H7zm3 5h4m-2 0v4",
    leaf: "M5 19C5 10 10 5 19 5c0 9-5 14-14 14Zm0 0 7-7",
    coffee: "M5 9h11v5a5 5 0 0 1-10 0zm11 1h2a2 2 0 0 1 0 4h-2M9 3v3m3-3v3",
    book: "M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zm0 13a3 3 0 0 1 3-3h10",
    notebook: "M6 3h12v18H6zm3 0v18m3-13h4",
    pencil: "m4 20 1-5L15 5l4 4L9 19zm9-13 4 4",
    backpack: "M6 9a6 6 0 0 1 12 0v11H6zm3-4V3h6v2m-6 9h6v3H9z",
    calculator: "M6 3h12v18H6zm3 3h6v3H9zm0 7h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01M15 16h.01",
    truck: "M3 6h11v10H3zm11 4h4l3 3v3h-7zM7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01",
    card: "M3 6h18v12H3zm0 4h18M7 15h4",
    refresh: "M4 12a8 8 0 0 1 14-5.3L20 9m0-5v5h-5m5 3a8 8 0 0 1-14 5.3L4 15m0 5v-5h5",
    headset: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zm13 0h3v5h-3zm3 5c0 1-2 2-5 2",
    bolt: "M13 3 5 13h6l-1 8 8-10h-6z",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    close: "M6 6l12 12M18 6 6 18",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z",
    menu: "M4 7h16M4 12h16M4 17h16",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    chevron: "m9 6 6 6-6 6",
    trash: "M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13",
    download: "M12 4v11m-4-4 4 4 4-4M5 20h14",
    grid: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z",
    home: "M4 11 12 4l8 7v9h-5v-6H9v6H4z",
    box: "M4 8l8-4 8 4v8l-8 4-8-4zm0 0 8 4 8-4m-8 4v8",
    chart: "M4 20V4m0 16h16M8 16v-4m4 4V8m4 8v-6",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    logout: "M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h11",
    globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
    check: "m5 12 5 5 9-10",
    alert: "M12 4 2 20h20zm0 6v4m0 3h.01",
    filter: "M4 5h16l-6 8v6l-4-2v-4z",
    bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 3a2 2 0 0 0 4 0",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
    filled?: boolean;
}

export default function Icon({ name, size = 20, filled = false, ...rest }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            {...rest}
        >
            <path d={PATHS[name]} />
        </svg>
    );
}
