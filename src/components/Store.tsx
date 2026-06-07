import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Check, Lock } from 'lucide-react';
import { CoinsBadge } from './CoinsBadge';
import {
  LINEUP_EQUIP_COUNT,
  MoveCategory,
  STORE_CATEGORIES,
  Variant,
  canEquipUpperExercise,
  getUpperDisplayGroup,
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
  onToggleEquipCore
}: StoreProps) {
  return (
    <div className="flex flex-col w-full min-h-full p-4 md:p-8 max-w-2xl mx-auto pb-24">
      <header className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="bg-white dark:bg-[#2a2a2a] dark:text-white border-4 border-black dark:border-white p-2 brutal-shadow-sm brutal-shadow-hover transition-all"
          aria-label="Back">
          <ArrowLeft size={24} strokeWidth={3} />
        </button>
        <h1 className="text-3xl tracking-tighter">THE STORE</h1>
        <CoinsBadge coins={coins} />
      </header>

      <div className="bg-black text-white border-4 border-black p-4 mb-10 brutal-shadow">
        <p className="font-bold text-lg">
          Build your daily lineup: 2 Upper, 2 Lower, 2 Core.
        </p>
        <p className="text-sm text-white/60 font-bold mt-1 normal-case">
          Upper body must include one Push and one Pull.
        </p>
      </div>

      <div className="space-y-12">
        <LineupSection
          category={STORE_CATEGORIES[0]}
          coins={coins}
          owned={owned}
          equipped={equippedUpper}
          onBuy={onBuy}
          onToggleEquip={onToggleEquipUpper}
          canEquip={(id) => canEquipUpperExercise(equippedUpper, id)}
          statusNote={
            equippedUpper.length === LINEUP_EQUIP_COUNT &&
            !hasBalancedUpperSelection(equippedUpper)
              ? 'Need 1 Push + 1 Pull in your upper lineup.'
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
  canEquip,
  statusNote
}: {
  category: MoveCategory;
  coins: number;
  owned: string[];
  equipped: string[];
  onBuy: (categoryId: string, variant: Variant) => void;
  onToggleEquip: (exerciseId: string) => void;
  canEquip: (exerciseId: string) => boolean;
  statusNote?: string;
}) {
  const atCapacity = equipped.length >= LINEUP_EQUIP_COUNT;

  return (
    <section>
      <div
        className={`${category.color} border-4 border-black dark:border-white px-4 py-2 inline-block brutal-shadow-sm mb-2 -rotate-1`}>
        <h2 className="text-2xl">{category.name.toUpperCase()}</h2>
      </div>
      <p className="text-sm font-bold mb-1 normal-case opacity-70">
        {category.equipHint} ({equipped.length}/{LINEUP_EQUIP_COUNT} active)
      </p>
      {statusNote && (
        <p className="text-xs font-bold mb-4 normal-case text-[#FF4D00]">
          {statusNote}
        </p>
      )}
      {!statusNote && <div className="mb-4" />}

      <div className="space-y-4">
        {category.variants.map((variant, i) => {
          const isOwned = owned.includes(variant.id);
          const isEquipped = equipped.includes(variant.id);
          const canAfford = coins >= variant.price;
          const allowEquip = isOwned && (isEquipped || canEquip(variant.id));
          const patternLabel =
            category.id === 'upper' && variant.pattern
              ? getUpperDisplayGroup(variant.pattern)
              : category.name.toLowerCase();

          return (
            <motion.div
              key={variant.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-[#2a2a2a] border-4 border-black dark:border-white p-4 brutal-shadow-sm flex items-center gap-4">
              <div className="flex-1 min-w-0 dark:text-[#f4f4f0]">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-xl font-display uppercase">
                    {variant.name}
                  </h3>
                  {isEquipped && (
                    <span className="bg-black text-[#CCFF00] dark:bg-[#1a5c14] dark:text-[#E6FF4D] px-2 py-0.5 text-xs font-bold uppercase flex items-center gap-1">
                      <Check size={12} strokeWidth={3} /> Equipped
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold uppercase text-black/50 dark:text-white/50 mb-1">
                  {patternLabel}
                </p>
                <p className="font-medium text-black/70 dark:text-white/70 text-sm">
                  {variant.description}
                </p>
              </div>

              <div className="shrink-0">
                {isEquipped ? (
                  <button
                    onClick={() => onToggleEquip(variant.id)}
                    className="bg-[#CCFF00] text-black border-2 border-black dark:bg-[#d4d4d0] dark:text-black dark:border-white px-4 py-2 font-bold uppercase text-sm brutal-shadow-hover transition-all">
                    Active
                  </button>
                ) : isOwned ? (
                  <button
                    onClick={() => allowEquip && onToggleEquip(variant.id)}
                    disabled={!allowEquip}
                    title={
                      !allowEquip && atCapacity
                        ? 'Unequip one first'
                        : !allowEquip
                          ? 'Need opposite movement pattern'
                          : undefined
                    }
                    className="bg-black text-white border-2 border-black dark:border-white dark:bg-[#3d9a32] dark:text-black px-4 py-2 font-bold uppercase text-sm brutal-shadow-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Equip
                  </button>
                ) : (
                  <button
                    onClick={() => canAfford && onBuy(category.id, variant)}
                    disabled={!canAfford}
                    className={`border-2 border-black dark:border-white px-4 py-2 font-bold uppercase text-sm flex items-center gap-1.5 transition-all ${canAfford ? 'bg-[#FF00FF] text-black brutal-shadow-hover dark:bg-[#5c1a5c] dark:text-[#FF99FF]' : 'bg-gray-200 dark:bg-gray-700 text-black/40 dark:text-white/40 cursor-not-allowed'}`}>
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
