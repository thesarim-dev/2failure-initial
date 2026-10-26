import type { ResourceId } from '../../game/catalog';
import stoneIcon from '../../assets/resources/stone.png';
import timberIcon from '../../assets/resources/timber.png';
import crystalIcon from '../../assets/resources/crystal.png';

/** The material icons used across the app (Base screen, HUD, rewards). */
const RESOURCE_ICON: Record<ResourceId, string> = {
  stone: stoneIcon,
  timber: timberIcon,
  crystal: crystalIcon
};

export function ResourceIcon({ id, size = 18 }: { id: ResourceId; size?: number }) {
  return (
    <img
      src={RESOURCE_ICON[id]}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="base-resource-icon"
    />
  );
}
