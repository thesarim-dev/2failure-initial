import type { AppTranslations } from './types';

type TutorialContent = AppTranslations['tutorial'];

const en: TutorialContent = {
  skip: 'Skip tour',
  back: 'Back',
  next: 'Next',
  begin: 'Show me',
  finish: "Let's go",
  stepLabel: (current, total) => `${current} of ${total}`,
  startCta: (name) => `Start ${name}`,
  steps: {
    welcome: {
      title: 'Welcome to 2failure',
      body: "Here's a quick look at your home screen. It ends with your first set, so get ready to move."
    },
    lineup: {
      title: "Today's workout",
      body: "Each card below is one of today's exercises. This counter shows the sets you've done out of today's goal."
    },
    streak: {
      title: 'Your streak',
      body: 'Do at least 2 sets a day to keep the flame going. Miss a day and it resets, unless you restore it with coins.'
    },
    coins: {
      title: 'Coins',
      body: 'Every finished set earns about 25–30 coins. Spend them on new exercises and base upgrades.'
    },
    store: {
      title: 'Training',
      body: 'Plan your week here (your own plan or a program), and unlock harder exercises with coins.'
    },
    settings: {
      title: 'Settings',
      body: 'Language, units, sounds and night mode live here.'
    },
    base: {
      title: 'Your base',
      body: 'Every set earns materials for your own base. Build it up, and earn trophies you can show off.'
    },
    program: {
      title: 'Your program',
      body: "The rotating program picks today's exercises for you. Need a break? Take a rest day here."
    },
    start: {
      title: 'Your first set',
      body: (name) =>
        `Start with ${name}. Do as many good reps as you can, then tap the button under the timer.`
    }
  },
  firstSet: {
    workout: 'The timer is running. Do your reps at your own pace, then tap the button under the timer.',
    repPrompt: 'Enter how many reps you did, then log it.',
    weightPrompt: 'Enter the weight and reps you did, then log the set.',
    summary: 'First set logged. Do one more set today to start your streak.',
    dismiss: 'Hide tip'
  },
  replay: {
    title: 'App tour',
    description: 'See again what each button on the home screen does.',
    button: 'Replay tour'
  }
};

const he: TutorialContent = {
  skip: 'דלגו על הסיור',
  back: 'חזרה',
  next: 'הבא',
  begin: 'הראו לי',
  finish: 'בואו נתחיל',
  stepLabel: (current, total) => `${current} מתוך ${total}`,
  startCta: (name) => `התחילו ${name}`,
  steps: {
    welcome: {
      title: 'ברוכים הבאים ל-2failure',
      body: 'סיור קצר במסך הבית. בסופו תתחילו את הסט הראשון, אז תתכוננו לזוז.'
    },
    lineup: {
      title: 'האימון של היום',
      body: 'כל כרטיס למטה הוא תרגיל של היום. המונה הזה מראה כמה סטים עשיתם מתוך היעד היומי.'
    },
    streak: {
      title: 'הרצף שלכם',
      body: 'עשו לפחות 2 סטים ביום כדי לשמור על הלהבה. פספסתם יום? הרצף מתאפס, אלא אם תשחזרו אותו במטבעות.'
    },
    coins: {
      title: 'מטבעות',
      body: 'כל סט שמסתיים מזכה בכ־25–30 מטבעות. השתמשו בהם לתרגילים חדשים ולשדרוגי הבסיס.'
    },
    store: {
      title: 'אימון',
      body: 'כאן מתכננים את השבוע (תוכנית משלכם או תוכנית מוכנה) ופותחים תרגילים קשים יותר עם מטבעות.'
    },
    settings: {
      title: 'הגדרות',
      body: 'כאן נמצאים שפה, יחידות, צלילים ומצב לילה.'
    },
    base: {
      title: 'הבסיס שלכם',
      body: 'כל סט מזכה בחומרים לבסיס משלכם. בנו אותו, והשיגו גביעים שאפשר להשוויץ בהם.'
    },
    program: {
      title: 'התוכנית שלכם',
      body: 'התוכנית המתחלפת בוחרת בשבילכם את התרגילים של היום. צריכים הפסקה? קחו כאן יום מנוחה.'
    },
    start: {
      title: 'הסט הראשון שלכם',
      body: (name) =>
        `התחילו עם ${name}. עשו כמה שיותר חזרות טובות, ואז הקישו על הכפתור שמתחת לטיימר.`
    }
  },
  firstSet: {
    workout: 'הטיימר רץ. עשו את החזרות בקצב שלכם, ואז הקישו על הכפתור שמתחת לטיימר.',
    repPrompt: 'הזינו כמה חזרות עשיתם, ואז רשמו את הסט.',
    weightPrompt: 'הזינו את המשקל ומספר החזרות, ואז רשמו את הסט.',
    summary: 'הסט הראשון נרשם. עשו עוד סט היום כדי להתחיל רצף.',
    dismiss: 'הסתרת הטיפ'
  },
  replay: {
    title: 'סיור באפליקציה',
    description: 'ראו שוב מה עושה כל כפתור במסך הבית.',
    button: 'הפעילו את הסיור שוב'
  }
};

const ar: TutorialContent = {
  skip: 'تخطّي الجولة',
  back: 'رجوع',
  next: 'التالي',
  begin: 'أرني',
  finish: 'لنبدأ',
  stepLabel: (current, total) => `${current} من ${total}`,
  startCta: (name) => `ابدأ ${name}`,
  steps: {
    welcome: {
      title: 'مرحباً بك في 2failure',
      body: 'جولة سريعة على الشاشة الرئيسية تنتهي بأول مجموعة لك، فاستعد للحركة.'
    },
    lineup: {
      title: 'تمرين اليوم',
      body: 'كل بطاقة أدناه هي أحد تمارين اليوم. يُظهر هذا العدّاد المجموعات التي أنجزتها من هدف اليوم.'
    },
    streak: {
      title: 'سلسلتك',
      body: 'أنجز مجموعتين على الأقل يومياً لتبقى الشعلة مشتعلة. إذا فاتك يوم تبدأ السلسلة من الصفر، إلا إذا استعدتها بالعملات.'
    },
    coins: {
      title: 'العملات',
      body: 'كل مجموعة تكملها تمنحك نحو 25–30 عملة. أنفقها على تمارين جديدة وتطوير قاعدتك.'
    },
    store: {
      title: 'التدريب',
      body: 'خطّط لأسبوعك هنا (خطتك الخاصة أو برنامج جاهز)، وافتح تمارين أصعب بالعملات.'
    },
    settings: {
      title: 'الإعدادات',
      body: 'هنا تجد اللغة والوحدات والأصوات والوضع الليلي.'
    },
    base: {
      title: 'قاعدتك',
      body: 'كل مجموعة تمنحك مواد لقاعدتك الخاصة. ابنِها، واحصل على كؤوس تتباهى بها.'
    },
    program: {
      title: 'برنامجك',
      body: 'البرنامج المتناوب يختار لك تمارين اليوم. تحتاج استراحة؟ خذ يوم راحة من هنا.'
    },
    start: {
      title: 'أول مجموعة لك',
      body: (name) =>
        `ابدأ بتمرين ${name}. أدِّ أكبر عدد ممكن من التكرارات الجيدة، ثم اضغط الزر أسفل المؤقت.`
    }
  },
  firstSet: {
    workout: 'المؤقت يعمل. أدِّ تكراراتك بإيقاعك، ثم اضغط الزر أسفل المؤقت.',
    repPrompt: 'أدخل عدد التكرارات التي أنجزتها، ثم سجّل المجموعة.',
    weightPrompt: 'أدخل الوزن وعدد التكرارات، ثم سجّل المجموعة.',
    summary: 'سُجّلت أول مجموعة لك. أنجز مجموعة أخرى اليوم لتبدأ سلسلتك.',
    dismiss: 'إخفاء النصيحة'
  },
  replay: {
    title: 'جولة في التطبيق',
    description: 'شاهد مجدداً ما يفعله كل زر في الشاشة الرئيسية.',
    button: 'أعد تشغيل الجولة'
  }
};

export const tutorialContent: Record<
  import('./types').Language,
  TutorialContent
> = {
  en,
  he,
  ar
};
