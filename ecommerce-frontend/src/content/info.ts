// Information and legal pages. Facts (delays, contact, company) come from
// config/store.ts. The legal texts are a starting template: have them reviewed
// for your company before going live.
import { STORE } from "../config/store";
import type { Lang } from "../context/preferences";

export const INFO_SLUGS = ["about", "contact", "returns", "payment", "terms", "privacy"] as const;
export type InfoSlug = (typeof INFO_SLUGS)[number];

export interface InfoBlock {
    heading: string;
    paragraphs?: string[];
    list?: string[];
}

export interface InfoPage {
    title: string;
    intro: string;
    blocks: InfoBlock[];
}

export const isInfoSlug = (value: string | undefined): value is InfoSlug =>
    INFO_SLUGS.includes(value as InfoSlug);

const { returnDays, deliveryHours, warrantyMonths } = STORE;

const ar: Record<InfoSlug, InfoPage> = {
    about: {
        title: "من نحن",
        intro: "دُرّة متجر مغربي واحد يجمع أربعة عوالم: الإلكترونيات، الأزياء، الأطعمة، والكتب والمستلزمات الدراسية.",
        blocks: [
            { heading: "فكرتنا", paragraphs: ["أردنا أن يجد الزبون ما يحتاجه لبيته وعمله ودراسته في مكان واحد، بتجربة شراء بسيطة وواضحة: أسعار معلنة، مخزون حقيقي، وتوصيل إلى باب البيت."] },
            { heading: "وعودنا", list: [`توصيل لكل المدن خلال ${deliveryHours.min} إلى ${deliveryHours.max} ساعة.`, "الدفع عند الاستلام متاح لكل الطلبات.", `إرجاع مجاني خلال ${returnDays} يوماً من الاستلام.`, "دعم حقيقي عبر الهاتف وواتساب والبريد الإلكتروني."] },
        ],
    },
    contact: {
        title: "اتصل بنا",
        intro: "فريقنا يجيبك عن أسئلة الطلبات والتوصيل والإرجاع. جهّز رقم طلبك إن كان سؤالك عن طلب.",
        blocks: [],
    },
    returns: {
        title: "الإرجاع والاستبدال",
        intro: `يمكنك إرجاع أي منتج خلال ${returnDays} يوماً من تاريخ استلامه، دون الحاجة إلى تبرير.`,
        blocks: [
            { heading: "الشروط", list: ["أن يكون المنتج بحالته الأصلية، غير مستعمل، وفي غلافه الأصلي مع ملحقاته.", "أن يُرفق برقم الطلب أو الفاتورة."] },
            { heading: "منتجات لا تُرجع", list: ["الأطعمة والمنتجات القابلة للتلف.", "العطور ومنتجات العناية الشخصية بعد فتحها.", "المنتجات المصنوعة أو المعدّلة حسب الطلب."] },
            { heading: "طريقة الإرجاع", list: ["تواصل معنا عبر صفحة «اتصل بنا» مع ذكر رقم الطلب.", "نحدد معك موعد استلام المنتج أو عنوان إرساله.", "بعد فحص المنتج، نُرجع المبلغ خلال 14 يوماً بالوسيلة التي دفعت بها، أو نقداً/تحويلاً للطلبات المدفوعة عند الاستلام."] },
            { heading: "منتج معيب أو غير مطابق", paragraphs: [`إذا وصلك منتج معيب أو مختلف عن طلبك، نتكفّل بمصاريف الإرجاع ونستبدله أو نُرجع ثمنه. تستفيد الأجهزة الإلكترونية أيضاً من ضمان لمدة ${warrantyMonths} شهراً.`] },
        ],
    },
    payment: {
        title: "طرق الدفع",
        intro: "تختار طريقة الدفع في آخر خطوة من إتمام الطلب.",
        blocks: [
            { heading: "الدفع عند الاستلام", paragraphs: ["تدفع نقداً لعامل التوصيل عند استلام طلبك. لا حاجة لأي بطاقة."] },
            { heading: "البطاقة البنكية وPayPal", paragraphs: ["متاحتان عند إتمام الطلب. يُسجَّل الدفع فور تأكيده وتتغيّر حالة الطلب إلى «مدفوع»."] },
            { heading: "الفاتورة", paragraphs: ["تصلك الفاتورة بصيغة PDF على بريدك الإلكتروني بعد الدفع، ويمكنك تحميلها في أي وقت من صفحة الطلب في حسابك."] },
            { heading: "الأسعار", paragraphs: ["كل الأسعار بالدرهم المغربي وتشمل الضرائب. التوصيل مجاني ما لم يُذكر غير ذلك في السلة."] },
        ],
    },
    terms: {
        title: "الشروط والأحكام",
        intro: `تنظم هذه الشروط البيع عبر متجر دُرّة الذي تديره ${STORE.companyName}.`,
        blocks: [
            { heading: "هوية البائع", list: [STORE.companyName, STORE.registration, STORE.address.ar, `${STORE.email} · ${STORE.phone}`] },
            { heading: "الطلبات", paragraphs: ["يُعدّ الطلب مؤكداً بعد إتمامه في صفحة الدفع، وتصلك رسالة تأكيد. تأكيد البريد الإلكتروني شرط لإتمام أي طلب. نحتفظ بحق إلغاء الطلب إذا نفد المنتج، مع إعلامك واسترجاع أي مبلغ مدفوع."] },
            { heading: "الأسعار والمخزون", paragraphs: ["الأسعار المعروضة بالدرهم وتشمل الضرائب. يُحجز المخزون عند إنشاء الطلب، ويُعاد إن أُلغي الطلب قبل شحنه."] },
            { heading: "التوصيل", paragraphs: [`نوصل إلى كل المدن خلال ${deliveryHours.min} إلى ${deliveryHours.max} ساعة في الغالب. يمكنك تتبّع حالة طلبك من حسابك.`] },
            { heading: "الإلغاء والإرجاع", paragraphs: [`يمكنك إلغاء طلبك من حسابك ما دام في حالة «قيد الانتظار». ويحق لك إرجاع المنتجات خلال ${returnDays} يوماً من الاستلام وفق صفحة «الإرجاع والاستبدال»، بما يتجاوز أجل التراجع المنصوص عليه في القانون 31.08 المتعلق بحماية المستهلك.`] },
            { heading: "الضمان والمسؤولية", paragraphs: [`تستفيد المنتجات من الضمان القانوني ضد العيوب، والأجهزة الإلكترونية من ضمان لمدة ${warrantyMonths} شهراً. لا نتحمل الأضرار الناتجة عن سوء الاستعمال.`] },
            { heading: "المعطيات الشخصية", paragraphs: ["نعالج معطياتك وفق «سياسة الخصوصية» والقانون 09.08."] },
            { heading: "القانون المطبّق", paragraphs: ["تخضع هذه الشروط للقانون المغربي، وتختص المحاكم المغربية بأي نزاع بعد محاولة الحل الودي."] },
        ],
    },
    privacy: {
        title: "سياسة الخصوصية",
        intro: "نجمع فقط ما نحتاجه لتنفيذ طلباتك، ولا نبيع معطياتك لأي طرف.",
        blocks: [
            { heading: "المعطيات التي نجمعها", list: ["الحساب: الاسم والبريد الإلكتروني وكلمة المرور (مشفّرة).", "الطلبات: عنوان الشحن والهاتف والمنتجات وطريقة الدفع.", "في متصفحك فقط: اللغة ووضع العرض والمفضلة ورمز الدخول. لا نستعمل ملفات تتبّع إعلانية."] },
            { heading: "لماذا نستعملها", list: ["تنفيذ الطلبات وتوصيلها وإصدار الفواتير.", "إرسال رسائل الحساب: تأكيد البريد واستعادة كلمة المرور والفواتير.", "خدمة ما بعد البيع والرد على أسئلتك."] },
            { heading: "مع من نشاركها", paragraphs: ["فقط مع من يلزم لتنفيذ طلبك: شركة التوصيل، ومزوّد الدفع، ومزوّد البريد الإلكتروني."] },
            { heading: "مدة الاحتفاظ", paragraphs: ["نحتفظ بمعطيات الحساب ما دام نشطاً، وبالفواتير طوال المدة التي يفرضها القانون المحاسبي."] },
            { heading: "حقوقك", paragraphs: [`وفق القانون 09.08، يحق لك الاطلاع على معطياتك وتصحيحها والاعتراض على معالجتها. يمكنك تعديل اسمك وبريدك من حسابك، ولأي طلب آخر راسلنا على ${STORE.email}.`] },
        ],
    },
};

const en: Record<InfoSlug, InfoPage> = {
    about: {
        title: "About us",
        intro: "Durra is a Moroccan store with four worlds under one roof: electronics, fashion, food, and books & school supplies.",
        blocks: [
            { heading: "Our idea", paragraphs: ["Everything you need for home, work and school in one place, with a simple, transparent experience: clear prices, real stock and delivery to your door."] },
            { heading: "Our promises", list: [`Delivery to every city within ${deliveryHours.min} to ${deliveryHours.max} hours.`, "Cash on delivery available on every order.", `Free returns within ${returnDays} days of delivery.`, "Real people on the phone, WhatsApp and email."] },
        ],
    },
    contact: {
        title: "Contact us",
        intro: "Our team answers questions about orders, delivery and returns. Keep your order number at hand if your question is about an order.",
        blocks: [],
    },
    returns: {
        title: "Returns & exchanges",
        intro: `You can return any product within ${returnDays} days of receiving it, no reason needed.`,
        blocks: [
            { heading: "Conditions", list: ["The product is in its original condition, unused, in its original packaging with all accessories.", "It comes with the order number or invoice."] },
            { heading: "Not returnable", list: ["Food and perishable products.", "Perfumes and personal-care products once opened.", "Made-to-order or customised products."] },
            { heading: "How to return", list: ["Contact us from the “Contact us” page with your order number.", "We arrange a pickup or give you the return address.", "Once the product is checked, we refund you within 14 days with the payment method you used, or by cash/transfer for cash-on-delivery orders."] },
            { heading: "Faulty or wrong item", paragraphs: [`If an item arrives faulty or different from your order, we cover the return costs and replace or refund it. Electronics also carry a ${warrantyMonths}-month warranty.`] },
        ],
    },
    payment: {
        title: "Payment methods",
        intro: "You choose how to pay in the last step of checkout.",
        blocks: [
            { heading: "Cash on delivery", paragraphs: ["Pay the courier in cash when your order arrives. No card needed."] },
            { heading: "Card and PayPal", paragraphs: ["Available at checkout. The payment is recorded as soon as it is confirmed and the order moves to “paid”."] },
            { heading: "Invoice", paragraphs: ["Your PDF invoice is emailed after payment and can be downloaded any time from the order page in your account."] },
            { heading: "Prices", paragraphs: ["All prices are in Moroccan dirhams, taxes included. Delivery is free unless the cart says otherwise."] },
        ],
    },
    terms: {
        title: "Terms & conditions",
        intro: `These terms govern sales on the Durra store, operated by ${STORE.companyName}.`,
        blocks: [
            { heading: "1. Seller", list: [STORE.companyName, STORE.registration, STORE.address.en, `${STORE.email} · ${STORE.phone}`] },
            { heading: "2. Orders", paragraphs: ["An order is confirmed once checkout is completed, and you receive a confirmation. A verified email address is required to order. We may cancel an order if a product is no longer available; you will be informed and refunded."] },
            { heading: "3. Prices and stock", paragraphs: ["Prices are shown in dirhams, taxes included. Stock is reserved when the order is created and released if it is cancelled before shipping."] },
            { heading: "4. Delivery", paragraphs: [`We deliver to every city, usually within ${deliveryHours.min} to ${deliveryHours.max} hours. You can follow your order status from your account.`] },
            { heading: "5. Cancellation and returns", paragraphs: [`You can cancel an order from your account while it is “pending”. You may return products within ${returnDays} days of delivery as described on the “Returns & exchanges” page, beyond the withdrawal period set by consumer-protection law 31-08.`] },
            { heading: "6. Warranty and liability", paragraphs: [`Products carry the legal warranty against defects, and electronics a ${warrantyMonths}-month warranty. We are not liable for damage caused by misuse.`] },
            { heading: "7. Personal data", paragraphs: ["Your data is processed as described in the “Privacy policy” and under law 09-08."] },
            { heading: "8. Governing law", paragraphs: ["These terms are governed by Moroccan law. Moroccan courts have jurisdiction after an attempt at amicable settlement."] },
        ],
    },
    privacy: {
        title: "Privacy policy",
        intro: "We only collect what we need to fulfil your orders, and we never sell your data.",
        blocks: [
            { heading: "What we collect", list: ["Account: name, email and password (hashed).", "Orders: shipping address, phone, products and payment method.", "In your browser only: language, display mode, wishlist and sign-in token. No advertising trackers."] },
            { heading: "Why we use it", list: ["To process, deliver and invoice your orders.", "To send account emails: email confirmation, password reset and invoices.", "After-sales service and answering your questions."] },
            { heading: "Who we share it with", paragraphs: ["Only those needed to fulfil your order: the delivery company, the payment provider and the email provider."] },
            { heading: "How long we keep it", paragraphs: ["Account data while the account is active; invoices for as long as accounting law requires."] },
            { heading: "Your rights", paragraphs: [`Under law 09-08 you can access, correct and object to the processing of your data. You can edit your name and email in your account; for anything else, write to ${STORE.email}.`] },
        ],
    },
};

export function infoPage(slug: InfoSlug, lang: Lang): InfoPage {
    return (lang === "ar" ? ar : en)[slug];
}
