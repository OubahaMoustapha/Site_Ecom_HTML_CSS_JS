import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { usePreferences } from "../../context/preferences";

export interface Point {
    date: string;
    label: string;
    value: number;
}

const WIDTH = 640;
const HEIGHT = 220;
// The axis side gets the wide padding; it is mirrored in right-to-left layouts.
const PAD = { top: 16, bottom: 28, axis: 56, end: 12 };

function niceMax(value: number) {
    if (value <= 0) return 100;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    return Math.ceil(value / magnitude) * magnitude;
}

/**
 * Single-series area chart with a crosshair tooltip (pointer and keyboard)
 * and a table view, so no value depends on hovering.
 */
export default function RevenueChart({ points, title }: { points: Point[]; title: string }) {
    const { t, formatMoney, dir } = usePreferences();
    const [active, setActive] = useState<number | null>(null);

    const rtl = dir === "rtl";
    const innerW = WIDTH - PAD.axis - PAD.end;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const plotLeft = rtl ? PAD.end : PAD.axis;
    const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;

    // Time runs in reading direction: right-to-left in Arabic.
    const x = (index: number) => {
        const offset = index * step;
        return rtl ? plotLeft + innerW - offset : plotLeft + offset;
    };
    const y = (value: number) => PAD.top + innerH - (value / max) * innerH;

    const line = points.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join("");
    const area = points.length ? `${line}L${x(points.length - 1)},${PAD.top + innerH}L${x(0)},${PAD.top + innerH}Z` : "";
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => max * ratio);
    const labelEvery = Math.max(1, Math.ceil(points.length / 6));

    const onPointer = (event: PointerEvent<SVGRectElement>) => {
        const box = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
        if (!box || points.length === 0) return;

        const svgX = ((event.clientX - box.left) / box.width) * WIDTH;
        const offset = rtl ? plotLeft + innerW - svgX : svgX - plotLeft;
        const index = Math.round(offset / (step || 1));
        setActive(Math.min(points.length - 1, Math.max(0, index)));
    };

    const onKey = (event: KeyboardEvent<SVGSVGElement>) => {
        const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
        const backward = dir === "rtl" ? "ArrowRight" : "ArrowLeft";

        if (event.key === forward || event.key === backward) {
            event.preventDefault();
            setActive((current) => {
                const base = current ?? points.length - 1;
                const next = base + (event.key === forward ? 1 : -1);
                return Math.min(points.length - 1, Math.max(0, next));
            });
        }
    };

    const current = active !== null ? points[active] : null;

    return (
        <figure className="chart">
            <div className="chart__plot">
                <svg
                    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                    role="img"
                    aria-label={title}
                    tabIndex={0}
                    onKeyDown={onKey}
                    onBlur={() => setActive(null)}
                >
                    {ticks.map((tick) => (
                        <g key={tick} className="chart__grid">
                            <line x1={plotLeft} x2={plotLeft + innerW} y1={y(tick)} y2={y(tick)} />
                            <text x={rtl ? plotLeft + innerW + 8 : plotLeft - 8} y={y(tick) + 4} textAnchor={rtl ? "start" : "end"}>
                                {tick >= 1000 ? `${Math.round(tick / 100) / 10}k` : Math.round(tick)}
                            </text>
                        </g>
                    ))}

                    <path d={area} className="chart__area" />
                    <path d={line} className="chart__line" />

                    {points.map((point, index) => index % labelEvery === 0 && (
                        <text key={point.date} x={x(index)} y={HEIGHT - 8} textAnchor="middle" className="chart__xlabel">
                            {point.label}
                        </text>
                    ))}

                    {current && active !== null && (
                        <g className="chart__cursor">
                            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} />
                            <circle cx={x(active)} cy={y(current.value)} r={5} />
                        </g>
                    )}

                    <rect
                        x={plotLeft}
                        y={PAD.top}
                        width={innerW}
                        height={innerH}
                        fill="transparent"
                        onPointerMove={onPointer}
                        onPointerLeave={() => setActive(null)}
                    />
                </svg>

                {current && active !== null && (
                    <div
                        className="chart__tooltip"
                        style={{ insetInlineStart: `${Math.min(80, Math.max(4, ((rtl ? WIDTH - x(active) : x(active)) / WIDTH) * 100 - 10))}%` }}
                        role="status"
                    >
                        <strong>{formatMoney(current.value)}</strong>
                        <span>{current.label}</span>
                    </div>
                )}
            </div>

            <details className="chart__table">
                <summary>{t("admin.revenue.note")}</summary>
                <table className="table table--compact">
                    <thead><tr><th>{t("order.date")}</th><th className="num">{t("admin.amount")}</th></tr></thead>
                    <tbody>
                        {points.filter((point) => point.value > 0).map((point) => (
                            <tr key={point.date}><td>{point.label}</td><td className="num">{formatMoney(point.value)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}
