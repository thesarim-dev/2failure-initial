export type WeightUnit = 'kg' | 'lb';

const KG_TO_LB = 2.2046226218;
const PLATE_KG = 2.5;
const PLATE_LB = 5;

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kg * KG_TO_LB : kg;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'lb' ? value / KG_TO_LB : value;
}

export function plateStep(unit: WeightUnit): number {
  return unit === 'lb' ? PLATE_LB : PLATE_KG;
}

export function roundDisplayToPlate(display: number, unit: WeightUnit): number {
  const step = plateStep(unit);
  return Math.round(display / step) * step;
}

export function roundToPlateKg(kg: number, unit: WeightUnit): number {
  const display = kgToDisplay(kg, unit);
  const rounded = roundDisplayToPlate(display, unit);
  return displayToKg(rounded, unit);
}

export function bumpPlateKg(kg: number, unit: WeightUnit, direction: 1 | -1): number {
  const display = kgToDisplay(kg, unit);
  const next = display + direction * plateStep(unit);
  const minDisplay = plateStep(unit);
  return displayToKg(Math.max(minDisplay, roundDisplayToPlate(next, unit)), unit);
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  const display = kgToDisplay(kg, unit);
  const rounded = roundDisplayToPlate(display, unit);
  const label = unit === 'lb' ? 'lb' : 'kg';
  const text =
    unit === 'lb'
      ? rounded.toFixed(rounded % 1 === 0 ? 0 : 1)
      : rounded % 1 === 0
        ? `${rounded}`
        : rounded.toFixed(1);
  return `${text} ${label}`;
}

export function weightInputStep(unit: WeightUnit): number {
  return unit === 'lb' ? PLATE_LB : PLATE_KG;
}
