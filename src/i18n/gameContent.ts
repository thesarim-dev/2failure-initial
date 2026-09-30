import type { Language } from './types';
import type { ResourceId } from '../game/catalog';
import type { ActionError } from '../game/engine';

type NameDesc = { name: string; description: string };
type TrophyCopy = { name: string; how: string; proof: (value: number) => string };

export type GameCopy = {
  tabs: { train: string; base: string };
  title: string;
  hqLevel: (level: number) => string;
  resources: Record<ResourceId, string>;
  resourceSource: Record<ResourceId, string>;
  status: {
    building: (name: string, sets: number) => string;
    quiet: string;
    today: (sets: number, fullSets: number) => string;
    half: string;
    limit: string;
  };
  goTrain: string;
  build: string;
  trophies: (earned: number, total: number) => string;
  buildTabs: { structures: string; decor: string };
  placeHint: (name: string) => string;
  moveHint: (name: string) => string;
  cancel: string;
  close: string;
  items: Record<string, NameDesc>;
  level: (level: number) => string;
  maxLevel: string;
  setsToBuild: (sets: number) => string;
  setsLeft: (sets: number) => string;
  upgradeTo: (level: number) => string;
  move: string;
  remove: string;
  refund: string;
  putAway: string;
  errors: Record<ActionError, string> & { unlockAt: (hq: number) => string };
  trophyShelf: {
    title: string;
    intro: string;
    notEarned: string;
    earnedOn: (date: string) => string;
    verified: string;
    place: string;
    onBase: string;
  };
  trophyNames: Record<string, TrophyCopy>;
  reward: {
    title: string;
    tooShort: string;
    half: string;
    limit: string;
    newTrophy: (name: string) => string;
    construction: (name: string, sets: number) => string;
    built: (name: string) => string;
    seeBase: string;
  };
  intro: { title: string; body: string; rule: string; ok: string };
};

const en: GameCopy = {
  tabs: { train: 'Train', base: 'Base' },
  title: 'Your base',
  hqLevel: (level) => `HQ level ${level}`,
  resources: { stone: 'Stone', timber: 'Timber', iron: 'Iron', crystal: 'Crystal' },
  resourceSource: {
    stone: 'from push sets',
    timber: 'from pull sets',
    iron: 'from leg sets',
    crystal: 'from core sets'
  },
  status: {
    building: (name, sets) =>
      `Building ${name}: ${sets === 1 ? '1 more set' : `${sets} more sets`} to finish.`,
    quiet: 'Your base is quiet today. Finish a set to light it up.',
    today: (sets, fullSets) => `Today: ${sets} of ${fullSets} full-reward sets.`,
    half: "You're past 12 sets today, so sets earn half.",
    limit: 'Daily limit reached. Rest is part of training too.'
  },
  goTrain: 'Train',
  build: 'Build',
  trophies: (earned, total) => `Trophies ${earned}/${total}`,
  buildTabs: { structures: 'Buildings', decor: 'Decor' },
  placeHint: (name) => `Tap a highlighted tile to place ${name}.`,
  moveHint: (name) => `Tap a highlighted tile to move ${name}.`,
  cancel: 'Cancel',
  close: 'Close',
  items: {
    hq: {
      name: 'Headquarters',
      description: 'The heart of your base. Upgrade it to unlock more land and new buildings.'
    },
    watchtower: { name: 'Watchtower', description: 'A stone lookout, built mostly from push sets.' },
    lodge: { name: 'Lodge', description: 'A timber lodge, built mostly from pull sets.' },
    forge: { name: 'Forge', description: 'An iron forge, built mostly from leg sets.' },
    spring: { name: 'Crystal Spring', description: 'A calm spring, built mostly from core sets.' },
    path: { name: 'Path', description: 'Stone paving to connect your buildings.' },
    wall: { name: 'Wall', description: 'A low stone wall.' },
    pine: { name: 'Pine', description: 'An evergreen tree.' },
    lamp: { name: 'Lamp', description: 'Lights up on days you train.' },
    banner: { name: 'Banner', description: 'Fly your colours.' },
    garden: { name: 'Garden bed', description: 'A small bed of flowers.' },
    fountain: { name: 'Fountain', description: 'A crystal fountain for the town square.' }
  },
  level: (level) => `Level ${level}`,
  maxLevel: 'Max level',
  setsToBuild: (sets) => (sets === 1 ? 'builds in 1 set' : `builds in ${sets} sets`),
  setsLeft: (sets) => (sets === 1 ? '1 set to go' : `${sets} sets to go`),
  upgradeTo: (level) => `Upgrade to level ${level}`,
  move: 'Move',
  remove: 'Remove',
  refund: 'Full refund',
  putAway: 'Put back on shelf',
  errors: {
    locked: 'Locked',
    unlockAt: (hq) => `Unlocks at HQ level ${hq}`,
    maxCount: 'Upgrade HQ to build more of these',
    builderBusy: 'Your builder is busy. Finish the current build first.',
    cantAfford: 'Not enough materials yet',
    blocked: "That tile isn't free",
    maxLevel: 'Max level',
    needsHq: 'Upgrade HQ first',
    notEarned: 'Not earned yet',
    alreadyPlaced: 'Already on your base',
    notRemovable: "Buildings can be moved but not removed"
  },
  trophyShelf: {
    title: 'Trophies',
    intro: "Trophies can't be bought. Each one is proof of something you did.",
    notEarned: 'Not earned yet',
    earnedOn: (date) => `Earned ${date}`,
    verified: 'Verified by camera',
    place: 'Place on base',
    onBase: 'On your base'
  },
  trophyNames: {
    'first-set': { name: 'First Set', how: 'Finish your first set.', proof: () => 'Your very first set' },
    'sets-50': { name: '50 Sets', how: 'Finish 50 sets.', proof: (v) => `${v} sets finished` },
    'sets-250': { name: '250 Sets', how: 'Finish 250 sets.', proof: (v) => `${v} sets finished` },
    'streak-3': { name: '3-Day Streak', how: 'Train 3 days in a row.', proof: (v) => `${v} days in a row` },
    'streak-7': { name: '7-Day Streak', how: 'Train 7 days in a row.', proof: (v) => `${v} days in a row` },
    'streak-30': { name: '30-Day Streak', how: 'Train 30 days in a row.', proof: (v) => `${v} days in a row` },
    'streak-100': { name: '100-Day Streak', how: 'Train 100 days in a row.', proof: (v) => `${v} days in a row` },
    'pushups-30': { name: '30 Pushups', how: 'Do 30 pushups in one set.', proof: (v) => `${v} pushups in one set` },
    'pushups-50': { name: '50 Pushups', how: 'Do 50 pushups in one set.', proof: (v) => `${v} pushups in one set` },
    'first-pull-up': { name: 'First Pull-Up', how: 'Log a set of pull-ups or chin-ups.', proof: (v) => `${v} reps in the first set` },
    'first-pistol': { name: 'First Pistol Squat', how: 'Log a set of pistol squats.', proof: (v) => `${v} reps in the first set` },
    'first-loaded': { name: 'Loaded Up', how: 'Finish a backpack set.', proof: () => 'First set with a loaded backpack' },
    'first-elite': { name: 'Elite Move', how: 'Finish a set of an elite exercise.', proof: () => 'First elite-tier set' },
    'balanced-week': { name: 'Balanced Week', how: 'Train push, pull, legs and core in the same week.', proof: () => 'Push, pull, legs and core in one week' }
  },
  reward: {
    title: 'For your base',
    tooShort: "Sets under 10 seconds don't earn materials.",
    half: "Half materials: you're past 12 sets today.",
    limit: 'Daily limit reached. Rest is part of training too.',
    newTrophy: (name) => `New trophy: ${name}`,
    construction: (name, sets) => `${name}: ${sets === 1 ? '1 more set' : `${sets} more sets`} to finish`,
    built: (name) => `${name} is finished!`,
    seeBase: 'See your base'
  },
  intro: {
    title: 'Welcome to your base',
    body: 'Every set you finish earns materials. Push sets earn stone, pull sets timber, leg sets iron, and core sets crystal. Spend them on buildings, which finish as you train, and on decorations.',
    rule: "Trophies can't be bought. You earn them by training, then show them off here.",
    ok: "Let's build"
  }
};

const he: GameCopy = {
  tabs: { train: 'אימון', base: 'בסיס' },
  title: 'הבסיס שלך',
  hqLevel: (level) => `מפקדה שלב ${level}`,
  resources: { stone: 'אבן', timber: 'עץ', iron: 'ברזל', crystal: 'קריסטל' },
  resourceSource: {
    stone: 'מסטים של דחיפה',
    timber: 'מסטים של משיכה',
    iron: 'מסטים של רגליים',
    crystal: 'מסטים של ליבה'
  },
  status: {
    building: (name, sets) =>
      `בונים ${name}: ${sets === 1 ? 'עוד סט אחד' : `עוד ${sets} סטים`} לסיום.`,
    quiet: 'הבסיס שקט היום. סיים סט כדי להדליק אותו.',
    today: (sets, fullSets) => `היום: ${sets} מתוך ${fullSets} סטים בתגמול מלא.`,
    half: 'עברת 12 סטים היום, אז כל סט מזכה בחצי.',
    limit: 'הגעת למגבלה היומית. גם מנוחה היא חלק מהאימון.'
  },
  goTrain: 'לאימון',
  build: 'בנייה',
  trophies: (earned, total) => `גביעים ${earned}/${total}`,
  buildTabs: { structures: 'מבנים', decor: 'קישוטים' },
  placeHint: (name) => `הקש על משבצת מודגשת כדי למקם ${name}.`,
  moveHint: (name) => `הקש על משבצת מודגשת כדי להזיז ${name}.`,
  cancel: 'ביטול',
  close: 'סגירה',
  items: {
    hq: { name: 'מפקדה', description: 'הלב של הבסיס. שדרג אותה כדי לפתוח עוד שטח ומבנים חדשים.' },
    watchtower: { name: 'מגדל תצפית', description: 'מגדל אבן, נבנה בעיקר מסטים של דחיפה.' },
    lodge: { name: 'בקתה', description: 'בקתת עץ, נבנית בעיקר מסטים של משיכה.' },
    forge: { name: 'נפחייה', description: 'נפחיית ברזל, נבנית בעיקר מסטים של רגליים.' },
    spring: { name: 'מעיין קריסטל', description: 'מעיין רגוע, נבנה בעיקר מסטים של ליבה.' },
    path: { name: 'שביל', description: 'ריצוף אבן שמחבר בין המבנים.' },
    wall: { name: 'חומה', description: 'חומת אבן נמוכה.' },
    pine: { name: 'אורן', description: 'עץ ירוק־עד.' },
    lamp: { name: 'פנס', description: 'נדלק בימים שבהם אתה מתאמן.' },
    banner: { name: 'דגל', description: 'הנף את הצבעים שלך.' },
    garden: { name: 'ערוגה', description: 'ערוגת פרחים קטנה.' },
    fountain: { name: 'מזרקה', description: 'מזרקת קריסטל לכיכר העיר.' }
  },
  level: (level) => `שלב ${level}`,
  maxLevel: 'שלב מקסימלי',
  setsToBuild: (sets) => (sets === 1 ? 'נבנה בסט אחד' : `נבנה ב־${sets} סטים`),
  setsLeft: (sets) => (sets === 1 ? 'עוד סט אחד' : `עוד ${sets} סטים`),
  upgradeTo: (level) => `שדרג לשלב ${level}`,
  move: 'הזזה',
  remove: 'הסרה',
  refund: 'החזר מלא',
  putAway: 'החזר למדף',
  errors: {
    locked: 'נעול',
    unlockAt: (hq) => `נפתח במפקדה שלב ${hq}`,
    maxCount: 'שדרג את המפקדה כדי לבנות עוד מאלה',
    builderBusy: 'הבנאי עסוק. סיים קודם את הבנייה הנוכחית.',
    cantAfford: 'עדיין אין מספיק חומרים',
    blocked: 'המשבצת הזו תפוסה',
    maxLevel: 'שלב מקסימלי',
    needsHq: 'שדרג קודם את המפקדה',
    notEarned: 'עדיין לא הושג',
    alreadyPlaced: 'כבר נמצא בבסיס שלך',
    notRemovable: 'אפשר להזיז מבנים אבל לא להסיר אותם'
  },
  trophyShelf: {
    title: 'גביעים',
    intro: 'אי אפשר לקנות גביעים. כל אחד מהם הוא הוכחה למשהו שעשית.',
    notEarned: 'עדיין לא הושג',
    earnedOn: (date) => `הושג ב־${date}`,
    verified: 'אומת במצלמה',
    place: 'מקם בבסיס',
    onBase: 'נמצא בבסיס שלך'
  },
  trophyNames: {
    'first-set': { name: 'הסט הראשון', how: 'סיים את הסט הראשון שלך.', proof: () => 'הסט הראשון שלך' },
    'sets-50': { name: '50 סטים', how: 'סיים 50 סטים.', proof: (v) => `${v} סטים הושלמו` },
    'sets-250': { name: '250 סטים', how: 'סיים 250 סטים.', proof: (v) => `${v} סטים הושלמו` },
    'streak-3': { name: 'רצף 3 ימים', how: 'התאמן 3 ימים ברצף.', proof: (v) => `${v} ימים ברצף` },
    'streak-7': { name: 'רצף 7 ימים', how: 'התאמן 7 ימים ברצף.', proof: (v) => `${v} ימים ברצף` },
    'streak-30': { name: 'רצף 30 ימים', how: 'התאמן 30 ימים ברצף.', proof: (v) => `${v} ימים ברצף` },
    'streak-100': { name: 'רצף 100 ימים', how: 'התאמן 100 ימים ברצף.', proof: (v) => `${v} ימים ברצף` },
    'pushups-30': { name: '30 שכיבות סמיכה', how: 'עשה 30 שכיבות סמיכה בסט אחד.', proof: (v) => `${v} שכיבות סמיכה בסט אחד` },
    'pushups-50': { name: '50 שכיבות סמיכה', how: 'עשה 50 שכיבות סמיכה בסט אחד.', proof: (v) => `${v} שכיבות סמיכה בסט אחד` },
    'first-pull-up': { name: 'המתח הראשון', how: 'רשום סט של מתח.', proof: (v) => `${v} חזרות בסט הראשון` },
    'first-pistol': { name: 'סקוואט אקדח ראשון', how: 'רשום סט של סקוואט אקדח.', proof: (v) => `${v} חזרות בסט הראשון` },
    'first-loaded': { name: 'עם משקל', how: 'סיים סט עם תיק גב.', proof: () => 'הסט הראשון עם תיק גב טעון' },
    'first-elite': { name: 'תרגיל עילית', how: 'סיים סט של תרגיל ברמת עילית.', proof: () => 'הסט הראשון ברמת עילית' },
    'balanced-week': { name: 'שבוע מאוזן', how: 'התאמן דחיפה, משיכה, רגליים וליבה באותו שבוע.', proof: () => 'דחיפה, משיכה, רגליים וליבה בשבוע אחד' }
  },
  reward: {
    title: 'לבסיס שלך',
    tooShort: 'סטים של פחות מ־10 שניות לא מזכים בחומרים.',
    half: 'חצי חומרים: עברת 12 סטים היום.',
    limit: 'הגעת למגבלה היומית. גם מנוחה היא חלק מהאימון.',
    newTrophy: (name) => `גביע חדש: ${name}`,
    construction: (name, sets) => `${name}: ${sets === 1 ? 'עוד סט אחד' : `עוד ${sets} סטים`} לסיום`,
    built: (name) => `${name} מוכן!`,
    seeBase: 'לבסיס שלך'
  },
  intro: {
    title: 'ברוך הבא לבסיס שלך',
    body: 'כל סט שאתה מסיים מזכה בחומרים. סטים של דחיפה נותנים אבן, משיכה עץ, רגליים ברזל וליבה קריסטל. השתמש בהם כדי לבנות מבנים, שנגמרים ככל שאתה מתאמן, ולקנות קישוטים.',
    rule: 'אי אפשר לקנות גביעים. משיגים אותם באימונים, ומציגים אותם כאן.',
    ok: 'בוא נבנה'
  }
};

const ar: GameCopy = {
  tabs: { train: 'تدريب', base: 'القاعدة' },
  title: 'قاعدتك',
  hqLevel: (level) => `المقر مستوى ${level}`,
  resources: { stone: 'حجر', timber: 'خشب', iron: 'حديد', crystal: 'كريستال' },
  resourceSource: {
    stone: 'من مجموعات الدفع',
    timber: 'من مجموعات السحب',
    iron: 'من مجموعات الساقين',
    crystal: 'من مجموعات الجذع'
  },
  status: {
    building: (name, sets) =>
      `جارٍ بناء ${name}: ${sets === 1 ? 'مجموعة واحدة أخرى' : `${sets} مجموعات أخرى`} للانتهاء.`,
    quiet: 'قاعدتك هادئة اليوم. أنهِ مجموعة لتضيئها.',
    today: (sets, fullSets) => `اليوم: ${sets} من ${fullSets} مجموعات بمكافأة كاملة.`,
    half: 'تجاوزت 12 مجموعة اليوم، لذا تمنح كل مجموعة النصف.',
    limit: 'وصلت إلى الحد اليومي. الراحة جزء من التدريب أيضاً.'
  },
  goTrain: 'تدرّب',
  build: 'بناء',
  trophies: (earned, total) => `الكؤوس ${earned}/${total}`,
  buildTabs: { structures: 'مبانٍ', decor: 'زينة' },
  placeHint: (name) => `اضغط على مربع مضيء لوضع ${name}.`,
  moveHint: (name) => `اضغط على مربع مضيء لنقل ${name}.`,
  cancel: 'إلغاء',
  close: 'إغلاق',
  items: {
    hq: { name: 'المقر', description: 'قلب قاعدتك. طوّره لتفتح أرضاً أكبر ومبانيَ جديدة.' },
    watchtower: { name: 'برج المراقبة', description: 'برج حجري، يُبنى غالباً من مجموعات الدفع.' },
    lodge: { name: 'الكوخ', description: 'كوخ خشبي، يُبنى غالباً من مجموعات السحب.' },
    forge: { name: 'الحدادة', description: 'ورشة حدادة، تُبنى غالباً من مجموعات الساقين.' },
    spring: { name: 'نبع الكريستال', description: 'نبع هادئ، يُبنى غالباً من مجموعات الجذع.' },
    path: { name: 'ممر', description: 'رصف حجري يربط بين مبانيك.' },
    wall: { name: 'سور', description: 'سور حجري منخفض.' },
    pine: { name: 'صنوبر', description: 'شجرة دائمة الخضرة.' },
    lamp: { name: 'مصباح', description: 'يضيء في الأيام التي تتدرب فيها.' },
    banner: { name: 'راية', description: 'ارفع ألوانك.' },
    garden: { name: 'حوض زهور', description: 'حوض صغير من الزهور.' },
    fountain: { name: 'نافورة', description: 'نافورة كريستال لساحة البلدة.' }
  },
  level: (level) => `المستوى ${level}`,
  maxLevel: 'أعلى مستوى',
  setsToBuild: (sets) => (sets === 1 ? 'يُبنى في مجموعة واحدة' : `يُبنى في ${sets} مجموعات`),
  setsLeft: (sets) => (sets === 1 ? 'مجموعة واحدة متبقية' : `${sets} مجموعات متبقية`),
  upgradeTo: (level) => `طوّر إلى المستوى ${level}`,
  move: 'نقل',
  remove: 'إزالة',
  refund: 'استرداد كامل',
  putAway: 'أعده إلى الرف',
  errors: {
    locked: 'مقفل',
    unlockAt: (hq) => `يُفتح عند المقر مستوى ${hq}`,
    maxCount: 'طوّر المقر لتبني المزيد من هذا',
    builderBusy: 'البنّاء مشغول. أنهِ البناء الحالي أولاً.',
    cantAfford: 'لا توجد مواد كافية بعد',
    blocked: 'هذا المربع ليس فارغاً',
    maxLevel: 'أعلى مستوى',
    needsHq: 'طوّر المقر أولاً',
    notEarned: 'لم تحصل عليه بعد',
    alreadyPlaced: 'موجود في قاعدتك بالفعل',
    notRemovable: 'يمكن نقل المباني لكن لا يمكن إزالتها'
  },
  trophyShelf: {
    title: 'الكؤوس',
    intro: 'لا يمكن شراء الكؤوس. كل واحدة منها دليل على شيء أنجزته.',
    notEarned: 'لم تحصل عليه بعد',
    earnedOn: (date) => `حصلت عليه في ${date}`,
    verified: 'موثّق بالكاميرا',
    place: 'ضعه في القاعدة',
    onBase: 'موجود في قاعدتك'
  },
  trophyNames: {
    'first-set': { name: 'المجموعة الأولى', how: 'أنهِ مجموعتك الأولى.', proof: () => 'مجموعتك الأولى' },
    'sets-50': { name: '50 مجموعة', how: 'أنهِ 50 مجموعة.', proof: (v) => `${v} مجموعة مكتملة` },
    'sets-250': { name: '250 مجموعة', how: 'أنهِ 250 مجموعة.', proof: (v) => `${v} مجموعة مكتملة` },
    'streak-3': { name: 'سلسلة 3 أيام', how: 'تدرّب 3 أيام متتالية.', proof: (v) => `${v} أيام متتالية` },
    'streak-7': { name: 'سلسلة 7 أيام', how: 'تدرّب 7 أيام متتالية.', proof: (v) => `${v} أيام متتالية` },
    'streak-30': { name: 'سلسلة 30 يوماً', how: 'تدرّب 30 يوماً متتالياً.', proof: (v) => `${v} يوماً متتالياً` },
    'streak-100': { name: 'سلسلة 100 يوم', how: 'تدرّب 100 يوم متتالٍ.', proof: (v) => `${v} يوم متتالٍ` },
    'pushups-30': { name: '30 ضغطة', how: 'أدِّ 30 ضغطة في مجموعة واحدة.', proof: (v) => `${v} ضغطة في مجموعة واحدة` },
    'pushups-50': { name: '50 ضغطة', how: 'أدِّ 50 ضغطة في مجموعة واحدة.', proof: (v) => `${v} ضغطة في مجموعة واحدة` },
    'first-pull-up': { name: 'أول عقلة', how: 'سجّل مجموعة من العقلة.', proof: (v) => `${v} تكرارات في المجموعة الأولى` },
    'first-pistol': { name: 'أول قرفصاء مسدس', how: 'سجّل مجموعة من قرفصاء المسدس.', proof: (v) => `${v} تكرارات في المجموعة الأولى` },
    'first-loaded': { name: 'بوزن إضافي', how: 'أنهِ مجموعة بحقيبة الظهر.', proof: () => 'أول مجموعة بحقيبة ظهر محمّلة' },
    'first-elite': { name: 'تمرين النخبة', how: 'أنهِ مجموعة من تمرين بمستوى النخبة.', proof: () => 'أول مجموعة بمستوى النخبة' },
    'balanced-week': { name: 'أسبوع متوازن', how: 'تدرّب دفعاً وسحباً وساقين وجذعاً في الأسبوع نفسه.', proof: () => 'دفع وسحب وساقان وجذع في أسبوع واحد' }
  },
  reward: {
    title: 'لقاعدتك',
    tooShort: 'المجموعات الأقل من 10 ثوانٍ لا تمنح مواد.',
    half: 'نصف المواد: تجاوزت 12 مجموعة اليوم.',
    limit: 'وصلت إلى الحد اليومي. الراحة جزء من التدريب أيضاً.',
    newTrophy: (name) => `كأس جديدة: ${name}`,
    construction: (name, sets) => `${name}: ${sets === 1 ? 'مجموعة واحدة أخرى' : `${sets} مجموعات أخرى`} للانتهاء`,
    built: (name) => `اكتمل ${name}!`,
    seeBase: 'اذهب إلى قاعدتك'
  },
  intro: {
    title: 'مرحباً بك في قاعدتك',
    body: 'كل مجموعة تنهيها تمنحك مواد. مجموعات الدفع تمنح حجراً، والسحب خشباً، والساقان حديداً، والجذع كريستالاً. استخدمها لبناء مبانٍ تكتمل كلما تدربت، ولشراء الزينة.',
    rule: 'لا يمكن شراء الكؤوس. تحصل عليها بالتدريب، ثم تعرضها هنا.',
    ok: 'لنبدأ البناء'
  }
};

export const gameContent: Record<Language, GameCopy> = { en, he, ar };
