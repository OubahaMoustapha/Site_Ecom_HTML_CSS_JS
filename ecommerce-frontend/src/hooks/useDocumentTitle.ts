import { useEffect } from "react";

const SITE = "Durra · دُرّة";

function descriptionTag() {
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');

    if (!tag) {
        tag = document.createElement("meta");
        tag.name = "description";
        document.head.appendChild(tag);
    }

    return tag;
}

// The description written in index.html, restored on pages that do not set one.
const DEFAULT_DESCRIPTION = typeof document === "undefined" ? "" : descriptionTag().content;

/** Sets the tab title ("Page — Durra · دُرّة") and, optionally, the meta description. */
export function useDocumentTitle(title?: string | null, description?: string | null) {
    useEffect(() => {
        document.title = title ? `${title} — ${SITE}` : SITE;
        descriptionTag().content = description?.trim().slice(0, 300) || DEFAULT_DESCRIPTION;
    }, [title, description]);
}
