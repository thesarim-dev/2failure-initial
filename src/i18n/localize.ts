import type { Move, Variant } from '../components/moves';
import type { LineupSlot, MovesTranslations } from './types';

export function localizeMove(move: Move, moves: MovesTranslations): Move {
  const variant = moves.variants[move.id];
  if (!variant) return move;

  const slot = move.lineupSlot;
  const category = moves.categories[slot];
  let displayGroup = move.displayGroup;

  if (slot === 'upper' && move.pattern === 'push') {
    displayGroup = moves.displayGroups.upperPush;
  } else if (slot === 'upper' && move.pattern === 'pull') {
    displayGroup = moves.displayGroups.upperPull;
  } else if (slot === 'lower') {
    displayGroup = moves.displayGroups.lowerbody;
  } else if (slot === 'core') {
    displayGroup = moves.displayGroups.core;
  }

  return {
    ...move,
    name: variant.name,
    description: variant.description,
    muscleGroup: category?.muscleGroup ?? moves.muscleGroups.fullBody,
    displayGroup
  };
}

export function localizeVariant(
  variant: Variant,
  moves: MovesTranslations
): Variant {
  const localized = moves.variants[variant.id];
  if (!localized) return variant;

  return {
    ...variant,
    name: localized.name,
    description: localized.description
  };
}

export function getCategoryPatternLabel(
  categoryId: LineupSlot,
  categoryName: string,
  pattern: 'push' | 'pull' | undefined,
  moves: MovesTranslations
): string {
  if (categoryId === 'upper' && pattern) {
    return pattern === 'push'
      ? moves.displayGroups.upperPush
      : moves.displayGroups.upperPull;
  }
  return moves.categories[categoryId]?.name.toLowerCase() ?? categoryName;
}
