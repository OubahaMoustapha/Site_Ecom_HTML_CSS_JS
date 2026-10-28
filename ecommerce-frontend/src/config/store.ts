// Business facts shown across the store (top bar, home page, world heroes,
// information and legal pages). Change them here once; every page follows.
//
// ⚠ Before going live, replace the placeholder contact and company details
// and make sure every promise below matches your real policy.

export const STORE = {
    /** Legal entity shown on the terms and privacy pages. */
    companyName: "[اسم الشركة القانوني · Company legal name]",
    /** Company registration identifiers (RC / ICE), shown on the legal pages. */
    registration: "RC: — · ICE: —",
    address: {
        ar: "العنوان الكامل للشركة، المدينة، المغرب",
        en: "Company address, City, Morocco",
    },
    email: "contact@example.com",
    /** Displayed as written; also used for the tel: link. */
    phone: "+212 5 00 00 00 00",
    /** International format without "+" or spaces, for the wa.me link. Empty to hide. */
    whatsapp: "212600000000",
    supportHours: {
        ar: "من الإثنين إلى السبت، من 9:00 إلى 19:00",
        en: "Monday to Saturday, 9:00 to 19:00",
    },
    /** Short badge on the home page next to "Customer support". */
    supportBadge: "6/7",

    /** Delivery window, in hours, for standard orders. */
    deliveryHours: { min: 24, max: 72 },
    /** Same-day delivery slot announced in the food world; null hides it. */
    foodSameDay: { from: "18:00", to: "20:00" } as { from: string; to: string } | null,
    /** Free returns period, in days, counted from delivery. */
    returnDays: 14,
    /** Manufacturer warranty announced in the electronics world, in months. */
    warrantyMonths: 24,
};

/** wa.me link, or null when no WhatsApp number is configured. */
export const whatsappUrl = STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}` : null;
