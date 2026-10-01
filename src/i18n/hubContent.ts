import type { Language } from './types';

type Slot = 'push' | 'pull' | 'legs' | 'core';

export type HubCopy = {
  title: string;
  tabs: { plan: string; shop: string };
  mode: { title: string; own: string; ownDesc: string; program: string; programDesc: string };
  days: { title: string; hint: (rest: number) => string };
  sets: { title: string; hint: string };
  lineup: { title: string; hint: string; slots: Record<Slot, string>; programNote: string; empty: string };
  summary: {
    own: (days: number, exercises: number, sets: number, minutes: number) => string;
    program: (days: number) => string;
  };
  program: { split: string; howItWorks: string; hide: string };
  picker: { title: (slot: string) => string; inLineup: string; use: string; buy: (price: number) => string; needCoins: string; replace: string };
  shop: {
    nextStep: string;
    nextLine: (from: string, to: string) => string;
    filters: Record<'all' | Slot, string>;
    noGear: string;
    step: (n: number, total: number) => string;
    levelUpAfter: (reps: number) => string;
    holdLevelUp: (seconds: number) => string;
    inLineup: string;
    owned: string;
    use: string;
    free: string;
    programLocked: string;
    empty: string;
    ladder: string;
  };
  settingsLink: { title: string; description: string; open: string };
  dashCard: {
    title: string;
    own: (days: number, sets: number, exercises: number) => string;
    program: (days: number, phase: string) => string;
    programRest: (days: number) => string;
    shop: string;
  };
  settingsTab: string;
};

const en: HubCopy = {
  title: 'Training',
  tabs: { plan: 'Plan', shop: 'Shop' },
  mode: {
    title: 'How do you want to train?',
    own: 'Build my own',
    ownDesc: 'Choose your exercises, training days and sets.',
    program: 'Follow a program',
    programDesc: 'A ready-made split that rotates your workouts and builds in rest.'
  },
  days: { title: 'Training days per week', hint: (rest) => `${rest} rest days a week. Rest keeps your streak alive.` },
  sets: { title: 'Sets per exercise', hint: 'How many sets you aim for on each exercise, every training day.' },
  lineup: {
    title: 'Your lineup',
    hint: 'Tap an exercise to swap it.',
    slots: { push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core' },
    programNote: "The program picks today's exercises. Switch to Build my own to choose them yourself.",
    empty: 'Rest day today'
  },
  summary: {
    own: (days, exercises, sets, minutes) => `${days} days a week · ${exercises} exercises × ${sets} sets · about ${minutes} min`,
    program: (days) => `${days} training days a week · rest days built in · main lift 3 sets, the rest 2`
  },
  program: { split: 'Split', howItWorks: 'How the program works', hide: 'Hide' },
  picker: {
    title: (slot) => `${slot} exercise`,
    inLineup: 'In your lineup',
    use: 'Use',
    buy: (price) => `Buy · ${price}`,
    needCoins: 'Not enough coins yet',
    replace: 'Replace which one?'
  },
  shop: {
    nextStep: 'Ready for the next step',
    nextLine: (from, to) => `${from} → ${to}`,
    filters: { all: 'All', push: 'Push', pull: 'Pull', legs: 'Legs', core: 'Core' },
    noGear: 'No gear only',
    step: (n, total) => `Step ${n} of ${total}`,
    levelUpAfter: (reps) => `Level up after ${reps} reps`,
    holdLevelUp: (seconds) => `Level up after ${seconds}s`,
    inLineup: 'In lineup',
    owned: 'Owned',
    use: 'Use',
    free: 'Free',
    programLocked: 'The program chooses your exercises',
    empty: 'Nothing matches these filters.',
    ladder: 'Progression'
  },
  settingsLink: { title: 'Training plan', description: 'Program, training days, sets and your lineup.', open: 'Open' },
  dashCard: {
    title: 'Edit your workout',
    own: (days, sets, exercises) => `${days} days a week · ${sets} sets · ${exercises} exercises`,
    program: (days, phase) => `${days}-day program · today: ${phase}`,
    programRest: (days) => `${days}-day program · rest day`,
    shop: 'Shop'
  },
  settingsTab: 'Settings'
};

const he: HubCopy = {
  title: 'אימון',
  tabs: { plan: 'תוכנית', shop: 'חנות' },
  mode: {
    title: 'איך תרצה להתאמן?',
    own: 'אבנה בעצמי',
    ownDesc: 'בחר תרגילים, ימי אימון וסטים.',
    program: 'אעקוב אחרי תוכנית',
    programDesc: 'חלוקה מוכנה שמחליפה את האימונים ומשלבת מנוחה.'
  },
  days: { title: 'ימי אימון בשבוע', hint: (rest) => `${rest} ימי מנוחה בשבוע. מנוחה שומרת על הרצף שלך.` },
  sets: { title: 'סטים לכל תרגיל', hint: 'כמה סטים אתה שואף לעשות בכל תרגיל, בכל יום אימון.' },
  lineup: {
    title: 'ההרכב שלך',
    hint: 'הקש על תרגיל כדי להחליף אותו.',
    slots: { push: 'דחיפה', pull: 'משיכה', legs: 'רגליים', core: 'ליבה' },
    programNote: 'התוכנית בוחרת את התרגילים של היום. עבור ל"אבנה בעצמי" כדי לבחור בעצמך.',
    empty: 'היום יום מנוחה'
  },
  summary: {
    own: (days, exercises, sets, minutes) => `${days} ימים בשבוע · ${exercises} תרגילים × ${sets} סטים · כ־${minutes} דק׳`,
    program: (days) => `${days} ימי אימון בשבוע · ימי מנוחה כלולים · תרגיל מרכזי 3 סטים, השאר 2`
  },
  program: { split: 'חלוקה', howItWorks: 'איך התוכנית עובדת', hide: 'הסתר' },
  picker: {
    title: (slot) => `תרגיל ${slot}`,
    inLineup: 'בהרכב שלך',
    use: 'בחר',
    buy: (price) => `קנה · ${price}`,
    needCoins: 'עדיין אין מספיק מטבעות',
    replace: 'במה להחליף?'
  },
  shop: {
    nextStep: 'מוכן לשלב הבא',
    nextLine: (from, to) => `${from} ← ${to}`,
    filters: { all: 'הכל', push: 'דחיפה', pull: 'משיכה', legs: 'רגליים', core: 'ליבה' },
    noGear: 'בלי ציוד בלבד',
    step: (n, total) => `שלב ${n} מתוך ${total}`,
    levelUpAfter: (reps) => `עולים רמה אחרי ${reps} חזרות`,
    holdLevelUp: (seconds) => `עולים רמה אחרי ${seconds} שנ׳`,
    inLineup: 'בהרכב',
    owned: 'בבעלותך',
    use: 'בחר',
    free: 'חינם',
    programLocked: 'התוכנית בוחרת את התרגילים שלך',
    empty: 'אין תוצאות למסננים האלה.',
    ladder: 'התקדמות'
  },
  settingsLink: { title: 'תוכנית אימון', description: 'תוכנית, ימי אימון, סטים וההרכב שלך.', open: 'פתח' },
  dashCard: {
    title: 'ערוך את האימון',
    own: (days, sets, exercises) => `${days} ימים בשבוע · ${sets} סטים · ${exercises} תרגילים`,
    program: (days, phase) => `תוכנית ${days} ימים · היום: ${phase}`,
    programRest: (days) => `תוכנית ${days} ימים · יום מנוחה`,
    shop: 'חנות'
  },
  settingsTab: 'הגדרות'
};

const ar: HubCopy = {
  title: 'التدريب',
  tabs: { plan: 'الخطة', shop: 'المتجر' },
  mode: {
    title: 'كيف تريد أن تتدرب؟',
    own: 'سأبني خطتي',
    ownDesc: 'اختر تمارينك وأيام التدريب والمجموعات.',
    program: 'سأتبع برنامجاً',
    programDesc: 'تقسيم جاهز يبدّل تمارينك ويتضمن الراحة.'
  },
  days: { title: 'أيام التدريب في الأسبوع', hint: (rest) => `${rest} أيام راحة في الأسبوع. الراحة تحافظ على سلسلتك.` },
  sets: { title: 'المجموعات لكل تمرين', hint: 'عدد المجموعات التي تستهدفها لكل تمرين في كل يوم تدريب.' },
  lineup: {
    title: 'تشكيلتك',
    hint: 'اضغط على تمرين لتبديله.',
    slots: { push: 'دفع', pull: 'سحب', legs: 'ساقان', core: 'جذع' },
    programNote: 'البرنامج يختار تمارين اليوم. انتقل إلى "سأبني خطتي" لتختارها بنفسك.',
    empty: 'اليوم يوم راحة'
  },
  summary: {
    own: (days, exercises, sets, minutes) => `${days} أيام في الأسبوع · ${exercises} تمارين × ${sets} مجموعات · نحو ${minutes} دقيقة`,
    program: (days) => `${days} أيام تدريب في الأسبوع · أيام الراحة مضمّنة · التمرين الرئيسي 3 مجموعات، والبقية 2`
  },
  program: { split: 'التقسيم', howItWorks: 'كيف يعمل البرنامج', hide: 'إخفاء' },
  picker: {
    title: (slot) => `تمرين ${slot}`,
    inLineup: 'في تشكيلتك',
    use: 'اختر',
    buy: (price) => `اشترِ · ${price}`,
    needCoins: 'لا توجد عملات كافية بعد',
    replace: 'أيّهما تستبدل؟'
  },
  shop: {
    nextStep: 'جاهز للخطوة التالية',
    nextLine: (from, to) => `${from} ← ${to}`,
    filters: { all: 'الكل', push: 'دفع', pull: 'سحب', legs: 'ساقان', core: 'جذع' },
    noGear: 'بدون معدات فقط',
    step: (n, total) => `الخطوة ${n} من ${total}`,
    levelUpAfter: (reps) => `ارفع المستوى بعد ${reps} تكراراً`,
    holdLevelUp: (seconds) => `ارفع المستوى بعد ${seconds} ث`,
    inLineup: 'في التشكيلة',
    owned: 'مملوك',
    use: 'اختر',
    free: 'مجاني',
    programLocked: 'البرنامج يختار تمارينك',
    empty: 'لا شيء يطابق هذه المرشحات.',
    ladder: 'التقدّم'
  },
  settingsLink: { title: 'خطة التدريب', description: 'البرنامج وأيام التدريب والمجموعات وتشكيلتك.', open: 'فتح' },
  dashCard: {
    title: 'عدّل تمرينك',
    own: (days, sets, exercises) => `${days} أيام في الأسبوع · ${sets} مجموعات · ${exercises} تمارين`,
    program: (days, phase) => `برنامج ${days} أيام · اليوم: ${phase}`,
    programRest: (days) => `برنامج ${days} أيام · يوم راحة`,
    shop: 'المتجر'
  },
  settingsTab: 'الإعدادات'
};

export const hubContent: Record<Language, HubCopy> = { en, he, ar };
