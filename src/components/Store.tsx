import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Check, Lock } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import { useLanguage } from '../context/LanguageContext';
import { localizeVariant } from '../i18n/localize';
import {
  LINEUP_EQUIP_COUNT,
  MoveCategory,
  STORE_CATEGORIES,
  Variant,
  canEquipUpperExercise,
  hasBalancedUpperSelection
} from './moves';

interface StoreProps {
  coins: number;
  owned: string[];
  equippedUpper: string[];
  equippedLower: string[];
  equippedCore: string[];
  onBack: () => void;
  onBuy: (categoryId: string, variant: Variant) => void;
  onToggleEquipUpper: (exerciseId: string) => void;
  onToggleEquipLower: (exerciseId: string) => void;
  onToggleEquipCore: (exerciseId: string) => void;
  rotatingProgramEnabled: boolean;
}

export function Store({
  coins,
  owned,
  equippedUpper,
  equippedLower,
  equippedCore,
  onBack,
  onBuy,
  onToggleEquipUpper,
  onToggleEquipLower,
  onToggleEquipCore,
  rotatingProgramEnabled
}: StoreProps) {
  const { t } = useLanguage();
  const equipLocked = rotatingProgramEnabled;

  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8 gap-3">
        <button
          type="button"
          onClick={onBack}
          className="cyber-icon-btn cyber-icon-btn--back"
          aria-label={t.store.back}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <h1 className="text-2xl md:text-3xl tracking-tighter store-title-glow text-[#00B2FF] normal-case">
          {t.store.title}
        </h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="space-y-10">
        {equipLocked && (
          <p className="store-status-note normal-case">{t.store.programEquipLocked}</p>
        )}

        <LineupSection
          category={STORE_CATEGORIES[0]}
          coins={coins}
          owned={owned}
          equipped={equippedUpper}
          onBuy={onBuy}
          onToggleEquip={onToggleEquipUpper}
          equipLocked={equipLocked}
          canEquip={(id) => canEquipUpperExercise(equippedUpper, id)}
          statusNote={
            equippedUpper.length === LINEUP_EQUIP_COUNT &&
            !hasBalancedUpperSelection(equippedUpper)
              ? t.store.needBalancedUpper
              : undefined
          }
        />

        <LineupSection
          category={STORE_CATEGORIES[1]}
          coins={coins}
          owned={owned}
          equipped={equippedLower}
          onBuy={onBuy}
          onToggleEquip={onToggleEquipLower}
          equipLocked={equipLocked}
          canEquip={(id) =>
            equippedLower.includes(id) ||
            equippedLower.length < LINEUP_EQUIP_COUNT
          }
        />

        <LineupSection
          category={STORE_CATEGORIES[2]}
          coins={coins}
          owned={owned}
          equipped={equippedCore}
          onBuy={onBuy}
          onToggleEquip={onToggleEquipCore}
          equipLocked={equipLocked}
          canEquip={(id) =>
            equippedCore.includes(id) ||
            equippedCore.length < LINEUP_EQUIP_COUNT
          }
        />
      </div>
    </div>
  );
}

function LineupSection({
  category,
  coins,
  owned,
  equipped,
  onBuy,
  onToggleEquip,
  equipLocked,
  canEquip,
  statusNote
}: {
  category: MoveCategory;
  coins: number;
  owned: string[];
  equipped: string[];
  onBuy: (categoryId: string, variant: Variant) => void;
  onToggleEquip: (exerciseId: string) => void;
  equipLocked: boolean;
  canEquip: (exerciseId: string) => boolean;
  statusNote?: string;
}) {
  const { t } = useLanguage();
  const categoryCopy = t.moves.categories[category.id];
  const atCapacity = equipped.length >= LINEUP_EQUIP_COUNT;

  return (
    <section>
      <p className="text-sm font-medium mb-3 normal-case opacity-70">
        {categoryCopy.equipHint}
      </p>
      {statusNote && (
        <p className="store-status-note mb-4 normal-case">{statusNote}</p>
      )}

      <div className="flex flex-col gap-3">
        {category.variants.map((variant, i) => {
          const localized = localizeVariant(variant, t.moves);
          const isOwned = owned.includes(variant.id);
          const isEquipped = equipped.includes(variant.id);
          const canAfford = coins >= variant.price;
          const allowEquip =
            !equipLocked && isOwned && (isEquipped || canEquip(variant.id));
          const equipLockTitle = equipLocked ? t.store.programEquipLocked : undefined;
          const patternLabel =
            category.id === 'upper' && variant.pattern
              ? variant.pattern === 'push'
                ? t.store.push
                : t.store.pull
              : null;

          return (
            <motion.div
              key={variant.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="store-item-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-lg font-display uppercase tracking-tight normal-case flex items-baseline gap-2 min-w-0">
                    <span>{localized.name}</span>
                    {patternLabel && (
                      <span className="store-pattern-label">{patternLabel}</span>
                    )}
                  </h3>
                  {isEquipped && (
                    <span className="store-equipped-badge">
                      <Check size={12} strokeWidth={3} />
                      {t.store.equipped}
                    </span>
                  )}
                </div>
                <p className="font-medium opacity-70 text-sm normal-case leading-snug">
                  {localized.description}
                </p>
              </div>

              <div className="shrink-0">
                {isEquipped ? (
                  <button
                    type="button"
                    onClick={() => !equipLocked && onToggleEquip(variant.id)}
                    disabled={equipLocked}
                    title={equipLockTitle}
                    className="store-btn store-btn--active">
                    {t.store.active}
                  </button>
                ) : isOwned ? (
                  <button
                    type="button"
                    onClick={() => allowEquip && onToggleEquip(variant.id)}
                    disabled={!allowEquip}
                    title={
                      equipLockTitle ??
                      (!allowEquip && atCapacity
                        ? t.store.unequipFirst
                        : !allowEquip
                          ? t.store.needOppositePattern
                          : undefined)
                    }
                    className="store-btn store-btn--equip">
                    {t.store.equip}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => canAfford && onBuy(category.id, variant)}
                    disabled={!canAfford}
                    className={`store-btn ${canAfford ? 'store-btn--buy' : 'store-btn--locked'}`}>
                    {canAfford ? (
                      <Coins size={14} strokeWidth={3} />
                    ) : (
                      <Lock size={14} strokeWidth={3} />
                    )}
                    {variant.price}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
