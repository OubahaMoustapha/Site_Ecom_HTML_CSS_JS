import { usePreferences } from "../context/preferences";
import type { OrderStatus, Payment } from "../types/api";

export function StatusBadge({ status }: { status: OrderStatus }) {
    const { t } = usePreferences();
    return <span className={`status status--${status}`}>{t(`status.${status}`)}</span>;
}

export function PaymentBadge({ status }: { status: Payment["status"] }) {
    const { t } = usePreferences();
    return <span className={`status status--pay-${status}`}>{t(`payment.${status}`)}</span>;
}
