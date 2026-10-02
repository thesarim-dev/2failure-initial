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
  buildTabs: { structures: string; decor: string; trophies: string };
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
  patterns: Record<'push' | 'pull' | 'legs' | 'core' | 'recovery', string>;
  today: {
    title: string;
    training: (done: number, total: number) => string;
    rest: string;
    sessionBonus: (amount: number) => string;
    sessionDone: string;
    week: (done: number, target: number) => string;
    weeklyStreak: (weeks: number) => string;
    weeklyBonus: (amount: number) => string;
    weeklyDone: string;
  };
  quests: {
    title: string;
    finishExercise: (name: string, sets: number) => string;
    inRange: (name: string, min: number, max: number) => string;
    patternSets: (sets: number, pattern: string) => string;
    stretch: (sets: number) => string;
    done: string;
    moreSlots: string;
    none: string;
  };
  roles: {
    hq: (weeksDone: number, weeksNeeded: number, nextLevel: number) => string;
    hqMax: string;
    watchtower: (slots: number) => string;
    lodge: (shields: number, capacity: number, builders: number) => string;
    forge: (rate: number) => string;
    spring: (level: number) => string;
    yard: (bonus: number) => string;
  };
  forge: { from: string; to: string; trade: (cost: number, out: number) => string };
  lodge: { useShield: (shields: number) => string };
  yard: { stationsTitle: string; restDay: string };
  rewardExtra: {
    beyondPlan: string;
    quest: (text: string) => string;
    session: string;
    weekly: string;
    spring: (amount: number) => string;
    shield: string;
  };
  trainingDays: { title: string; description: (days: number) => string };
  customize: {
    title: string;
    edit: string;
    style: string;
    color: string;
    auto: string;
    place: string;
    save: string;
  };
  styleNames: Record<string, string>;
  colorNames: Record<string, string>;
  builders: {
    status: (busy: number, total: number) => string;
    chip: (free: number, total: number) => string;
    needs: (builders: number) => string;
    jobs: string;
  };
  land: {
    button: string;
    title: string;
    current: (side: number) => string;
    next: (side: number) => string;
    cost: (coins: number) => string;
    balance: (coins: number) => string;
    buy: (coins: number) => string;
    max: string;
    why: string;
  };
  coins: (amount: number) => string;
  baseLevel: {
    level: (level: number) => string;
    titles: Record<import('../game/catalog').BaseTitle, string>;
    progress: (score: number, next: number) => string;
    next: (title: string) => string;
    unlocks: (list: string) => string;
    max: string;
    levelUp: (title: string) => string;
    how: string;
  };
  paint: { button: string; title: string; hint: string; done: string; locked: (level: number) => string };
  terrainNames: Record<import('../game/catalog').TerrainId, string>;
  decorGroups: Record<import('../game/catalog').DecorGroup, string>;
  zoomIn: string;
  zoomOut: string;
  sound: { title: string; description: string; on: string; off: string };
  flip: string;
};

const en: GameCopy = {
  tabs: { train: 'Train', base: 'Base' },
  title: 'Your base',
  hqLevel: (level) => `HQ level ${level}`,
  resources: { stone: 'Stone', timber: 'Timber', crystal: 'Crystal' },
  resourceSource: {
    stone: 'from upper-body sets',
    timber: 'from lower-body sets',
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
  buildTabs: { structures: 'Buildings', decor: 'Decor', trophies: 'Trophies' },
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
    forge: { name: 'Forge', description: 'A forge of stone and timber.' },
    spring: { name: 'Crystal Spring', description: 'A calm spring, built mostly from core sets.' },
    yard: { name: 'Training Yard', description: "Your training ground. It shows today's workout as stations." },
    path: { name: 'Path', description: 'Stone paving to connect your buildings.' },
    wall: { name: 'Wall', description: 'A low stone wall.' },
    pine: { name: 'Tree', description: 'Pick a pine, oak, palm or cherry blossom.' },
    lamp: { name: 'Lamp', description: 'Lights up on days you train.' },
    banner: { name: 'Banner', description: 'Fly your colours.' },
    garden: { name: 'Garden bed', description: 'A small bed of flowers.' },
    fountain: { name: 'Fountain', description: 'A crystal fountain for the town square.' },
    bush: { name: 'Bush', description: 'A round leafy bush.' },
    rock: { name: 'Rock', description: 'A big boulder, plain or mossy.' },
    flowers: { name: 'Flower patch', description: 'Wild flowers right in the grass.' },
    bench: { name: 'Bench', description: 'A place to rest between sets.' },
    campfire: { name: 'Campfire', description: 'Crackles on training nights.' },
    picnic: { name: 'Picnic table', description: 'With a cloth in your colour.' },
    gazebo: { name: 'Gazebo', description: 'An open pavilion for the garden.' },
    torch: { name: 'Torch', description: 'A flickering torch.' },
    lanterns: { name: 'String lights', description: 'Lanterns strung between two posts.' },
    arch: { name: 'Flower arch', description: 'An arch covered in blossoms.' },
    statue: { name: 'Hero statue', description: 'A champion in stone.' },
    plyobox: { name: 'Plyo box', description: 'For box jumps and step-ups.' },
    pullupbar: { name: 'Pull-up bar', description: 'Every park needs one.' },
    dipbars: { name: 'Dip bars', description: 'Parallel bars for dips.' },
    punchbag: { name: 'Punching bag', description: 'For cardio days.' },
    lilypad: { name: 'Lily pad', description: 'Goes on water.' },
    bridge: { name: 'Bridge', description: 'Goes on water.' },
    hay: { name: 'Hay bale', description: 'Cows love it.' },
    barrels: { name: 'Barrels', description: 'A stack of wooden barrels.' },
    pumpkins: { name: 'Pumpkins', description: 'A little pumpkin patch.' },
    birdhouse: { name: 'Birdhouse', description: 'A home for the birds.' },
    coop: { name: 'Chicken coop', description: 'Brings chickens to your base.' },
    beehive: { name: 'Beehive', description: 'Buzzing with bees.' },
    well: { name: 'Well', description: 'An old stone well.' },
    barn: { name: 'Barn', description: 'Brings cows and sheep to your base.' },
    windmill: { name: 'Windmill', description: 'Its sails turn in the breeze.' },
    signpost: { name: 'Signpost', description: 'Points the way.' },
    tent: { name: 'Tent', description: 'A cosy camping tent.' },
    parasol: { name: 'Beach parasol', description: 'Shade for the sand.' },
    sandcastle: { name: 'Sandcastle', description: 'Best on sand.' },
    snowman: { name: 'Snowman', description: 'Best on snow.' },
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
    notRemovable: "Buildings can be moved but not removed",
    needsWeeks: 'Needs more weeks on target',
    noForge: 'Build a Forge first',
    noShield: 'No shields left',
    sameResource: 'Pick two different materials',
    needsBuilders: 'Not enough free builders. Level N needs N builders; the Lodge adds more.',
    needsCoins: 'Not enough coins yet',
    maxLand: 'Your land is as big as it gets',
    underConstruction: 'Already being built',
    needsBaseLevel: 'Unlocks at a higher base level',
    water: 'Needs water (paint some first)'
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
    'balanced-week': { name: 'Balanced Week', how: 'Train push, pull, legs and core in the same week.', proof: () => 'Push, pull, legs and core in one week' },
    'first-session': { name: 'Plan Complete', how: "Finish a whole day's plan.", proof: () => "First full day's plan" },
    'first-week': { name: 'On Target', how: 'Hit your weekly training target.', proof: () => 'First week on target' },
    'weeks-4': { name: '4 Weeks Strong', how: 'Hit your weekly target 4 weeks in a row.', proof: (v) => `${v} weeks on target in a row` },
    'weeks-12': { name: '12 Weeks Strong', how: 'Hit your weekly target 12 weeks in a row.', proof: (v) => `${v} weeks on target in a row` }
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
  patterns: { push: 'push', pull: 'pull', legs: 'leg', core: 'core', recovery: 'stretch' },
  today: {
    title: 'Today',
    training: (done, total) => `Today's plan: ${done} of ${total} sets`,
    rest: 'Rest day. Recovery counts, and your streak is safe.',
    sessionBonus: (amount) => `Finish today's plan: +${amount} of each material`,
    sessionDone: "Today's plan is done. Great work.",
    week: (done, target) => `This week: ${done} of ${target} training days`,
    weeklyStreak: (weeks) => (weeks === 1 ? '1 week on target in a row' : `${weeks} weeks on target in a row`),
    weeklyBonus: (amount) => `Hit your week: +${amount} of each`,
    weeklyDone: 'Weekly target hit.'
  },
  quests: {
    title: 'Quests',
    finishExercise: (name, sets) => `Finish all ${sets} sets of ${name}`,
    inRange: (name, min, max) => `Log a ${name} set of ${min}–${max} reps`,
    patternSets: (sets, pattern) => `Do ${sets} ${pattern} sets`,
    stretch: (sets) => `Do ${sets} stretches`,
    done: 'Done',
    moreSlots: 'Build or upgrade a Watchtower for more quests.',
    none: "Quests appear once today's workout loads."
  },
  roles: {
    hq: (weeksDone, weeksNeeded, next) =>
      `Level ${next} needs ${weeksNeeded} weeks on target. You have ${weeksDone}.`,
    hqMax: 'Your headquarters is fully upgraded.',
    watchtower: (slots) => `Spots daily quests from today's workout. Quest slots: ${slots}.`,
    lodge: (shields, capacity, builders) =>
      `Adds a builder per level (you have ${builders}), and stores streak shields for unplanned misses, earned by hitting your week. Shields: ${shields}/${capacity}.`,
    forge: (rate) => `Trades materials: ${rate} of one for 1 of another. Handy when an exercise isn't possible for you yet.`,
    spring: (level) =>
      `Stretches earn +${level} extra, and your first set after a rest day earns +${level * 2}.`,
    yard: (bonus) => `Shows today's workout as stations. Finishing the plan earns +${bonus} of each material.`
  },
  forge: { from: 'Give', to: 'Get', trade: (cost, out) => `Trade ${cost} for ${out}` },
  lodge: { useShield: (shields) => `Use a shield (${shields} left)` },
  yard: { stationsTitle: "Today's stations", restDay: 'Rest day: the yard is closed. Recovery counts.' },
  rewardExtra: {
    beyondPlan: "Beyond today's plan, so this set earns half. Rest is part of training too.",
    quest: (text) => `Quest done: ${text}`,
    session: "Today's plan complete: session bonus!",
    weekly: 'Weekly target hit: weekly bonus!',
    spring: (amount) => `Crystal Spring bonus: +${amount}`,
    shield: 'Your Lodge earned a streak shield.'
  },
  customize: {
    title: 'Customize',
    edit: 'Customize',
    style: 'Style',
    color: 'Colour',
    auto: 'Default',
    place: 'Choose a spot',
    save: 'Save'
  },
  styleNames: {
    stone: 'Stone', wood: 'Wood', tiles: 'Tiles', hedge: 'Hedge', fence: 'Fence',
    pine: 'Pine', oak: 'Oak', palm: 'Palm', cherry: 'Cherry blossom',
    classic: 'Classic', lantern: 'Lantern', neon: 'Neon',
    plain: 'Plain', stripe: 'Stripe', chevron: 'Chevron',
    wildflowers: 'Wildflowers', tulips: 'Tulips', roses: 'Roses', lavender: 'Lavender',
    tiered: 'Tiered', jet: 'Jet', marble: 'Marble',
    banners: 'Banners', plated: 'Plating', glow: 'Glow',
    round: 'Round', flowering: 'Flowering', boulder: 'Boulder', mossy: 'Mossy', flex: 'Flex', runner: 'Runner'
  },
  colorNames: {
    cyan: 'Cyan', lime: 'Lime', magenta: 'Magenta', amber: 'Amber', violet: 'Violet', red: 'Red', white: 'White'
  },
  builders: {
    status: (busy, total) => `Builders: ${busy} of ${total} busy`,
    chip: (free, total) => `Builders: ${free} of ${total} free`,
    needs: (builders) => (builders === 1 ? 'needs 1 builder' : `needs ${builders} builders`),
    jobs: 'In progress'
  },
  land: {
    button: 'Expand land',
    title: 'Expand your land',
    current: (side) => `Your land: ${side}×${side}`,
    next: (side) => `Next: ${side}×${side}`,
    cost: (coins) => `Costs ${coins} coins`,
    balance: (coins) => `You have ${coins} coins`,
    buy: (coins) => `Expand for ${coins} coins`,
    max: 'Your land is as big as it gets.',
    why: 'Land is paid with coins from your sets, and it is meant to take a while.'
  },
  coins: (amount) => `${amount} coins`,
  baseLevel: {
    level: (level) => `Base level ${level}`,
    titles: {
      campsite: 'Campsite', outpost: 'Outpost', hamlet: 'Hamlet', village: 'Village', town: 'Town',
      stronghold: 'Stronghold', citadel: 'Citadel', capital: 'Capital', legend: 'Legend'
    },
    progress: (score, next) => `${score} / ${next} points`,
    next: (title) => `Next: ${title}`,
    unlocks: (list) => `Unlocks ${list}`,
    max: 'Max base level. Your base is legendary.',
    levelUp: (title) => `Base level up! You're now a ${title}.`,
    how: 'Points come from buildings, upgrades, decorations, trophies and land.'
  },
  paint: {
    button: 'Paint',
    title: 'Paint the ground',
    hint: 'Pick a ground and drag across tiles. Painting is free.',
    done: 'Done',
    locked: (level) => `Base level ${level}`
  },
  terrainNames: { grass: 'Grass', meadow: 'Meadow', dirt: 'Dirt', sand: 'Sand', plaza: 'Plaza', water: 'Water', snow: 'Snow' },
  decorGroups: { nature: 'Nature', farm: 'Farm', fun: 'Fun', comfort: 'Comfort', lights: 'Lights', training: 'Training', paths: 'Paths & walls', water: 'Water' },
  sound: { title: 'Sounds', description: 'Soft chimes and light vibrations for taps and wins.', on: 'sounds on', off: 'sounds off' },
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',

  flip: 'Flip',
  trainingDays: {
    title: 'Training days per week',
    description: (days) =>
      `Plan ${days} training days. The other ${7 - days} are rest days, and they keep your streak alive. You can also tap Rest day on the Train tab up to twice a week.`
  },
  intro: {
    title: 'Welcome to your base',
    body: 'Every set you finish earns materials: upper-body sets earn stone, lower-body sets timber, and core sets crystal. Bigger sets earn more. Spend them on buildings, which finish as you train, and on decorations.',
    rule: "Trophies can't be bought. You earn them by training, then show them off here.",
    ok: "Let's build"
  }
};

const he: GameCopy = {
  tabs: { train: 'אימון', base: 'בסיס' },
  title: 'הבסיס שלך',
  hqLevel: (level) => `מפקדה שלב ${level}`,
  resources: { stone: 'אבן', timber: 'עץ', crystal: 'קריסטל' },
  resourceSource: {
    stone: 'מסטים של פלג גוף עליון',
    timber: 'מסטים של פלג גוף תחתון',
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
  buildTabs: { structures: 'מבנים', decor: 'קישוטים', trophies: 'גביעים' },
  placeHint: (name) => `הקש על משבצת מודגשת כדי למקם ${name}.`,
  moveHint: (name) => `הקש על משבצת מודגשת כדי להזיז ${name}.`,
  cancel: 'ביטול',
  close: 'סגירה',
  items: {
    hq: { name: 'מפקדה', description: 'הלב של הבסיס. שדרג אותה כדי לפתוח עוד שטח ומבנים חדשים.' },
    watchtower: { name: 'מגדל תצפית', description: 'מגדל אבן, נבנה בעיקר מסטים של דחיפה.' },
    lodge: { name: 'בקתה', description: 'בקתת עץ, נבנית בעיקר מסטים של משיכה.' },
    forge: { name: 'נפחייה', description: 'נפחייה מאבן ועץ.' },
    spring: { name: 'מעיין קריסטל', description: 'מעיין רגוע, נבנה בעיקר מסטים של ליבה.' },
    yard: { name: 'חצר אימונים', description: 'מגרש האימונים שלך. מציג את האימון של היום כתחנות.' },
    path: { name: 'שביל', description: 'ריצוף אבן שמחבר בין המבנים.' },
    wall: { name: 'חומה', description: 'חומת אבן נמוכה.' },
    pine: { name: 'עץ', description: 'בחר אורן, אלון, דקל או פריחת דובדבן.' },
    lamp: { name: 'פנס', description: 'נדלק בימים שבהם אתה מתאמן.' },
    banner: { name: 'דגל', description: 'הנף את הצבעים שלך.' },
    garden: { name: 'ערוגה', description: 'ערוגת פרחים קטנה.' },
    fountain: { name: 'מזרקה', description: 'מזרקת קריסטל לכיכר העיר.' },
    bush: { name: 'שיח', description: 'שיח עגול ועבות.' },
    rock: { name: 'סלע', description: 'סלע גדול, חלק או עם טחב.' },
    flowers: { name: 'כתם פרחים', description: 'פרחי בר בתוך הדשא.' },
    bench: { name: 'ספסל', description: 'מקום לנוח בין סטים.' },
    campfire: { name: 'מדורה', description: 'מתלקחת בערבי אימון.' },
    picnic: { name: 'שולחן פיקניק', description: 'עם מפה בצבע שלך.' },
    gazebo: { name: 'ביתן', description: 'ביתן פתוח לגינה.' },
    torch: { name: 'לפיד', description: 'לפיד מהבהב.' },
    lanterns: { name: 'שרשרת אורות', description: 'פנסים בין שני עמודים.' },
    arch: { name: 'קשת פרחים', description: 'קשת מכוסה פריחה.' },
    statue: { name: 'פסל גיבור', description: 'אלוף מאבן.' },
    plyobox: { name: 'קופסת קפיצה', description: 'לקפיצות ועליות.' },
    pullupbar: { name: 'מתקן מתח', description: 'כל פארק צריך אחד.' },
    dipbars: { name: 'מקבילים', description: 'מוטות מקבילים לשכיבות.' },
    punchbag: { name: 'שק אגרוף', description: 'לימי קרדיו.' },
    lilypad: { name: 'עלה נופר', description: 'מונח על מים.' },
    bridge: { name: 'גשר', description: 'מונח על מים.' },
    hay: { name: 'חבילת חציר', description: 'הפרות אוהבות אותה.' },
    barrels: { name: 'חביות', description: 'ערימת חביות עץ.' },
    pumpkins: { name: 'דלעות', description: 'ערוגת דלעות קטנה.' },
    birdhouse: { name: 'בית ציפורים', description: 'בית לציפורים.' },
    coop: { name: 'לול', description: 'מביא תרנגולות לבסיס שלך.' },
    beehive: { name: 'כוורת', description: 'מזמזמת בדבורים.' },
    well: { name: 'באר', description: 'באר אבן ישנה.' },
    barn: { name: 'אסם', description: 'מביא פרות וכבשים לבסיס שלך.' },
    windmill: { name: 'טחנת רוח', description: 'הכנפיים מסתובבות ברוח.' },
    signpost: { name: 'שלט הכוונה', description: 'מראה את הדרך.' },
    tent: { name: 'אוהל', description: 'אוהל קמפינג נעים.' },
    parasol: { name: 'שמשיית חוף', description: 'צל לחול.' },
    sandcastle: { name: 'ארמון חול', description: 'הכי טוב על חול.' },
    snowman: { name: 'איש שלג', description: 'הכי טוב על שלג.' },
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
    notRemovable: 'אפשר להזיז מבנים אבל לא להסיר אותם',
    needsWeeks: 'נדרשים עוד שבועות ביעד',
    noForge: 'בנה קודם נפחייה',
    noShield: 'לא נשארו מגינים',
    sameResource: 'בחר שני חומרים שונים',
    needsBuilders: 'אין מספיק בנאים פנויים. שלב N דורש N בנאים, והבקתה מוסיפה עוד.',
    needsCoins: 'עדיין אין מספיק מטבעות',
    maxLand: 'השטח שלך בגודל המקסימלי',
    underConstruction: 'כבר בבנייה',
    needsBaseLevel: 'נפתח ברמת בסיס גבוהה יותר',
    water: 'צריך מים (צבע קודם קצת)'
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
    'balanced-week': { name: 'שבוע מאוזן', how: 'התאמן דחיפה, משיכה, רגליים וליבה באותו שבוע.', proof: () => 'דחיפה, משיכה, רגליים וליבה בשבוע אחד' },
    'first-session': { name: 'תוכנית הושלמה', how: 'סיים תוכנית של יום שלם.', proof: () => 'התוכנית היומית המלאה הראשונה' },
    'first-week': { name: 'ביעד', how: 'עמוד ביעד האימונים השבועי.', proof: () => 'השבוע הראשון ביעד' },
    'weeks-4': { name: '4 שבועות חזקים', how: 'עמוד ביעד השבועי 4 שבועות ברצף.', proof: (v) => `${v} שבועות ביעד ברצף` },
    'weeks-12': { name: '12 שבועות חזקים', how: 'עמוד ביעד השבועי 12 שבועות ברצף.', proof: (v) => `${v} שבועות ביעד ברצף` }
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
  patterns: { push: 'דחיפה', pull: 'משיכה', legs: 'רגליים', core: 'ליבה', recovery: 'מתיחה' },
  today: {
    title: 'היום',
    training: (done, total) => `התוכנית של היום: ${done} מתוך ${total} סטים`,
    rest: 'יום מנוחה. גם התאוששות נחשבת, והרצף שלך מוגן.',
    sessionBonus: (amount) => `סיים את התוכנית של היום: ‎+${amount} מכל חומר`,
    sessionDone: 'התוכנית של היום הושלמה. עבודה מצוינת.',
    week: (done, target) => `השבוע: ${done} מתוך ${target} ימי אימון`,
    weeklyStreak: (weeks) => (weeks === 1 ? 'שבוע אחד ביעד ברצף' : `${weeks} שבועות ביעד ברצף`),
    weeklyBonus: (amount) => `עמוד ביעד השבועי: ‎+${amount} מכל חומר`,
    weeklyDone: 'היעד השבועי הושג.'
  },
  quests: {
    title: 'משימות',
    finishExercise: (name, sets) => `סיים את כל ${sets} הסטים של ${name}`,
    inRange: (name, min, max) => `רשום סט ${name} של ${min}–${max} חזרות`,
    patternSets: (sets, pattern) => `עשה ${sets} סטים של ${pattern}`,
    stretch: (sets) => `עשה ${sets} מתיחות`,
    done: 'בוצע',
    moreSlots: 'בנה או שדרג מגדל תצפית כדי לקבל עוד משימות.',
    none: 'המשימות יופיעו כשהאימון של היום ייטען.'
  },
  roles: {
    hq: (weeksDone, weeksNeeded, next) =>
      `שלב ${next} דורש ${weeksNeeded} שבועות ביעד. יש לך ${weeksDone}.`,
    hqMax: 'המפקדה שלך משודרגת במלואה.',
    watchtower: (slots) => `מאתר משימות יומיות מהאימון של היום. מקומות למשימות: ${slots}.`,
    lodge: (shields, capacity, builders) =>
      `מוסיפה בנאי בכל שלב (יש לך ${builders}), ושומרת מגיני רצף לימים שפספסת בלי תכנון. מקבלים אותם כשעומדים ביעד השבועי. מגינים: ${shields}/${capacity}.`,
    forge: (rate) => `מחליפה חומרים: ${rate} מסוג אחד תמורת 1 מסוג אחר. שימושי כשתרגיל מסוים עדיין לא אפשרי בשבילך.`,
    spring: (level) =>
      `מתיחות מזכות ב־${level} נוספים, והסט הראשון אחרי יום מנוחה מזכה ב־${level * 2} נוספים.`,
    yard: (bonus) => `מציג את האימון של היום כתחנות. סיום התוכנית מזכה ב־${bonus} מכל חומר.`
  },
  forge: { from: 'תן', to: 'קבל', trade: (cost, out) => `החלף ${cost} תמורת ${out}` },
  lodge: { useShield: (shields) => `השתמש במגן (נשארו ${shields})` },
  yard: { stationsTitle: 'התחנות של היום', restDay: 'יום מנוחה: החצר סגורה. גם התאוששות נחשבת.' },
  rewardExtra: {
    beyondPlan: 'מעבר לתוכנית של היום, אז הסט הזה מזכה בחצי. גם מנוחה היא חלק מהאימון.',
    quest: (text) => `משימה הושלמה: ${text}`,
    session: 'התוכנית של היום הושלמה: בונוס אימון!',
    weekly: 'היעד השבועי הושג: בונוס שבועי!',
    spring: (amount) => `בונוס מעיין הקריסטל: ‎+${amount}`,
    shield: 'הבקתה שלך קיבלה מגן רצף.'
  },
  customize: {
    title: 'התאמה אישית',
    edit: 'התאמה אישית',
    style: 'סגנון',
    color: 'צבע',
    auto: 'ברירת מחדל',
    place: 'בחר מקום',
    save: 'שמירה'
  },
  styleNames: {
    stone: 'אבן', wood: 'עץ', tiles: 'אריחים', hedge: 'גדר חיה', fence: 'גדר',
    pine: 'אורן', oak: 'אלון', palm: 'דקל', cherry: 'פריחת דובדבן',
    classic: 'קלאסי', lantern: 'עששית', neon: 'ניאון',
    plain: 'חלק', stripe: 'פס', chevron: 'שברון',
    wildflowers: 'פרחי בר', tulips: 'צבעונים', roses: 'ורדים', lavender: 'לבנדר',
    tiered: 'קומות', jet: 'סילון', marble: 'שיש',
    banners: 'דגלונים', plated: 'ציפוי מתכת', glow: 'זוהר',
    round: 'עגול', flowering: 'פורח', boulder: 'סלע', mossy: 'עם טחב', flex: 'כפיפה', runner: 'רץ'
  },
  colorNames: {
    cyan: 'טורקיז', lime: 'ליים', magenta: 'מג׳נטה', amber: 'ענבר', violet: 'סגול', red: 'אדום', white: 'לבן'
  },
  builders: {
    status: (busy, total) => `בנאים: ${busy} מתוך ${total} עסוקים`,
    chip: (free, total) => `בנאים: ${free} מתוך ${total} פנויים`,
    needs: (builders) => (builders === 1 ? 'דורש בנאי אחד' : `דורש ${builders} בנאים`),
    jobs: 'בתהליך'
  },
  land: {
    button: 'הרחבת שטח',
    title: 'הרחב את השטח שלך',
    current: (side) => `השטח שלך: ${side}×${side}`,
    next: (side) => `הבא: ${side}×${side}`,
    cost: (coins) => `עולה ${coins} מטבעות`,
    balance: (coins) => `יש לך ${coins} מטבעות`,
    buy: (coins) => `הרחב תמורת ${coins} מטבעות`,
    max: 'השטח שלך בגודל המקסימלי.',
    why: 'משלמים על שטח במטבעות מהסטים שלך, וזה אמור לקחת זמן.'
  },
  coins: (amount) => `${amount} מטבעות`,
  baseLevel: {
    level: (level) => `רמת בסיס ${level}`,
    titles: {
      campsite: 'מחנה', outpost: 'מוצב', hamlet: 'כפרון', village: 'כפר', town: 'עיירה',
      stronghold: 'מבצר', citadel: 'מצודה', capital: 'בירה', legend: 'אגדה'
    },
    progress: (score, next) => `${score} / ${next} נקודות`,
    next: (title) => `הבא: ${title}`,
    unlocks: (list) => `פותח ${list}`,
    max: 'רמת בסיס מקסימלית. הבסיס שלך אגדי.',
    levelUp: (title) => `עלית רמה! הבסיס שלך עכשיו ${title}.`,
    how: 'נקודות מגיעות ממבנים, שדרוגים, קישוטים, גביעים ושטח.'
  },
  paint: {
    button: 'צביעה',
    title: 'צביעת הקרקע',
    hint: 'בחר סוג קרקע וגרור על המשבצות. הצביעה בחינם.',
    done: 'סיום',
    locked: (level) => `רמת בסיס ${level}`
  },
  terrainNames: { grass: 'דשא', meadow: 'אחו', dirt: 'עפר', sand: 'חול', plaza: 'רחבה', water: 'מים', snow: 'שלג' },
  decorGroups: { nature: 'טבע', farm: 'חווה', fun: 'כיף', comfort: 'נוחות', lights: 'תאורה', training: 'אימון', paths: 'שבילים וחומות', water: 'מים' },
  sound: { title: 'צלילים', description: 'צלצולים רכים ורטט קל להקשות ולהצלחות.', on: 'צלילים פועלים', off: 'צלילים כבויים' },
  zoomIn: 'הגדלה',
  zoomOut: 'הקטנה',

  flip: 'היפוך',
  trainingDays: {
    title: 'ימי אימון בשבוע',
    description: (days) =>
      `תכנן ${days} ימי אימון. ${7 - days} הימים האחרים הם ימי מנוחה, והם שומרים על הרצף שלך. אפשר גם להקיש על יום מנוחה בלשונית האימון עד פעמיים בשבוע.`
  },
  intro: {
    title: 'ברוך הבא לבסיס שלך',
    body: 'כל סט שאתה מסיים מזכה בחומרים: פלג גוף עליון נותן אבן, פלג גוף תחתון עץ, וליבה קריסטל. סטים גדולים יותר מזכים ביותר. השתמש בהם כדי לבנות מבנים, שנגמרים ככל שאתה מתאמן, ולקנות קישוטים.',
    rule: 'אי אפשר לקנות גביעים. משיגים אותם באימונים, ומציגים אותם כאן.',
    ok: 'בוא נבנה'
  }
};

const ar: GameCopy = {
  tabs: { train: 'تدريب', base: 'القاعدة' },
  title: 'قاعدتك',
  hqLevel: (level) => `المقر مستوى ${level}`,
  resources: { stone: 'حجر', timber: 'خشب', crystal: 'كريستال' },
  resourceSource: {
    stone: 'من مجموعات الجزء العلوي',
    timber: 'من مجموعات الجزء السفلي',
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
  buildTabs: { structures: 'مبانٍ', decor: 'زينة', trophies: 'كؤوس' },
  placeHint: (name) => `اضغط على مربع مضيء لوضع ${name}.`,
  moveHint: (name) => `اضغط على مربع مضيء لنقل ${name}.`,
  cancel: 'إلغاء',
  close: 'إغلاق',
  items: {
    hq: { name: 'المقر', description: 'قلب قاعدتك. طوّره لتفتح أرضاً أكبر ومبانيَ جديدة.' },
    watchtower: { name: 'برج المراقبة', description: 'برج حجري، يُبنى غالباً من مجموعات الدفع.' },
    lodge: { name: 'الكوخ', description: 'كوخ خشبي، يُبنى غالباً من مجموعات السحب.' },
    forge: { name: 'الحدادة', description: 'ورشة حدادة من الحجر والخشب.' },
    spring: { name: 'نبع الكريستال', description: 'نبع هادئ، يُبنى غالباً من مجموعات الجذع.' },
    yard: { name: 'ساحة التدريب', description: 'ساحة تدريبك. تعرض تمرين اليوم كمحطات.' },
    path: { name: 'ممر', description: 'رصف حجري يربط بين مبانيك.' },
    wall: { name: 'سور', description: 'سور حجري منخفض.' },
    pine: { name: 'شجرة', description: 'اختر صنوبراً أو بلوطاً أو نخلة أو زهر الكرز.' },
    lamp: { name: 'مصباح', description: 'يضيء في الأيام التي تتدرب فيها.' },
    banner: { name: 'راية', description: 'ارفع ألوانك.' },
    garden: { name: 'حوض زهور', description: 'حوض صغير من الزهور.' },
    fountain: { name: 'نافورة', description: 'نافورة كريستال لساحة البلدة.' },
    bush: { name: 'شجيرة', description: 'شجيرة مستديرة كثيفة.' },
    rock: { name: 'صخرة', description: 'صخرة كبيرة، عادية أو مكسوة بالطحالب.' },
    flowers: { name: 'بقعة زهور', description: 'زهور برية وسط العشب.' },
    bench: { name: 'مقعد', description: 'مكان للراحة بين المجموعات.' },
    campfire: { name: 'نار المخيم', description: 'تشتعل في ليالي التدريب.' },
    picnic: { name: 'طاولة نزهة', description: 'بمفرش بلونك.' },
    gazebo: { name: 'عريشة', description: 'جناح مفتوح للحديقة.' },
    torch: { name: 'شعلة', description: 'شعلة متراقصة.' },
    lanterns: { name: 'أضواء معلقة', description: 'فوانيس بين عمودين.' },
    arch: { name: 'قوس زهور', description: 'قوس مغطى بالأزهار.' },
    statue: { name: 'تمثال البطل', description: 'بطل من حجر.' },
    plyobox: { name: 'صندوق القفز', description: 'للقفز والصعود.' },
    pullupbar: { name: 'عقلة', description: 'كل حديقة تحتاج واحدة.' },
    dipbars: { name: 'متوازي', description: 'قضبان متوازية للدفع.' },
    punchbag: { name: 'كيس ملاكمة', description: 'لأيام الكارديو.' },
    lilypad: { name: 'ورقة زنبق', description: 'توضع على الماء.' },
    bridge: { name: 'جسر', description: 'يوضع على الماء.' },
    hay: { name: 'بالة قش', description: 'الأبقار تحبها.' },
    barrels: { name: 'براميل', description: 'كومة من البراميل الخشبية.' },
    pumpkins: { name: 'قرع', description: 'حقل قرع صغير.' },
    birdhouse: { name: 'بيت طيور', description: 'بيت للطيور.' },
    coop: { name: 'قن الدجاج', description: 'يجلب الدجاج إلى قاعدتك.' },
    beehive: { name: 'خلية نحل', description: 'تطنّ بالنحل.' },
    well: { name: 'بئر', description: 'بئر حجري قديم.' },
    barn: { name: 'حظيرة', description: 'تجلب الأبقار والأغنام إلى قاعدتك.' },
    windmill: { name: 'طاحونة هواء', description: 'تدور أشرعتها مع النسيم.' },
    signpost: { name: 'لافتة إرشاد', description: 'تدلّ على الطريق.' },
    tent: { name: 'خيمة', description: 'خيمة تخييم مريحة.' },
    parasol: { name: 'مظلة شاطئ', description: 'ظل فوق الرمل.' },
    sandcastle: { name: 'قلعة رملية', description: 'أجمل على الرمل.' },
    snowman: { name: 'رجل الثلج', description: 'أجمل على الثلج.' },
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
    notRemovable: 'يمكن نقل المباني لكن لا يمكن إزالتها',
    needsWeeks: 'تحتاج إلى أسابيع أكثر على الهدف',
    noForge: 'ابنِ ورشة حدادة أولاً',
    noShield: 'لم يتبقَّ أي درع',
    sameResource: 'اختر مادتين مختلفتين',
    needsBuilders: 'لا يوجد بنّاؤون متاحون بما يكفي. المستوى N يحتاج N بنّائين، والكوخ يضيف المزيد.',
    needsCoins: 'لا توجد عملات كافية بعد',
    maxLand: 'أرضك في أكبر حجم ممكن',
    underConstruction: 'قيد البناء بالفعل',
    needsBaseLevel: 'يُفتح عند مستوى قاعدة أعلى',
    water: 'يحتاج إلى ماء (لوّن بعضه أولاً)'
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
    'balanced-week': { name: 'أسبوع متوازن', how: 'تدرّب دفعاً وسحباً وساقين وجذعاً في الأسبوع نفسه.', proof: () => 'دفع وسحب وساقان وجذع في أسبوع واحد' },
    'first-session': { name: 'اكتملت الخطة', how: 'أنهِ خطة يوم كامل.', proof: () => 'أول خطة يومية كاملة' },
    'first-week': { name: 'على الهدف', how: 'حقّق هدف التدريب الأسبوعي.', proof: () => 'أول أسبوع على الهدف' },
    'weeks-4': { name: '4 أسابيع قوية', how: 'حقّق هدفك الأسبوعي 4 أسابيع متتالية.', proof: (v) => `${v} أسابيع متتالية على الهدف` },
    'weeks-12': { name: '12 أسبوعاً قوياً', how: 'حقّق هدفك الأسبوعي 12 أسبوعاً متتالياً.', proof: (v) => `${v} أسبوعاً متتالياً على الهدف` }
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
  patterns: { push: 'الدفع', pull: 'السحب', legs: 'الساقين', core: 'الجذع', recovery: 'التمدد' },
  today: {
    title: 'اليوم',
    training: (done, total) => `خطة اليوم: ${done} من ${total} مجموعات`,
    rest: 'يوم راحة. التعافي يُحتسب، وسلسلتك في أمان.',
    sessionBonus: (amount) => `أنهِ خطة اليوم: ‎+${amount} من كل مادة`,
    sessionDone: 'اكتملت خطة اليوم. عمل رائع.',
    week: (done, target) => `هذا الأسبوع: ${done} من ${target} أيام تدريب`,
    weeklyStreak: (weeks) => (weeks === 1 ? 'أسبوع واحد على الهدف' : `${weeks} أسابيع متتالية على الهدف`),
    weeklyBonus: (amount) => `حقّق هدف أسبوعك: ‎+${amount} من كل مادة`,
    weeklyDone: 'تحقق الهدف الأسبوعي.'
  },
  quests: {
    title: 'المهام',
    finishExercise: (name, sets) => `أنهِ جميع مجموعات ${name} (${sets})`,
    inRange: (name, min, max) => `سجّل مجموعة ${name} من ${min} إلى ${max} تكراراً`,
    patternSets: (sets, pattern) => `أدِّ ${sets} مجموعات ${pattern}`,
    stretch: (sets) => `أدِّ ${sets} تمارين تمدد`,
    done: 'تم',
    moreSlots: 'ابنِ برج مراقبة أو طوّره للحصول على مهام أكثر.',
    none: 'ستظهر المهام عند تحميل تمرين اليوم.'
  },
  roles: {
    hq: (weeksDone, weeksNeeded, next) =>
      `المستوى ${next} يتطلب ${weeksNeeded} أسابيع على الهدف. لديك ${weeksDone}.`,
    hqMax: 'مقرك مطوّر بالكامل.',
    watchtower: (slots) => `يرصد مهاماً يومية من تمرين اليوم. خانات المهام: ${slots}.`,
    lodge: (shields, capacity, builders) =>
      `يضيف بنّاءً مع كل مستوى (لديك ${builders})، ويخزّن دروع السلسلة للأيام الفائتة غير المخطط لها، وتحصل عليها بتحقيق هدف الأسبوع. الدروع: ${shields}/${capacity}.`,
    forge: (rate) => `تبادل المواد: ${rate} من نوع مقابل 1 من نوع آخر. مفيد عندما لا يكون تمرين ما ممكناً لك بعد.`,
    spring: (level) =>
      `تمارين التمدد تمنح ${level} إضافية، وأول مجموعة بعد يوم راحة تمنح ${level * 2} إضافية.`,
    yard: (bonus) => `يعرض تمرين اليوم كمحطات. إنهاء الخطة يمنح ${bonus} من كل مادة.`
  },
  forge: { from: 'تعطي', to: 'تأخذ', trade: (cost, out) => `بادل ${cost} مقابل ${out}` },
  lodge: { useShield: (shields) => `استخدم درعاً (متبقٍ ${shields})` },
  yard: { stationsTitle: 'محطات اليوم', restDay: 'يوم راحة: الساحة مغلقة. التعافي يُحتسب.' },
  rewardExtra: {
    beyondPlan: 'هذه المجموعة خارج خطة اليوم، لذا تمنح النصف. الراحة جزء من التدريب أيضاً.',
    quest: (text) => `اكتملت مهمة: ${text}`,
    session: 'اكتملت خطة اليوم: مكافأة الجلسة!',
    weekly: 'تحقق الهدف الأسبوعي: مكافأة أسبوعية!',
    spring: (amount) => `مكافأة نبع الكريستال: ‎+${amount}`,
    shield: 'حصل كوخك على درع للسلسلة.'
  },
  customize: {
    title: 'تخصيص',
    edit: 'تخصيص',
    style: 'النمط',
    color: 'اللون',
    auto: 'افتراضي',
    place: 'اختر مكاناً',
    save: 'حفظ'
  },
  styleNames: {
    stone: 'حجر', wood: 'خشب', tiles: 'بلاط', hedge: 'سياج نباتي', fence: 'سياج',
    pine: 'صنوبر', oak: 'بلوط', palm: 'نخلة', cherry: 'زهر الكرز',
    classic: 'كلاسيكي', lantern: 'فانوس', neon: 'نيون',
    plain: 'سادة', stripe: 'خط', chevron: 'شيفرون',
    wildflowers: 'زهور برية', tulips: 'توليب', roses: 'ورود', lavender: 'لافندر',
    tiered: 'طبقات', jet: 'نافورة عالية', marble: 'رخام',
    banners: 'رايات', plated: 'تصفيح', glow: 'توهج',
    round: 'مستدير', flowering: 'مزهر', boulder: 'جلمود', mossy: 'بالطحالب', flex: 'استعراض', runner: 'عدّاء'
  },
  colorNames: {
    cyan: 'سماوي', lime: 'ليموني', magenta: 'أرجواني', amber: 'كهرماني', violet: 'بنفسجي', red: 'أحمر', white: 'أبيض'
  },
  builders: {
    status: (busy, total) => `البنّاؤون: ${busy} من ${total} مشغولون`,
    chip: (free, total) => `البنّاؤون: ${free} من ${total} متاحون`,
    needs: (builders) => (builders === 1 ? 'يحتاج بنّاءً واحداً' : `يحتاج ${builders} بنّائين`),
    jobs: 'قيد التنفيذ'
  },
  land: {
    button: 'توسيع الأرض',
    title: 'وسّع أرضك',
    current: (side) => `أرضك: ${side}×${side}`,
    next: (side) => `التالي: ${side}×${side}`,
    cost: (coins) => `التكلفة ${coins} عملة`,
    balance: (coins) => `لديك ${coins} عملة`,
    buy: (coins) => `وسّع مقابل ${coins} عملة`,
    max: 'أرضك في أكبر حجم ممكن.',
    why: 'تُدفع الأرض بالعملات من مجموعاتك، ومن المفترض أن يستغرق ذلك وقتاً.'
  },
  coins: (amount) => `${amount} عملة`,
  baseLevel: {
    level: (level) => `مستوى القاعدة ${level}`,
    titles: {
      campsite: 'مخيّم', outpost: 'مخفر', hamlet: 'نجع', village: 'قرية', town: 'بلدة',
      stronghold: 'معقل', citadel: 'قلعة', capital: 'عاصمة', legend: 'أسطورة'
    },
    progress: (score, next) => `${score} / ${next} نقطة`,
    next: (title) => `التالي: ${title}`,
    unlocks: (list) => `يفتح ${list}`,
    max: 'أعلى مستوى للقاعدة. قاعدتك أسطورية.',
    levelUp: (title) => `ارتفع مستوى قاعدتك! أصبحت ${title}.`,
    how: 'تأتي النقاط من المباني والتطويرات والزينة والكؤوس والأرض.'
  },
  paint: {
    button: 'تلوين',
    title: 'لوّن الأرض',
    hint: 'اختر نوع الأرض واسحب فوق المربعات. التلوين مجاني.',
    done: 'تم',
    locked: (level) => `مستوى القاعدة ${level}`
  },
  terrainNames: { grass: 'عشب', meadow: 'مرج', dirt: 'تراب', sand: 'رمل', plaza: 'ساحة', water: 'ماء', snow: 'ثلج' },
  decorGroups: { nature: 'طبيعة', farm: 'مزرعة', fun: 'مرح', comfort: 'راحة', lights: 'إضاءة', training: 'تدريب', paths: 'ممرات وأسوار', water: 'ماء' },
  sound: { title: 'الأصوات', description: 'نغمات ناعمة واهتزاز خفيف للنقرات والإنجازات.', on: 'الأصوات مفعّلة', off: 'الأصوات متوقفة' },
  zoomIn: 'تكبير',
  zoomOut: 'تصغير',

  flip: 'قلب',
  trainingDays: {
    title: 'أيام التدريب في الأسبوع',
    description: (days) =>
      `خطط لـ${days} أيام تدريب. الأيام الـ${7 - days} الأخرى أيام راحة، وهي تحافظ على سلسلتك. يمكنك أيضاً الضغط على يوم راحة في تبويب التدريب حتى مرتين في الأسبوع.`
  },
  intro: {
    title: 'مرحباً بك في قاعدتك',
    body: 'كل مجموعة تنهيها تمنحك مواد: الجزء العلوي يمنح حجراً، والجزء السفلي خشباً، والجذع كريستالاً. المجموعات الأكبر تمنح أكثر. استخدمها لبناء مبانٍ تكتمل كلما تدربت، ولشراء الزينة.',
    rule: 'لا يمكن شراء الكؤوس. تحصل عليها بالتدريب، ثم تعرضها هنا.',
    ok: 'لنبدأ البناء'
  }
};

export const gameContent: Record<Language, GameCopy> = { en, he, ar };
