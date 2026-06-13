import type { LineupSlot } from './moves';

export const WORKOUT_TIMER_GLOW: Record<LineupSlot, string> = {
  upper: 'workout-timer-glow--upper',
  lower: 'workout-timer-glow--lower',
  core: 'workout-timer-glow--core'
};

export const WORKOUT_FINISH_BTN = 'workout-finish-btn workout-finish-btn--rainbow';

export const SUMMARY_SKULL: Record<LineupSlot, string> = {
  upper: 'summary-skull summary-skull--upper',
  lower: 'summary-skull summary-skull--lower',
  core: 'summary-skull summary-skull--core'
};

export const SUMMARY_TITLE: Record<LineupSlot, string> = {
  upper: 'summary-title summary-title--upper',
  lower: 'summary-title summary-title--lower',
  core: 'summary-title summary-title--core'
};

export const SUMMARY_HOME_BTN: Record<LineupSlot, string> = {
  upper: 'summary-home-btn summary-home-btn--upper',
  lower: 'summary-home-btn summary-home-btn--lower',
  core: 'summary-home-btn summary-home-btn--core'
};

export const SUMMARY_CONFETTI: Record<LineupSlot, string[]> = {
  upper: ['#CCFF00', '#C8E838', '#5f9100'],
  lower: ['#FF00FF', '#FF66FF', '#e600e6'],
  core: ['#00FFFF', '#4DFFFF', '#00d9d9']
};

export const SUMMARY_ACCENT_TEXT: Record<LineupSlot, string> = {
  upper: 'summary-accent-text--upper',
  lower: 'summary-accent-text--lower',
  core: 'summary-accent-text--core'
};
