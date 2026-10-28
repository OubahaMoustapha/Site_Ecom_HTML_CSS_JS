import { useState } from "react";
import { usePreferences } from "../../context/preferences";
import { useToast } from "../../context/toast";
import { errorMessage } from "../../lib/errors";
import { NEXT_STATUSES } from "../../lib/orders";
import { updateOrderStatus } from "../../services/adminService";
import type { Order, OrderStatus } from "../../types/api";
import ConfirmButton from "./ConfirmButton";

/** Buttons for the transitions the API allows from the current status. */
export default function StatusChanger({ order, onChanged }: { order: Order; onChanged: () => void }) {
    const { t } = usePreferences();
    const { notify } = useToast();
    const [busy, setBusy] = useState(false);
    const options = NEXT_STATUSES[order.status];

    const change = async (status: OrderStatus) => {
        setBusy(true);
        try {
            await updateOrderStatus(order.id, status);
            notify(`${t("order.number", { id: order.id })}: ${t(`status.${status}`)}`);
            onChanged();
        } catch (error) {
            notify(errorMessage(error, t("common.error")), "error");
        } finally {
            setBusy(false);
        }
    };

    if (options.length === 0) {
        return <span className="muted">—</span>;
    }

    return (
        <div className="row-actions">
            {options.map((status) => status === "cancelled"
                ? <ConfirmButton key={status} question={t("order.cancelConfirm")} onConfirm={() => change(status)} disabled={busy}>{t("status.cancelled")}</ConfirmButton>
                : (
                    <button key={status} type="button" className="btn btn--outline btn--sm" disabled={busy} aria-busy={busy} onClick={() => change(status)}>
                        → {t(`status.${status}`)}
                    </button>
                ))}
        </div>
    );
}
