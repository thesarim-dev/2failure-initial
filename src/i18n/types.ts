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
    };
    language: {
      title: string;
      description: string;
      options: Record<Language, string>;
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
    activeCount: (active: number, total: number) => string;
    push: string;
    pull: string;
    equipped: string;
    active: string;
    equip: string;
    unequipFirst: string;
    needOppositePattern: string;
    needBalancedUpper: string;
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
    statusError: string;
    statusPaused: string;
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
  };
  summary: {
    title: string;
    receiptTitle: string;
    receiptTagline: string;
    item: string;
    duration: string;
    repsThisSet: string;
    personalBest: string;
    newPersonalBest: string;
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
}
