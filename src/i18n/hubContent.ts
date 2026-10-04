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
    ownBadge: string;
    programBadge: string;
    own: (sets: number, days: number) => string;
    program: (days: number, day: number, phase: string) => string;
    programRest: (days: number) => string;
  };
  settingsTab: string;
  restoreBanner: { title: (streak: number) => string; sub: string; notEnough: (cost: number) => string };
  offline: { pending: (n: number) => string; retry: string };
  guest: {
    tryIt: string;
    tryItSub: string;
    starting: string;
    saveTitle: string;
    saveSub: string;
    google: string;
    email: string;
    emailLabel: string;
    passwordLabel: string;
    saveEmail: string;
    checkInbox: string;
    saved: string;
    error: string;
    signOutWarn: string;
    settingsTitle: string;
    settingsSub: string;
  };
  firstBase: { title: string; sub: string; open: string };
  reminders: {
    title: string;
    sub: string;
    allow: string;
    later: string;
    iosTitle: string;
    iosSub: string;
    gotIt: string;
    settingsTitle: string;
    settingsSub: string;
    on: string;
    off: string;
    blocked: string;
  };
  programTip: { title: string; sub: string; tryIt: string; dismiss: string };
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
  settingsLink: { title: 'Training plan', description: 'Program, training days, sets and your lineup.', open: 'Open' },
  dashCard: {
    title: 'Edit your workout',
    ownBadge: 'Own plan',
    programBadge: 'Program',
    own: (sets, days) => `${sets} sets a day · ${days} days a week`,
    program: (days, day, phase) => `Day ${day} of ${days} · ${phase}`,
    programRest: (days) => `Rest day · ${days}-day split`
  },
  settingsTab: 'Settings',
  guest: {
    tryIt: 'Try it first',
    tryItSub: 'No account needed. Save your progress later.',
    starting: 'Starting…',
    saveTitle: 'Save your progress',
    saveSub: "You're training as a guest. Create an account so your sets, streak and base are never lost.",
    google: 'Continue with Google',
    email: 'Use email instead',
    emailLabel: 'Email',
    passwordLabel: 'Password (6+ characters)',
    saveEmail: 'Save my progress',
    checkInbox: 'Almost done: check your inbox and tap the link to confirm.',
    saved: 'Progress saved to your account.',
    error: "Couldn't save right now. Try again in a moment.",
    signOutWarn: "You're a guest. Signing out deletes your progress on this device. Save it to an account first?",
    settingsTitle: 'Guest account',
    settingsSub: 'Your progress lives only on this device until you save it.'
  },
  firstBase: {
    title: 'Your first materials just landed!',
    sub: 'Every set builds your base. Spend them on your first building.',
    open: 'Open your base'
  },
  reminders: {
    title: 'Protect your flame 🔥',
    sub: "Get one gentle reminder in the evening if you haven't trained yet, so your streak never goes out by accident.",
    allow: 'Turn on reminders',
    later: 'Not now',
    iosTitle: 'Get flame reminders on iPhone',
    iosSub: 'Tap Share, then "Add to Home Screen". Open 2failure from there and turn reminders on in Settings.',
    gotIt: 'Got it',
    settingsTitle: 'Flame reminders',
    settingsSub: "One evening nudge on days you haven't trained yet.",
    on: 'on',
    off: 'off',
    blocked: 'Blocked in your browser settings'
  },
  programTip: {
    title: 'Not sure what to train?',
    sub: 'Follow a ready-made 3-day program. We pick balanced workouts for you each day.',
    tryIt: 'Try the program',
    dismiss: "I'll pick my own"
  },
  offline: {
    pending: (n) => (n === 1 ? "1 set saved on this phone. It'll sync when you're back online." : `${n} sets saved on this phone. They'll sync when you're back online.`),
    retry: 'Sync now'
  },
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
  settingsLink: { title: 'תוכנית אימון', description: 'תוכנית, ימי אימון, סטים וההרכב שלך.', open: 'פתח' },
  dashCard: {
    title: 'ערוך את האימון',
    ownBadge: 'תוכנית אישית',
    programBadge: 'תוכנית מוכנה',
    own: (sets, days) => `${sets} סטים ביום · ${days} ימים בשבוע`,
    program: (days, day, phase) => `יום ${day} מתוך ${days} · ${phase}`,
    programRest: (days) => `יום מנוחה · חלוקת ${days} ימים`
  },
  settingsTab: 'הגדרות',
  guest: {
    tryIt: 'נסו קודם',
    tryItSub: 'בלי חשבון. אפשר לשמור את ההתקדמות אחר כך.',
    starting: 'מתחילים…',
    saveTitle: 'שמרו את ההתקדמות',
    saveSub: 'אתם מתאמנים כאורחים. צרו חשבון כדי שהסטים, הרצף והבסיס לא ילכו לאיבוד.',
    google: 'המשך עם Google',
    email: 'השתמשו באימייל',
    emailLabel: 'אימייל',
    passwordLabel: 'סיסמה (6 תווים לפחות)',
    saveEmail: 'שמרו את ההתקדמות',
    checkInbox: 'כמעט סיימנו: בדקו את תיבת הדואר ולחצו על הקישור לאישור.',
    saved: 'ההתקדמות נשמרה בחשבון.',
    error: 'לא הצלחנו לשמור כרגע. נסו שוב עוד רגע.',
    signOutWarn: 'אתם אורחים. יציאה תמחק את ההתקדמות במכשיר הזה. לשמור קודם בחשבון?',
    settingsTitle: 'חשבון אורח',
    settingsSub: 'ההתקדמות שמורה רק במכשיר הזה עד שתשמרו אותה.'
  },
  firstBase: {
    title: 'החומרים הראשונים שלכם נחתו!',
    sub: 'כל סט בונה את הבסיס. השתמשו בהם לבניין הראשון.',
    open: 'פתחו את הבסיס'
  },
  reminders: {
    title: 'שמרו על הלהבה 🔥',
    sub: 'קבלו תזכורת עדינה אחת בערב אם עוד לא התאמנתם, כדי שהרצף לא ייכבה בטעות.',
    allow: 'הפעילו תזכורות',
    later: 'לא עכשיו',
    iosTitle: 'תזכורות להבה באייפון',
    iosSub: 'הקישו שיתוף ואז "הוסף למסך הבית". פתחו את 2failure משם והפעילו תזכורות בהגדרות.',
    gotIt: 'הבנתי',
    settingsTitle: 'תזכורות להבה',
    settingsSub: 'תזכורת ערב אחת בימים שעוד לא התאמנתם.',
    on: 'פועל',
    off: 'כבוי',
    blocked: 'חסום בהגדרות הדפדפן'
  },
  programTip: {
    title: 'לא בטוחים מה להתאמן?',
    sub: 'עקבו אחרי תוכנית מוכנה של 3 ימים. אנחנו בוחרים בשבילכם אימונים מאוזנים בכל יום.',
    tryIt: 'נסו את התוכנית',
    dismiss: 'אבחר בעצמי'
  },
  offline: {
    pending: (n) => (n === 1 ? 'סט אחד נשמר בטלפון. הוא יסונכרן כשתחזור לקליטה.' : `${n} סטים נשמרו בטלפון. הם יסונכרנו כשתחזור לקליטה.`),
    retry: 'סנכרן עכשיו'
  },
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
  settingsLink: { title: 'خطة التدريب', description: 'البرنامج وأيام التدريب والمجموعات وتشكيلتك.', open: 'فتح' },
  dashCard: {
    title: 'عدّل تمرينك',
    ownBadge: 'خطة خاصة',
    programBadge: 'برنامج',
    own: (sets, days) => `${sets} مجموعات يومياً · ${days} أيام في الأسبوع`,
    program: (days, day, phase) => `اليوم ${day} من ${days} · ${phase}`,
    programRest: (days) => `يوم راحة · تقسيم ${days} أيام`
  },
  settingsTab: 'الإعدادات',
  guest: {
    tryIt: 'جرّبه أولاً',
    tryItSub: 'بدون حساب. احفظ تقدّمك لاحقاً.',
    starting: 'جارٍ البدء…',
    saveTitle: 'احفظ تقدّمك',
    saveSub: 'أنت تتدرّب كضيف. أنشئ حساباً حتى لا تضيع مجموعاتك وسلسلتك وقاعدتك.',
    google: 'المتابعة باستخدام Google',
    email: 'استخدم البريد الإلكتروني',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور (6 أحرف على الأقل)',
    saveEmail: 'احفظ تقدّمي',
    checkInbox: 'اقتربنا: افتح بريدك واضغط على الرابط للتأكيد.',
    saved: 'تم حفظ تقدّمك في حسابك.',
    error: 'تعذّر الحفظ الآن. حاول مرة أخرى بعد قليل.',
    signOutWarn: 'أنت ضيف. تسجيل الخروج يحذف تقدّمك على هذا الجهاز. هل تريد حفظه في حساب أولاً؟',
    settingsTitle: 'حساب ضيف',
    settingsSub: 'تقدّمك محفوظ على هذا الجهاز فقط حتى تحفظه.'
  },
  firstBase: {
    title: 'وصلت أولى موادك!',
    sub: 'كل مجموعة تبني قاعدتك. استخدمها في أول مبنى لك.',
    open: 'افتح قاعدتك'
  },
  reminders: {
    title: 'احمِ شعلتك 🔥',
    sub: 'احصل على تذكير لطيف واحد مساءً إن لم تتدرّب بعد، حتى لا تنطفئ سلسلتك عن طريق الخطأ.',
    allow: 'فعّل التذكيرات',
    later: 'ليس الآن',
    iosTitle: 'تذكيرات الشعلة على الآيفون',
    iosSub: 'اضغط مشاركة ثم "إضافة إلى الشاشة الرئيسية". افتح 2failure من هناك وفعّل التذكيرات في الإعدادات.',
    gotIt: 'فهمت',
    settingsTitle: 'تذكيرات الشعلة',
    settingsSub: 'تذكير مسائي واحد في الأيام التي لم تتدرّب فيها بعد.',
    on: 'مفعّل',
    off: 'متوقف',
    blocked: 'محظور في إعدادات المتصفح'
  },
  programTip: {
    title: 'لست متأكداً مما تتدرّب عليه؟',
    sub: 'اتبع برنامجاً جاهزاً من 3 أيام. نختار لك تمارين متوازنة كل يوم.',
    tryIt: 'جرّب البرنامج',
    dismiss: 'سأختار بنفسي'
  },
  offline: {
    pending: (n) => (n === 1 ? 'حُفظت مجموعة واحدة على هاتفك. ستتم مزامنتها عند عودة الاتصال.' : `حُفظت ${n} مجموعات على هاتفك. ستتم مزامنتها عند عودة الاتصال.`),
    retry: 'زامن الآن'
  },
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
