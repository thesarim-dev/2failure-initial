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
  plan: {
    title: string;
    days: string;
    daysSub: string;
    gear: string;
    gearSub: string;
    gearNote: string;
    gearNames: Record<'bar' | 'dipBars' | 'dumbbell' | 'barbell', string>;
    unlocks: (names: string, more: number) => string;
    week: string;
    dayLabel: (n: number) => string;
    today: string;
    rest: string;
    dayNames: Record<'push' | 'pull' | 'legs' | 'mixed', string>;
    focus: Record<'push' | 'pull' | 'legs' | 'mixed', string>;
    muscles: Record<string, string>;
    easier: string;
    harder: string;
    sets: (n: number) => string;
    tileSub: (days: number) => string;
    harderCta: (name: string) => string;
    switched: (name: string) => string;
  };
  dashCard: {
    title: string;
    ownBadge: string;
    programBadge: string;
    own: (sets: number, days: number) => string;
    program: (days: number, day: number, phase: string) => string;
    programRest: (days: number) => string;
  };
  settingsTab: string;
  restoreBanner: { title: (streak: number) => string; sub: string; notEnough: (cost: number) => string };
  trio: {
    edit: string;
    ownShort: (sets: number, days: number) => string;
    programShort: (day: number, days: number, phase: string) => string;
    programRest: string;
    left: (n: number) => string;
    none: string;
    resting: string;
    safe: string;
  };
  week: {
    title: string;
    line: (done: number, target: number) => string;
    days: [string, string, string, string, string, string, string];
  };
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
  settingsLink: { title: 'Your plan', description: 'Days per week, your equipment and exercise levels.', open: 'Open' },
  plan: {
    title: 'Your plan',
    days: 'Days per week',
    daysSub: 'We rotate push, pull, legs and full-body days for you.',
    gear: 'Your equipment',
    gearSub: 'Tap the equipment at your disposal.',
    gearNote: "Chair and backpack exercises are always included. No equipment? That's fine, every day still works.",
    gearNames: { bar: 'Pull-up bar', dipBars: 'Dip bars', dumbbell: 'Dumbbells', barbell: 'Barbell' },
    unlocks: (names, more) => `Unlocks ${names}${more > 0 ? ` +${more}` : ''}`,
    week: 'Your week',
    dayLabel: (n) => `Day ${n}`,
    today: 'Today',
    rest: 'Rest day: stretches today.',
    dayNames: { push: 'Push day', pull: 'Pull day', legs: 'Legs day', mixed: 'Full body' },
    focus: {
      push: 'Chest, shoulders, triceps',
      pull: 'Back, biceps, rear shoulders',
      legs: 'Quads, hamstrings, glutes, calves',
      mixed: 'A bit of everything'
    },
    muscles: {
      chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps', abs: 'Abs', core: 'Core', back: 'Back',
      midBack: 'Mid back', upperBack: 'Upper back', quads: 'Quads', singleLeg: 'Single leg', hamstrings: 'Hamstrings',
      calves: 'Calves', obliques: 'Obliques', push: 'Push', pull: 'Pull', legs: 'Legs', glutes: 'Glutes'
    },
    easier: 'Easier',
    harder: 'Harder',
    sets: (n) => `${n} sets`,
    tileSub: (days) => `${days} days a week`,
    harderCta: (name) => `Switch to ${name}`,
    switched: (name) => `Next time: ${name}`
  },
  dashCard: {
    title: 'Edit your workout',
    ownBadge: 'Own plan',
    programBadge: 'Program',
    own: (sets, days) => `${sets} sets a day · ${days} days a week`,
    program: (days, day, phase) => `Day ${day} of ${days} · ${phase}`,
    programRest: (days) => `Rest day · ${days}-day split`
  },
  settingsTab: 'Settings',
  trio: {
    edit: 'Edit workout',
    ownShort: (sets, days) => `${sets} sets · ${days} days`,
    programShort: (day, days, phase) => `Day ${day}/${days} · ${phase}`,
    programRest: 'Rest day',
    left: (n) => `${n} left this week`,
    none: 'None left this week',
    resting: 'Resting',
    safe: 'Streak safe today'
  },
  restoreBanner: {
    title: (streak) => `Your ${streak}-day streak broke.`,
    sub: 'Bring it back before your 2nd set today, or it starts over.',
    notEnough: (cost) => `Need ${cost} coins to restore`
  },
  week: {
    title: 'This week',
    line: (done, target) => `${done} of ${target} training days`,
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  }
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
  settingsLink: { title: 'התוכנית שלך', description: 'ימים בשבוע, הציוד שלך ורמות התרגילים.', open: 'פתח' },
  plan: {
    title: 'התוכנית שלך',
    days: 'ימים בשבוע',
    daysSub: 'אנחנו מחליפים בשבילכם ימי דחיפה, משיכה, רגליים וגוף מלא.',
    gear: 'הציוד שלך',
    gearSub: 'הקישו על הציוד שעומד לרשותכם.',
    gearNote: 'תרגילים עם כיסא ותיק גב תמיד כלולים. אין ציוד? זה בסדר, כל יום עובד גם ככה.',
    gearNames: { bar: 'מוט מתח', dipBars: 'מקבילים', dumbbell: 'משקולות יד', barbell: 'מוט משקולות' },
    unlocks: (names, more) => `פותח ${names}${more > 0 ? ` +${more}` : ''}`,
    week: 'השבוע שלך',
    dayLabel: (n) => `יום ${n}`,
    today: 'היום',
    rest: 'יום מנוחה: מתיחות היום.',
    dayNames: { push: 'יום דחיפה', pull: 'יום משיכה', legs: 'יום רגליים', mixed: 'גוף מלא' },
    focus: {
      push: 'חזה, כתפיים, יד אחורית',
      pull: 'גב, יד קדמית, כתף אחורית',
      legs: 'ארבע-ראשי, ירך אחורית, ישבן, תאומים',
      mixed: 'קצת מהכל'
    },
    muscles: {
      chest: 'חזה', shoulders: 'כתפיים', triceps: 'יד אחורית', abs: 'בטן', core: 'ליבה', back: 'גב',
      midBack: 'גב אמצעי', upperBack: 'גב עליון', quads: 'ארבע-ראשי', singleLeg: 'רגל אחת', hamstrings: 'ירך אחורית',
      calves: 'תאומים', obliques: 'אלכסונים', push: 'דחיפה', pull: 'משיכה', legs: 'רגליים', glutes: 'ישבן'
    },
    easier: 'קל יותר',
    harder: 'קשה יותר',
    sets: (n) => `${n} סטים`,
    tileSub: (days) => `${days} ימים בשבוע`,
    harderCta: (name) => `עברו ל${name}`,
    switched: (name) => `בפעם הבאה: ${name}`
  },
  dashCard: {
    title: 'ערוך את האימון',
    ownBadge: 'תוכנית אישית',
    programBadge: 'תוכנית מוכנה',
    own: (sets, days) => `${sets} סטים ביום · ${days} ימים בשבוע`,
    program: (days, day, phase) => `יום ${day} מתוך ${days} · ${phase}`,
    programRest: (days) => `יום מנוחה · חלוקת ${days} ימים`
  },
  settingsTab: 'הגדרות',
  trio: {
    edit: 'עריכת אימון',
    ownShort: (sets, days) => `${sets} סטים · ${days} ימים`,
    programShort: (day, days, phase) => `יום ${day}/${days} · ${phase}`,
    programRest: 'יום מנוחה',
    left: (n) => `נשארו ${n} השבוע`,
    none: 'לא נשארו השבוע',
    resting: 'במנוחה',
    safe: 'הרצף מוגן היום'
  },
  restoreBanner: {
    title: (streak) => `הרצף שלך של ${streak} ימים נשבר.`,
    sub: 'אפשר להחזיר אותו לפני הסט השני היום, אחרת הוא מתחיל מחדש.',
    notEnough: (cost) => `צריך ${cost} מטבעות לשחזור`
  },
  week: {
    title: 'השבוע',
    line: (done, target) => `${done} מתוך ${target} ימי אימון`,
    days: ['ב', 'ג', 'ד', 'ה', 'ו', 'ש', 'א']
  }
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
  settingsLink: { title: 'خطتك', description: 'أيام الأسبوع ومعداتك ومستوى التمارين.', open: 'فتح' },
  plan: {
    title: 'خطتك',
    days: 'أيام في الأسبوع',
    daysSub: 'ننوّع لك بين أيام الدفع والسحب والأرجل والجسم الكامل.',
    gear: 'معداتك',
    gearSub: 'اضغط على المعدات المتوفرة لديك.',
    gearNote: 'تمارين الكرسي وحقيبة الظهر مشمولة دائماً. لا معدات؟ لا بأس، كل يوم يعمل كذلك.',
    gearNames: { bar: 'عقلة', dipBars: 'متوازي', dumbbell: 'دمبلز', barbell: 'بار حديد' },
    unlocks: (names, more) => `يفتح ${names}${more > 0 ? ` +${more}` : ''}`,
    week: 'أسبوعك',
    dayLabel: (n) => `اليوم ${n}`,
    today: 'اليوم',
    rest: 'يوم راحة: تمارين إطالة اليوم.',
    dayNames: { push: 'يوم الدفع', pull: 'يوم السحب', legs: 'يوم الأرجل', mixed: 'الجسم كاملاً' },
    focus: {
      push: 'الصدر والكتفان والترايسبس',
      pull: 'الظهر والبايسبس والكتف الخلفي',
      legs: 'الفخذ الأمامي والخلفي والأرداف والسمانة',
      mixed: 'قليل من كل شيء'
    },
    muscles: {
      chest: 'الصدر', shoulders: 'الكتفان', triceps: 'الترايسبس', abs: 'البطن', core: 'الجذع', back: 'الظهر',
      midBack: 'منتصف الظهر', upperBack: 'أعلى الظهر', quads: 'الفخذ الأمامي', singleLeg: 'ساق واحدة', hamstrings: 'الفخذ الخلفي',
      calves: 'السمانة', obliques: 'الخواصر', push: 'دفع', pull: 'سحب', legs: 'أرجل', glutes: 'الأرداف'
    },
    easier: 'أسهل',
    harder: 'أصعب',
    sets: (n) => `${n} مجموعات`,
    tileSub: (days) => `${days} أيام في الأسبوع`,
    harderCta: (name) => `انتقل إلى ${name}`,
    switched: (name) => `المرة القادمة: ${name}`
  },
  dashCard: {
    title: 'عدّل تمرينك',
    ownBadge: 'خطة خاصة',
    programBadge: 'برنامج',
    own: (sets, days) => `${sets} مجموعات يومياً · ${days} أيام في الأسبوع`,
    program: (days, day, phase) => `اليوم ${day} من ${days} · ${phase}`,
    programRest: (days) => `يوم راحة · تقسيم ${days} أيام`
  },
  settingsTab: 'الإعدادات',
  trio: {
    edit: 'تعديل التمرين',
    ownShort: (sets, days) => `${sets} مجموعات · ${days} أيام`,
    programShort: (day, days, phase) => `اليوم ${day}/${days} · ${phase}`,
    programRest: 'يوم راحة',
    left: (n) => `متبقٍ ${n} هذا الأسبوع`,
    none: 'لا شيء متبقٍ هذا الأسبوع',
    resting: 'في راحة',
    safe: 'سلسلتك آمنة اليوم'
  },
  restoreBanner: {
    title: (streak) => `انقطعت سلسلتك المكوّنة من ${streak} أيام.`,
    sub: 'استعدها قبل مجموعتك الثانية اليوم، وإلا ستبدأ من جديد.',
    notEnough: (cost) => `تحتاج ${cost} عملة للاستعادة`
  },
  week: {
    title: 'هذا الأسبوع',
    line: (done, target) => `${done} من ${target} أيام تدريب`,
    days: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح']
  }
};

export const hubContent: Record<Language, HubCopy> = { en, he, ar };
