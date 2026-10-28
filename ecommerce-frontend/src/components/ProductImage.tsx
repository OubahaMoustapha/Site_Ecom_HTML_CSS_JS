import { useState, type ReactNode } from "react";

interface Props {
    src?: string;
    alt: string;
    className?: string;
    /** Shown when there is no image or it fails to load (e.g. the product icon). */
    fallback: ReactNode;
}

/**
 * A product photo that degrades to its fallback instead of a broken image.
 * Remount with `key={src}` when the source can change.
 */
export default function ProductImage({ src, alt, className, fallback }: Props) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return <>{fallback}</>;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
        />
    );
}
