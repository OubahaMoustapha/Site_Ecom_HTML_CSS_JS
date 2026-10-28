import { Link } from "react-router";
import { usePreferences } from "../context/preferences";
import { WORLDS } from "../lib/worlds";
import Icon from "./icons";

/** The four world entry tiles, each dressed in its own identity. */
export default function WorldTiles() {
    const { t } = usePreferences();

    return (
        <div className="world-tiles">
            {WORLDS.map((world) => (
                <Link key={world.key} to={`/world/${world.key}`} className={`world-tile world-tile--${world.key}`}>
                    <Icon name={world.icon} size={34} strokeWidth={1.5} className="world-tile__icon" />
                    <span className="world-tile__kicker">{t(`world.${world.key}.kicker`)}</span>
                    <span className="world-tile__name">{t(`world.${world.key}.tile`)}</span>
                </Link>
            ))}
        </div>
    );
}
