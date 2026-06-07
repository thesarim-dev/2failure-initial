import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Coins, Check, Lock } from 'lucide-react';
import {
  CORE_EQUIP_COUNT,
  CORE_STORE_CATEGORY,
  MOVE_CATEGORIES,
  MoveCategory,
  Variant
} from './moves';
import { ThemeToggle } from './ThemeToggle';

interface StoreProps {
  coins: number;
  owned: string[];
  equipped: Record<string, string>;
  equippedCore: string[];
  isDark: boolean;
  onToggleDark: () => void;
  onBack: () => void;
  onBuy: (categoryId: string, variant: Variant) => void;
  onEquip: (categoryId: string, variantId: string) => void;
  onToggleEquipCore: (exerciseId: string) => void;
}

export function Store({
  coins,
  owned,
  equipped,
  equippedCore,
  isDark,
  onToggleDark,
  onBack,
  onBuy,
  onEquip,
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
        <div className="flex items-center gap-2">
          <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
          <div className="flex items-center gap-2 bg-[#CCFF00] text-black dark:bg-[#1a5c14] dark:text-[#E6FF4D] dark:border-[#CCFF00] px-3 py-1.5 border-2 border-black brutal-shadow-sm">
            <Coins size={20} strokeWidth={2.5} />
            <span className="font-bold tabular-nums">{coins}</span>
          </div>
        </div>
      </header>

      <div className="bg-black text-white border-4 border-black p-4 mb-10 brutal-shadow">
        <p className="font-bold text-lg">
          Buy variants. Equip them. Suffer in style.
        </p>
        <p className="text-sm text-white/60 font-bold mt-1">
          Core: equip {CORE_EQUIP_COUNT} exercises for your daily lineup.
        </p>
      </div>

      <div className="space-y-12">
        {MOVE_CATEGORIES.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat}
            coins={coins}
            owned={owned}
            equippedId={equipped[cat.id]}
            onBuy={onBuy}
            onEquip={onEquip}
          />
        ))}

        <CoreSection
          coins={coins}
          owned={owned}
          equippedCore={equippedCore}
          onBuy={onBuy}
          onToggleEquipCore={onToggleEquipCore}
        />
      </div>
    </div>
  );
}

function CategorySection({
  category,
  coins,
  owned,
  equippedId,
  onBuy,
  onEquip
}: {
  category: MoveCategory;
  coins: number;
  owned: string[];
  equippedId: string | undefined;
  onBuy: (categoryId: string, variant: Variant) => void;
  onEquip: (categoryId: string, variantId: string) => void;
}) {
  return (
    <section>
      <div
        className={`${category.color} border-4 border-black dark:border-white px-4 py-2 inline-block brutal-shadow-sm mb-4 -rotate-1`}>
        <h2 className="text-2xl">{category.name.toUpperCase()}</h2>
      </div>

      <div className="space-y-4">
        {category.variants.map((variant, i) => {
          const isOwned = owned.includes(variant.id);
          const isEquipped = equippedId === variant.id;
          const canAfford = coins >= variant.price;

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
                <p className="font-medium text-black/70 dark:text-white/70 text-sm">
                  {variant.description}
                </p>
              </div>

              <div className="shrink-0">
                {isEquipped ? (
                  <div className="bg-[#CCFF00] text-black border-2 border-black dark:bg-[#d4d4d0] dark:text-black dark:border-white px-4 py-2 font-bold uppercase text-sm">
                    Active
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => onEquip(category.id, variant.id)}
                    className="bg-black text-white border-2 border-black dark:border-white dark:bg-[#3d9a32] dark:text-black px-4 py-2 font-bold uppercase text-sm brutal-shadow-hover transition-all">
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

function CoreSection({
  coins,
  owned,
  equippedCore,
  onBuy,
  onToggleEquipCore
}: {
  coins: number;
  owned: string[];
  equippedCore: string[];
  onToggleEquipCore: (exerciseId: string) => void;
  onBuy: (categoryId: string, variant: Variant) => void;
}) {
  const atCapacity = equippedCore.length >= CORE_EQUIP_COUNT;

  return (
    <section>
      <div
        className={`${CORE_STORE_CATEGORY.color} border-4 border-black dark:border-white px-4 py-2 inline-block brutal-shadow-sm mb-2 -rotate-1`}>
        <h2 className="text-2xl">{CORE_STORE_CATEGORY.name.toUpperCase()}</h2>
      </div>
      <p className="text-sm font-bold mb-4 normal-case opacity-70">
        Equip {CORE_EQUIP_COUNT} for your home screen ({equippedCore.length}/
        {CORE_EQUIP_COUNT} active)
      </p>

      <div className="space-y-4">
        {CORE_STORE_CATEGORY.variants.map((variant, i) => {
          const isOwned = owned.includes(variant.id);
          const isEquipped = equippedCore.includes(variant.id);
          const canAfford = coins >= variant.price;
          const canEquip = isOwned && (isEquipped || !atCapacity);

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
                <p className="font-medium text-black/70 dark:text-white/70 text-sm">
                  {variant.description}
                </p>
              </div>

              <div className="shrink-0">
                {isEquipped ? (
                  <button
                    onClick={() => onToggleEquipCore(variant.id)}
                    className="bg-[#CCFF00] text-black border-2 border-black dark:bg-[#d4d4d0] dark:text-black dark:border-white px-4 py-2 font-bold uppercase text-sm brutal-shadow-hover transition-all">
                    Active
                  </button>
                ) : isOwned ? (
                  <button
                    onClick={() => canEquip && onToggleEquipCore(variant.id)}
                    disabled={!canEquip}
                    className="bg-black text-white border-2 border-black dark:border-white dark:bg-[#3d9a32] dark:text-black px-4 py-2 font-bold uppercase text-sm brutal-shadow-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Equip
                  </button>
                ) : (
                  <button
                    onClick={() => canAfford && onBuy(CORE_STORE_CATEGORY.id, variant)}
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
