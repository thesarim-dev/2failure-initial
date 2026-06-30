import type { AppTranslations } from './types';

type TutorialContent = AppTranslations['tutorial'];

const en: TutorialContent = {
  skip: 'Skip tour',
  back: 'Back',
  next: 'Next',
  finish: "Let's go",
  stepLabel: (current, total) => `Step ${current} of ${total}`,
  steps: [
    {
      title: 'Welcome to 2failure',
      body: 'Train hard, log your sets, and build streaks. This quick tour covers the basics so you can start your first workout.'
    },
    {
      title: 'Pick a workout',
      body: 'Your home screen lists today\'s exercises. Tap one to start a timed set (or AI rep tracking for moves like pushups). Hit the finish button when you\'re done.'
    },
    {
      title: 'Store & lineup',
      body: 'Use the bag icon to open the store. Spend coins to unlock exercises, then equip upper, lower, and core moves for your daily lineup.'
    },
    {
      title: 'Settings',
      body: 'The gear icon opens settings. Try the rotating 7-day program or set your own daily set target. Switch day/night mode and language there too.'
    },
    {
      title: 'Coins & streak',
      body: 'You earn coins after each completed set. The flame badge tracks your daily streak — keep showing up to make it grow.'
    }
  ]
};

const he: TutorialContent = {
  skip: 'דלג על הסיור',
  back: 'חזרה',
  next: 'הבא',
  finish: 'בואו נתחיל',
  stepLabel: (current, total) => `שלב ${current} מתוך ${total}`,
  steps: [
    {
      title: 'ברוכים הבאים ל-2failure',
      body: 'תאמנו קשה, רשמו סטים ובנו רצף. הסיור הקצר הזה מסביר את היסודות כדי שתוכלו להתחיל את האימון הראשון.'
    },
    {
      title: 'בחרו אימון',
      body: 'מסך הבית מציג את התרגילים להיום. הקישו על תרגיל כדי להתחיל סט עם טיימר (או מעקב AI לתרגילים כמו שכיבות סמיכה). לחצו על סיום כשסיימתם.'
    },
    {
      title: 'חנות וציוד',
      body: 'פתחו את החנות דרך אייקון התיק. השתמשו במטבעות כדי לפתוח תרגילים, ואז ציידו תרגילי עליון, תחתון וליבה לליינאפ היומי.'
    },
    {
      title: 'הגדרות',
      body: 'אייקון ההגדרות פותח את ההגדרות. הפעילו את תוכנית ה-7 ימים או קבעו יעד סטים יומי. שם גם מחליפים מצב יום/לילה ושפה.'
    },
    {
      title: 'מטבעות ורצף',
      body: 'מרוויחים מטבעות אחרי כל סט שהושלם. תג הרצף עוקב אחרי הימים ברצף — המשיכו להופיע כדי לגדל אותו.'
    }
  ]
};

const ar: TutorialContent = {
  skip: 'تخطّي الجولة',
  back: 'رجوع',
  next: 'التالي',
  finish: 'لنبدأ',
  stepLabel: (current, total) => `الخطوة ${current} من ${total}`,
  steps: [
    {
      title: 'مرحباً بك في 2failure',
      body: 'درّب بقوة، سجّل مجموعاتك، وابنِ سلسلة أيام. هذه الجولة السريعة تشرح الأساسيات لتبدأ أول تمرين.'
    },
    {
      title: 'اختر تمريناً',
      body: 'الشاشة الرئيسية تعرض تمارين اليوم. اضغط على تمرين لبدء مجموعة مؤقتة (أو تتبع AI لتمارين مثل الضغط). اضغط إنهاء عندما تنتهي.'
    },
    {
      title: 'المتجر والتجهيز',
      body: 'افتح المتجر من أيقونة الحقيبة. أنفق العملات لفتح تمارين جديدة، ثم جهّز تمارين الجزء العلوي والسفلي والوسط لخطتك اليومية.'
    },
    {
      title: 'الإعدادات',
      body: 'أيقونة الإعدادات تفتح الإعدادات. جرّب برنامج الـ7 أيام أو حدّد هدف المجموعات اليومي. بدّل وضع النهار/الليل واللغة من هناك أيضاً.'
    },
    {
      title: 'العملات والسلسلة',
      body: 'تربح عملات بعد كل مجموعة مكتملة. شارة اللهب تتابع سلسلة أيامك — واصل التمرين كل يوم لتنمو.'
    }
  ]
};

export const tutorialContent: Record<
  import('./types').Language,
  TutorialContent
> = {
  en,
  he,
  ar
};
