import type { IconName } from "../components/icons";
import type { WorldKey } from "./worlds";

// Keyword → icon. Order matters: more specific keywords first
// (e.g. "حقيبة مدرسية" before "حقيبة").
const RULES: Array<[RegExp, IconName]> = [
    [/حقيبة مدرسية|backpack|school bag/i, "backpack"],
    [/آلة حاسبة|calculator/i, "calculator"],
    [/دفاتر|دفتر|notebook/i, "notebook"],
    [/أقلام|قلم|ألوان|pencil|pen|paint|watercolou?r/i, "pencil"],
    [/smartphone|phone|هاتف|iphone/i, "phone"],
    [/laptop|حاسوب/i, "laptop"],
    [/tablet|لوحي/i, "tablet"],
    [/headphone|سماع/i, "headphones"],
    [/smartwatch|watch|ساعة/i, "watch"],
    [/camera|كاميرا/i, "camera"],
    [/gaming|ألعاب/i, "gamepad"],
    [/monitor|شاشة/i, "monitor"],
    [/keyboard|لوحة مفاتيح/i, "keyboard"],
    [/mice|mouse|فأرة/i, "mouse"],
    [/speaker|مكبر/i, "speaker"],
    [/charger|شاحن/i, "plug"],
    [/cable|كابل/i, "cable"],
    [/storage|تخزين/i, "storage"],
    [/network|شبكة/i, "wifi"],
    [/معطف|coat/i, "coat"],
    [/فستان|dress/i, "dress"],
    [/قميص|shirt/i, "shirt"],
    [/حذاء|أحذية|shoe/i, "shoe"],
    [/قرط|مجوهر|ring|jewel/i, "ring"],
    [/عطر|perfume/i, "perfume"],
    [/حقيبة|حقائب|bag/i, "bag"],
    [/طماطم|tomato/i, "tomato"],
    [/تفاح|apple/i, "apple"],
    [/خبز|مخبوز|bread/i, "bread"],
    [/زيوت|زيت|oil/i, "bottle"],
    [/عسل|honey/i, "jar"],
    [/قهوة|coffee/i, "coffee"],
    [/تمر|date/i, "leaf"],
];

const WORLD_DEFAULT: Record<WorldKey, IconName> = {
    electronics: "phone",
    fashion: "bag",
    food: "leaf",
    books: "book",
};

/**
 * Picks an icon from the most specific text first (product name),
 * then broader ones (category), then the world default.
 */
export function productIcon(texts: string | Array<string | null | undefined>, world: WorldKey | null): IconName {
    for (const text of Array.isArray(texts) ? texts : [texts]) {
        const match = text ? RULES.find(([pattern]) => pattern.test(text)) : undefined;

        if (match) {
            return match[1];
        }
    }

    return world ? WORLD_DEFAULT[world] : "box";
}
