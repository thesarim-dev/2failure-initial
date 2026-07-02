export type Language = 'en' | 'he' | 'ar';

export type LineupSlot = 'upper' | 'lower' | 'core' | 'recovery';

export interface FaqListItem {
  label: string;
  text: string;
}

export interface FaqItemTranslation {
  question: string;
  paragraphs?: string[];
  list?: {
    intro?: string;
    items: FaqListItem[];
  };
}

export interface MovesTranslations {
  categories: Record<
    LineupSlot,
    { name: string; muscleGroup: string; equipHint: string }
  >;
  variants: Record<string, { name: string; description: string }>;
  displayGroups: {
    upperPush: string;
    upperPull: string;
    lowerbody: string;
    core: string;
    recovery: string;
  };
  muscleGroups: {
    fullBody: string;
  };
  buttonLabels: string[];
  poseAiHints: Record<'pushups' | 'squats' | 'lunges', string>;
}

export interface MotivationQuote {
  text: string;
  author: string;
}

export interface AppTranslations {
  meta: {
    title: string;
    description: string;
  };
  settings: {
    title: string;
    back: string;
    dailySetTarget: {
      title: string;
      description: string;
      sets: (count: number) => string;
    };
    rotatingProgram: {
      title: string;
      description: string;
      off: string;
      on: string;
      trainingGuide: {
        toggleLabel: string;
        sections: Array<{
          title: string;
          items: Array<{ label: string; text: string }>;
        }>;
      };
      phases: Record<
        'push' | 'legs' | 'pull' | 'mixed' | 'recovery',
        string
      >;
    };
    appearance: {
      title: string;
      nightOn: string;
      dayOn: string;
      switchToDay: string;
      switchToNight: string;
      switchToDayButton: string;
      switchToNightButton: string;
    };
    language: {
      title: string;
      description: string;
      options: Record<Language, string>;
    };
    weightUnit: {
      title: string;
      description: string;
      kg: string;
      lb: string;
    };
    faq: {
      title: string;
      description: string;
      items: FaqItemTranslation[];
    };
    account: {
      title: string;
      description: string;
      signOut: string;
    };
  };
  dashboard: {
    pickYourPoison: string;
    rotatingProgramFocus: (
      cycleDay: number,
      cycleLength: number,
      phaseLabel: string
    ) => string;
    programExerciseDone: string;
    programEquipment: (gear: string) => string;
    equipment: Record<'dumbbell' | 'barbell' | 'bench', string>;
    streak: string;
    setsProgress: (completed: number, goal: number) => string;
    pushupDailyProgress: (completed: number, goal: number) => string;
    loading: string;
    errors: {
      sets: (msg: string) => string;
      stats: (msg: string) => string;
      profile: (msg: string) => string;
    };
    aria: {
      openStore: string;
      openSettings: string;
      loadingCoins: string;
      funFactAndStreak: string;
      streakDays: (days: number) => string;
      previousProgramDay: string;
      nextProgramDay: string;
    };
    funFacts: {
      loading: string;
      facts: string[];
    };
  };
  store: {
    title: string;
    back: string;
    sectionLabels: Record<'upper' | 'lower' | 'core', string>;
    activeCount: (active: number, total: number) => string;
    push: string;
    pull: string;
    equipped: string;
    active: string;
    equip: string;
    unequipFirst: string;
    needOppositePattern: string;
    needBalancedUpper: string;
    programEquipLocked: string;
  };
  login: {
    switchToDay: string;
    switchToNight: string;
    title: string;
    subtitle: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    signInGmail: string;
    redirectingGmail: string;
    signUp: string;
    signingUp: string;
    errors: {
      signIn: string;
      signInGmail: string;
      signUp: string;
      googleOAuth: string;
      restoreSession: string;
    };
    aria: {
      switchToDay: string;
      switchToNight: string;
    };
  };
  workout: {
    cancel: string;
    failingInProgress: string;
    useAiTracking: string;
    useTimerOnly: string;
    statusLoading: string;
    statusTracking: string;
    statusReady: string;
    statusPositioning: string;
    statusCountdown: string;
    statusError: string;
    statusPaused: string;
    countdownStart: string;
    positionGuidance: {
      no_pose: string;
      too_dark: string;
      too_bright: string;
      blurry: string;
      arms_not_visible: string;
      legs_not_visible: string;
      straighten_arms: string;
      stand_up: string;
      hold_still: string;
    };
    loadingPoseModel: string;
    cameraUnavailable: string;
    cameraPaused: string;
    reps: string;
    pauseCam: string;
    resumeCam: string;
    frontCam: string;
    backCam: string;
    loggingReps: (count: number) => string;
    repPromptQuestion: string;
    repPromptPlaceholder: string;
    repPromptError: string;
    repPromptSubmit: string;
    repPromptAria: string;
    saving: string;
    weightPrompt: {
      question: string;
      setLabel: (current: number, total: number) => string;
      rir_1_2: string;
      rir_1: string;
      to_failure: string;
      weightLabelKg: string;
      weightLabelLb: string;
      repsLabel: string;
      weightPlaceholder: string;
      repsPlaceholder: string;
      weightAriaKg: string;
      weightAriaLb: string;
      repsAria: string;
      weightError: string;
      repsError: string;
      decreaseWeight: string;
      increaseWeight: string;
      decreaseReps: string;
      increaseReps: string;
      submit: string;
      lastSession: (weight: string, reps: number) => string;
      todaysSets: (summary: string) => string;
      saveError: string;
    };
  };
  summary: {
    title: string;
    receiptTitle: string;
    receiptTagline: string;
    item: string;
    duration: string;
    coinsEarned: string;
    coinsCapRecommendation: string;
    repsThisSet: string;
    weightThisSet: string;
    personalBest: string;
    weightPersonalBest: string;
    newPersonalBest: string;
    newWeightPersonalBest: string;
    progression: {
      increase: (weight: string) => string;
      maintain: (weight: string) => string;
      decrease: (weight: string) => string;
      baseline: (weight: string) => string;
      fatigue_maintain: (weight: string) => string;
    };
    setLogged: (current: number, total: number) => string;
    nextSet: string;
    status: string;
    statusCooked: string;
    emptyValue: string;
    backHome: string;
    snarky: {
      pathetic: string;
      mid: string;
      tryHard: string;
      tooEasy: string;
    };
    quotes: MotivationQuote[];
  };
  auth: {
    loading: string;
  };
  coins: {
    title: string;
  };
  moves: MovesTranslations;
  errors: {
    loadWorkoutStats: string;
    saveWorkoutStats: string;
    loadSetProgress: string;
    saveSetProgress: string;
    cameraDenied: string;
    poseTrackingStart: string;
    cameraStart: string;
  };
  tutorial: {
    skip: string;
    back: string;
    next: string;
    finish: string;
    stepLabel: (current: number, total: number) => string;
    steps: Array<{ title: string; body: string }>;
  };
}
