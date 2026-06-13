import type { Language } from './types';

interface DashboardUiContent {
  pickYourPoison: string;
  streak: string;
  setsProgress: (completed: number, goal: number) => string;
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
  };
  funFactsLoading: string;
}

type UiContent = {
  meta: import('./types').AppTranslations['meta'];
  dashboard: DashboardUiContent;
  store: import('./types').AppTranslations['store'];
  login: import('./types').AppTranslations['login'];
  workout: import('./types').AppTranslations['workout'];
  summary: import('./types').AppTranslations['summary'];
  auth: import('./types').AppTranslations['auth'];
  coins: import('./types').AppTranslations['coins'];
  errors: import('./types').AppTranslations['errors'];
};

const en: UiContent = {
  meta: {
    title: '2failure Workout Tracker',
    description: 'Track your workouts. Get stronger every day.'
  },
  dashboard: {
    pickYourPoison: 'PICK YOUR WORKOUT',
    streak: 'streak',
    setsProgress: (completed, goal) => `${completed} / ${goal} sets`,
    loading: '…',
    errors: {
      sets: (msg) => `Could not load set progress: ${msg}`,
      stats: (msg) => `Could not load workout stats: ${msg}`,
      profile: (msg) => `Could not refresh profile: ${msg}`
    },
    aria: {
      openStore: 'Open store',
      openSettings: 'Open settings',
      loadingCoins: 'Loading coins',
      funFactAndStreak: 'Fun fact and streak',
      streakDays: (days) => `Current streak: ${days} days`
    },
    funFactsLoading: 'Fun facts are loading…'
  },
  store: {
    title: 'THE STORE',
    back: 'Back',
    activeCount: (active, total) => `(${active}/${total} active)`,
    equipped: 'Equipped',
    active: 'Active',
    equip: 'Equip',
    unequipFirst: 'Unequip one first',
    needOppositePattern: 'Need opposite movement pattern',
    needBalancedUpper: 'Need 1 Push + 1 Pull in your upper lineup.'
  },
  login: {
    switchToDay: 'switch to day mode',
    switchToNight: 'switch to night mode',
    title: 'LOG IN',
    subtitle: 'Sign in with your email to track your progress.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signingIn: 'Signing in…',
    signInGmail: 'Sign in through Gmail',
    redirectingGmail: 'Redirecting to Gmail…',
    signUp: 'Sign Up',
    signingUp: 'Signing up…',
    errors: {
      signIn: 'Could not sign in.',
      signInGmail: 'Could not sign in with Gmail.',
      signUp: 'Could not sign up.',
      googleOAuth:
        'Google sign-in is misconfigured. In Supabase → Authentication → Providers → Google, re-enter the Client ID and Client Secret from Google Cloud Console (Web application OAuth client). Google redirect URI must be: https://jfceueuzwzznbyjazhuu.supabase.co/auth/v1/callback',
      restoreSession: 'Failed to restore session.'
    },
    aria: {
      switchToDay: 'Switch to day mode',
      switchToNight: 'Switch to night mode'
    }
  },
  workout: {
    cancel: 'Cancel workout',
    failingInProgress: 'workout in progress',
    useAiTracking: 'Use AI tracking',
    useTimerOnly: 'Use timer only',
    statusLoading: 'loading AI...',
    statusTracking: 'tracking reps',
    statusReady: 'get in frame',
    statusError: 'camera off',
    statusPaused: 'camera paused',
    loadingPoseModel: 'Loading pose model...',
    cameraUnavailable: 'Camera unavailable',
    cameraPaused: 'Camera paused',
    reps: 'reps',
    pauseCam: 'pause cam',
    resumeCam: 'resume cam',
    frontCam: 'front cam',
    backCam: 'back cam',
    loggingReps: (count) =>
      `Logging ${count} tracked rep${count === 1 ? '' : 's'}`,
    repPromptQuestion: 'How many reps did you hit this set?',
    repPromptPlaceholder: '0',
    repPromptError: 'Enter at least 1 rep.',
    repPromptSubmit: 'log it',
    repPromptAria: 'Reps completed'
  },
  summary: {
    title: 'WORKOUT DONE!',
    receiptTitle: 'Official Receipt',
    receiptTagline: '2failure — practice makes progress',
    item: 'item',
    duration: 'duration',
    repsThisSet: 'reps (this set)',
    personalBest: 'personal best',
    newPersonalBest: 'new personal best!',
    status: 'status',
    statusCooked: 'done',
    emptyValue: '—',
    backHome: 'back home',
    snarky: {
      pathetic: 'Nice start! Every rep counts.',
      mid: 'Good effort! Keep it up.',
      tryHard: 'Awesome work! Take a quick rest.',
      tooEasy: 'You crushed it! Try a harder move next time.'
    },
    quotes: [
      {
        text: "I have not failed. I've just found 10,000 ways that won't work.",
        author: 'Thomas Edison'
      },
      {
        text: 'Genius is one percent inspiration and ninety-nine percent perspiration.',
        author: 'Thomas Edison'
      },
      {
        text: "Whether you think you can, or you think you can't — you're right.",
        author: 'Henry Ford'
      },
      {
        text: 'Nothing in life is to be feared, it is only to be understood.',
        author: 'Marie Curie'
      },
      {
        text: 'Strive not to be a success, but rather to be of value.',
        author: 'Albert Einstein'
      },
      {
        text: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney'
      },
      {
        text: "It always seems impossible until it's done.",
        author: 'Nelson Mandela'
      },
      {
        text: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt'
      }
    ]
  },
  auth: { loading: 'Loading…' },
  coins: { title: 'Coins' },
  errors: {
    loadWorkoutStats: 'Could not load workout stats.',
    saveWorkoutStats: 'Could not save workout stats.',
    loadSetProgress: 'Could not load set progress.',
    saveSetProgress: 'Could not save set progress.',
    cameraDenied: 'Camera access was denied.',
    poseTrackingStart: 'Could not start pose tracking.',
    cameraStart: 'Could not start camera.'
  }
};

const he: UiContent = {
  meta: {
    title: '2failure — מעקב אימונים',
    description: 'עקוב אחר האימונים שלך. להתחזק כל יום.'
  },
  dashboard: {
    pickYourPoison: 'בחר את האימון שלך',
    streak: 'רצף',
    setsProgress: (completed, goal) => `${completed} / ${goal} סטים`,
    loading: '…',
    errors: {
      sets: (msg) => `לא ניתן לטעון התקדמות סטים: ${msg}`,
      stats: (msg) => `לא ניתן לטעון סטטיסטיקות אימון: ${msg}`,
      profile: (msg) => `לא ניתן לרענן פרופיל: ${msg}`
    },
    aria: {
      openStore: 'פתח חנות',
      openSettings: 'פתח הגדרות',
      loadingCoins: 'טוען מטבעות',
      funFactAndStreak: 'עובדה מעניינת ורצף',
      streakDays: (days) => `רצף נוכחי: ${days} ימים`
    },
    funFactsLoading: 'עובדות מעניינות בטעינה…'
  },
  store: {
    title: 'החנות',
    back: 'חזרה',
    activeCount: (active, total) => `(${active}/${total} פעילים)`,
    equipped: 'מצויד',
    active: 'פעיל',
    equip: 'צייד',
    unequipFirst: 'הסר ציוד קודם',
    needOppositePattern: 'נדרש דפוס תנועה הפוך',
    needBalancedUpper: 'נדרש תרגיל דחיפה אחד + משיכה אחת בפלג הגוף העליון.'
  },
  login: {
    switchToDay: 'עבור למצב יום',
    switchToNight: 'עבור למצב לילה',
    title: 'התחברות',
    subtitle: 'התחבר עם האימייל שלך כדי לעקוב אחר ההתקדמות שלך.',
    email: 'אימייל',
    password: 'סיסמה',
    signIn: 'התחבר',
    signingIn: 'מתחבר…',
    signInGmail: 'התחבר דרך Gmail',
    redirectingGmail: 'מפנה ל-Gmail…',
    signUp: 'הירשם',
    signingUp: 'נרשם…',
    errors: {
      signIn: 'לא ניתן להתחבר.',
      signInGmail: 'לא ניתן להתחבר דרך Gmail.',
      signUp: 'לא ניתן להירשם.',
      googleOAuth:
        'התחברות Google לא מוגדרת כראוי. ב-Supabase → Authentication → Providers → Google, הזן מחדש את Client ID ו-Client Secret מ-Google Cloud Console. כתובת ההפניה של Google חייבת להיות: https://jfceueuzwzznbyjazhuu.supabase.co/auth/v1/callback',
      restoreSession: 'שחזור ההפעלה נכשל.'
    },
    aria: {
      switchToDay: 'עבור למצב יום',
      switchToNight: 'עבור למצב לילה'
    }
  },
  workout: {
    cancel: 'בטל אימון',
    failingInProgress: 'אימון בתהליך',
    useAiTracking: 'השתמש במעקב AI',
    useTimerOnly: 'השתמש בטיימר בלבד',
    statusLoading: 'טוען AI...',
    statusTracking: 'סופר חזרות',
    statusReady: 'היכנס לפריים',
    statusError: 'מצלמה כבויה',
    statusPaused: 'מצלמה מושהית',
    loadingPoseModel: 'טוען מודל תנוחה...',
    cameraUnavailable: 'מצלמה לא זמינה',
    cameraPaused: 'מצלמה מושהית',
    reps: 'חזרות',
    pauseCam: 'השהה מצלמה',
    resumeCam: 'המשך מצלמה',
    frontCam: 'מצלמה קדמית',
    backCam: 'מצלמה אחורית',
    loggingReps: (count) =>
      `רושם ${count} חזרות${count === 1 ? '' : ''} שנספרו`,
    repPromptQuestion: 'כמה חזרות עשית בסט הזה?',
    repPromptPlaceholder: '0',
    repPromptError: 'הזן לפחות חזרה אחת.',
    repPromptSubmit: 'רשום',
    repPromptAria: 'חזרות שהושלמו'
  },
  summary: {
    title: 'האימון הושלם!',
    receiptTitle: 'קבלה רשמית',
    receiptTagline: '2failure — תרגול מביא להתקדמות',
    item: 'פריט',
    duration: 'משך',
    repsThisSet: 'חזרות (סט זה)',
    personalBest: 'שיא אישי',
    newPersonalBest: 'שיא אישי חדש!',
    status: 'סטטוס',
    statusCooked: 'סיימת',
    emptyValue: '—',
    backHome: 'חזרה הביתה',
    snarky: {
      pathetic: 'התחלה יפה! כל חזרה נחשבת.',
      mid: 'מאמץ טוב! המשך כך.',
      tryHard: 'עבודה מעולה! קח הפסקה קצרה.',
      tooEasy: 'הרסת את זה! נסה תרגיל קשה יותר בפעם הבאה.'
    },
    quotes: [
      {
        text: 'לא נכשלתי. רק מצאתי 10,000 דרכים שלא יעבדו.',
        author: 'תומאס אדיסון'
      },
      {
        text: 'גאונות היא אחוז השראה ותשעים ותשעה אחוז הזעה.',
        author: 'תומאס אדיסון'
      },
      {
        text: 'בין אם אתה חושב שאתה יכול או שאתה חושב שאתה לא יכול — אתה צודק.',
        author: 'הנרי פורד'
      },
      {
        text: 'אין בחיים דבר שיש לפחד ממנו, רק להבין אותו.',
        author: 'מארי קירי'
      },
      {
        text: 'שאף לא להצליח, אלא להיות בעל ערך.',
        author: 'אלברט איינשטיין'
      },
      {
        text: 'הדרך להתחיל היא להפסיק לדבר ולהתחיל לעשות.',
        author: 'וולט דיסני'
      },
      {
        text: 'זה תמיד נראה בלתי אפשרי עד שזה נעשה.',
        author: 'נלסון מנדלה'
      },
      {
        text: 'העתיד שייך למי שמאמין ביופי של החלומות שלו.',
        author: 'אלינור רוזוולט'
      }
    ]
  },
  auth: { loading: 'טוען…' },
  coins: { title: 'מטבעות' },
  errors: {
    loadWorkoutStats: 'לא ניתן לטעון סטטיסטיקות אימון.',
    saveWorkoutStats: 'לא ניתן לשמור סטטיסטיקות אימון.',
    loadSetProgress: 'לא ניתן לטעון התקדמות סטים.',
    saveSetProgress: 'לא ניתן לשמור התקדמות סטים.',
    cameraDenied: 'הגישה למצלמה נדחתה.',
    poseTrackingStart: 'לא ניתן להפעיל מעקב תנוחה.',
    cameraStart: 'לא ניתן להפעיל מצלמה.'
  }
};

const ar: UiContent = {
  meta: {
    title: '2failure — متتبع التمارين',
    description: 'تتبع تمارينك. تقوَّ كل يوم.'
  },
  dashboard: {
    pickYourPoison: 'اختر تمرينك',
    streak: 'سلسلة',
    setsProgress: (completed, goal) => `${completed} / ${goal} مجموعات`,
    loading: '…',
    errors: {
      sets: (msg) => `تعذّر تحميل تقدم المجموعات: ${msg}`,
      stats: (msg) => `تعذّر تحميل إحصائيات التمرين: ${msg}`,
      profile: (msg) => `تعذّر تحديث الملف الشخصي: ${msg}`
    },
    aria: {
      openStore: 'فتح المتجر',
      openSettings: 'فتح الإعدادات',
      loadingCoins: 'جارٍ تحميل العملات',
      funFactAndStreak: 'حقيقة ممتعة وسلسلة',
      streakDays: (days) => `السلسلة الحالية: ${days} أيام`
    },
    funFactsLoading: 'جارٍ تحميل الحقائق الممتعة…'
  },
  store: {
    title: 'المتجر',
    back: 'رجوع',
    activeCount: (active, total) => `(${active}/${total} نشط)`,
    equipped: 'مُجهَّز',
    active: 'نشط',
    equip: 'تجهيز',
    unequipFirst: 'أزل التجهيز أولاً',
    needOppositePattern: 'يلزم نمط حركة معاكس',
    needBalancedUpper: 'يلزم تمرين دفع واحد + سحب واحد في الجزء العلوي.'
  },
  login: {
    switchToDay: 'التبديل إلى الوضع النهاري',
    switchToNight: 'التبديل إلى الوضع الليلي',
    title: 'تسجيل الدخول',
    subtitle: 'سجّل دخولك ببريدك الإلكتروني لتتبع تقدّمك.',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signingIn: 'جارٍ تسجيل الدخول…',
    signInGmail: 'تسجيل الدخول عبر Gmail',
    redirectingGmail: 'جارٍ التوجيه إلى Gmail…',
    signUp: 'إنشاء حساب',
    signingUp: 'جارٍ إنشاء الحساب…',
    errors: {
      signIn: 'تعذّر تسجيل الدخول.',
      signInGmail: 'تعذّر تسجيل الدخول عبر Gmail.',
      signUp: 'تعذّر إنشاء الحساب.',
      googleOAuth:
        'تسجيل دخول Google غير مُعدّ بشكل صحيح. في Supabase → Authentication → Providers → Google، أعد إدخال Client ID وClient Secret من Google Cloud Console. يجب أن يكون رابط إعادة التوجيه: https://jfceueuzwzznbyjazhuu.supabase.co/auth/v1/callback',
      restoreSession: 'فشل استعادة الجلسة.'
    },
    aria: {
      switchToDay: 'التبديل إلى الوضع النهاري',
      switchToNight: 'التبديل إلى الوضع الليلي'
    }
  },
  workout: {
    cancel: 'إلغاء التمرين',
    failingInProgress: 'التمرين جارٍ',
    useAiTracking: 'استخدم تتبع الذكاء الاصطناعي',
    useTimerOnly: 'استخدم المؤقت فقط',
    statusLoading: 'جارٍ تحميل الذكاء الاصطناعي...',
    statusTracking: 'عدّ التكرارات',
    statusReady: 'ادخل الإطار',
    statusError: 'الكاميرا مغلقة',
    statusPaused: 'الكاميرا متوقفة',
    loadingPoseModel: 'جارٍ تحميل نموذج الوضعية...',
    cameraUnavailable: 'الكاميرا غير متاحة',
    cameraPaused: 'الكاميرا متوقفة',
    reps: 'تكرارات',
    pauseCam: 'إيقاف الكاميرا',
    resumeCam: 'استئناف الكاميرا',
    frontCam: 'كاميرا أمامية',
    backCam: 'كاميرا خلفية',
    loggingReps: (count) =>
      `تسجيل ${count} تكرار${count === 1 ? '' : 'اً'} مُتتبَّع`,
    repPromptQuestion: 'كم تكراراً أنجزت في هذه المجموعة؟',
    repPromptPlaceholder: '0',
    repPromptError: 'أدخل تكراراً واحداً على الأقل.',
    repPromptSubmit: 'سجّل',
    repPromptAria: 'التكرارات المكتملة'
  },
  summary: {
    title: 'اكتمل التمرين!',
    receiptTitle: 'إيصال رسمي',
    receiptTagline: '2failure — الممارسة تُحسّن',
    item: 'البند',
    duration: 'المدة',
    repsThisSet: 'التكرارات (هذه المجموعة)',
    personalBest: 'الرقم القياسي',
    newPersonalBest: 'رقم قياسي جديد!',
    status: 'الحالة',
    statusCooked: 'انتهيت',
    emptyValue: '—',
    backHome: 'العودة للرئيسية',
    snarky: {
      pathetic: 'بداية رائعة! كل تكرار يُحسب.',
      mid: 'جهد جيد! واصل هكذا.',
      tryHard: 'عمل رائع! خذ استراحة قصيرة.',
      tooEasy: 'أبدعت! جرّب تمريناً أصعب في المرة القادمة.'
    },
    quotes: [
      {
        text: 'لم أفشل. لقد وجدت فقط 10,000 طريقة لا تعمل.',
        author: 'توماس إديسون'
      },
      {
        text: 'العبقرية واحد بالمئة إلهام وتسعة وتسعون بالمئة عرق.',
        author: 'توماس إديسون'
      },
      {
        text: 'سواء ظننت أنك تستطيع أو لا تستطيع — أنت على حق.',
        author: 'هنري فورد'
      },
      {
        text: 'لا شيء في الحياة يُخاف منه، بل يُفهم فقط.',
        author: 'ماري كوري'
      },
      {
        text: 'اسعَ لأن تكون ذا قيمة لا لأن تكون ناجحاً.',
        author: 'ألبرت أينشتاين'
      },
      {
        text: 'طريقة البدء هي التوقف عن الكلام والبدء بالفعل.',
        author: 'والت ديزني'
      },
      {
        text: 'يبدو الأمر مستحيلاً دائماً حتى يُنجَز.',
        author: 'نيلسون مانديلا'
      },
      {
        text: 'المستقبل لمن يؤمن بجمال أحلامه.',
        author: 'إليانور روزفلت'
      }
    ]
  },
  auth: { loading: 'جارٍ التحميل…' },
  coins: { title: 'عملات' },
  errors: {
    loadWorkoutStats: 'تعذّر تحميل إحصائيات التمرين.',
    saveWorkoutStats: 'تعذّر حفظ إحصائيات التمرين.',
    loadSetProgress: 'تعذّر تحميل تقدم المجموعات.',
    saveSetProgress: 'تعذّر حفظ تقدم المجموعات.',
    cameraDenied: 'تم رفض الوصول إلى الكاميرا.',
    poseTrackingStart: 'تعذّر بدء تتبع الوضعية.',
    cameraStart: 'تعذّر تشغيل الكاميرا.'
  }
};

export const uiContent: Record<Language, UiContent> = { en, he, ar };
