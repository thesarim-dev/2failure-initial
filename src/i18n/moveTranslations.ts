import type { Language, MovesTranslations } from './types';

const en: MovesTranslations = {
  categories: {
    upper: {
      name: 'Upper Body',
      muscleGroup: 'upper body',
      equipHint: 'Equip 1 Push + 1 Pull for balanced upper body work.'
    },
    lower: {
      name: 'Lower Body',
      muscleGroup: 'lower body',
      equipHint: 'Equip 2 lower body exercises for your daily lineup.'
    },
    core: {
      name: 'Core',
      muscleGroup: 'core',
      equipHint: 'Equip 2 core exercises for your daily lineup.'
    },
    recovery: {
      name: 'Recovery',
      muscleGroup: 'recovery',
      equipHint: 'Deep stretching on rest days — no lifting.'
    }
  },
  variants: {
    pushups: {
      name: 'Pushups',
      description: 'Work up to 100 total reps across sets on push day.'
    },
    'incline-pushups': {
      name: 'Incline Pushups',
      description: 'Push up with your hands elevated on a bench or step.'
    },
    'diamond-pushups': {
      name: 'Diamond Pushups',
      description: 'Hands together. Super tricep workout.'
    },
    'superman-pulls': {
      name: 'Superman Pulls',
      description: 'Lift your chest off the floor like Superman flying.'
    },
    'inverted-floor-rows': {
      name: 'Inverted Floor Rows',
      description: 'Row from the floor on your back with your feet planted.'
    },
    'doorway-rows': {
      name: 'Doorway Rows',
      description: 'Row your chest to a sturdy door frame while leaning back.'
    },
    'dumbbell-shoulder-press': {
      name: 'Dumbbell Shoulder Press',
      description:
        'Press both dumbbells overhead. Stop when your shoulders give out.'
    },
    'dumbbell-row': {
      name: 'Dumbbell Row',
      description:
        'Hinge at the hips. Pull each dumbbell to your hip. Full stretch, full squeeze.'
    },
    'barbell-bench-press': {
      name: 'Barbell Bench Press',
      description: 'Heavy 3x5 with the bar touching your chest each rep.'
    },
    dips: {
      name: 'Dips',
      description: 'Deep dip on bars or benches, then press up.'
    },
    'pull-ups': {
      name: 'Pull-Ups',
      description: 'Hang from a bar and pull until your chin clears it.'
    },
    squats: {
      name: 'Squats',
      description: 'Bodyweight air squats with a deep drop and steady pace.'
    },
    lunges: {
      name: 'Lunges',
      description: 'Step forward into a deep lunge, then return to standing.'
    },
    'glute-bridges': {
      name: 'Glute Bridges',
      description: 'Drive hips up from the floor, squeeze glutes, and lower slowly.'
    },
    'jump-squats': {
      name: 'Jump Squats',
      description: 'Squat down and hop back up for extra power.'
    },
    'bulgarian-splits': {
      name: 'Bulgarian Splits',
      description: 'Rear foot elevated, squat as deep as you can with control.'
    },
    'barbell-deadlift': {
      name: 'Barbell Deadlift',
      description: 'Hinge and lift the bar, then lower with control each rep.'
    },
    'barbell-squat': {
      name: 'Barbell Squat',
      description: 'Heavy 3x5 squat breaking parallel each rep.'
    },
    burpees: {
      name: 'Burpees',
      description: 'Drop to the floor, kick back, and hop up in one crisp motion.'
    },
    planks: {
      name: 'Planks',
      description: 'Hold 60–90 seconds with glutes and core braced tight.'
    },
    crunches: {
      name: 'Crunches',
      description: 'Curl up like a little sit-up.'
    },
    'l-sit': {
      name: 'L-Sit',
      description: 'Max hold with legs locked out and hips lifted off the floor.'
    },
    'side-planks': {
      name: 'Side Planks',
      description: 'Hold a strong plank on your side.'
    },
    'leg-raises': {
      name: 'Leg Raises',
      description: 'Raise your legs slow and lower with control.'
    },
    'hollow-body': {
      name: 'Hollow Body Hold',
      description: 'Hold a tight banana-shaped hollow body position.'
    },
    'cobra-stretch': {
      name: 'Cobra Stretch',
      description: 'Hold 45 seconds to open the chest and abdominal wall.'
    },
    'childs-pose': {
      name: "Child's Pose",
      description: 'Hold 60 seconds to decompress the lower back and shoulders.'
    },
    'couch-stretch': {
      name: 'Couch Stretch',
      description: 'Hold 60 seconds per side to open hips and quads.'
    },
    'seated-hamstring-stretch': {
      name: 'Seated Hamstring Stretch',
      description: 'Hold 45 seconds per leg for hamstring length and squat depth.'
    }
  },
  displayGroups: {
    upperPush: 'upperbody push',
    upperPull: 'upperbody pull',
    lowerbody: 'lowerbody',
    core: 'core',
    recovery: 'stretching'
  },
  muscleGroups: {
    fullBody: 'full body'
  },
  buttonLabels: [
    "I'M DONE",
    "CAN'T DO MORE",
    'ALL TIRED OUT',
    'NEED A BREAK',
    'FINISH SET'
  ],
  poseAiHints: {
    pushups: 'Prop your phone to your side. Full pushup depth counts.',
    squats: 'Prop your phone to your side. Full squat depth counts.',
    lunges: 'Prop your phone to your side. Deep lunge on each rep counts.'
  }
};

const he: MovesTranslations = {
  categories: {
    upper: {
      name: 'פלג גוף עליון',
      muscleGroup: 'פלג גוף עליון',
      equipHint: 'צייד תרגיל דחיפה אחד + משיכה אחת לעבודת פלג גוף עליון מאוזנת.'
    },
    lower: {
      name: 'פלג גוף תחתון',
      muscleGroup: 'פלג גוף תחתון',
      equipHint: 'צייד 2 תרגילי פלג גוף תחתון לליינאפ היומי שלך.'
    },
    core: {
      name: 'ליבה',
      muscleGroup: 'ליבה',
      equipHint: 'צייד 2 תרגילי ליבה לליינאפ היומי שלך.'
    },
    recovery: {
      name: 'התאוששות',
      muscleGroup: 'התאוששות',
      equipHint: 'מתיחות עמוקות בימי מנוחה — בלי הרמות.'
    }
  },
  variants: {
    pushups: {
      name: 'שכיבות סמיכה',
      description: 'השלם עד 100 חזרות סה״כ בכל הסטים ביום דחיפה.'
    },
    'incline-pushups': {
      name: 'שכיבות סמיכה בשיפוע',
      description: 'דחיפות עם הידיים גבוהות על ספסל או מדרגה.'
    },
    'diamond-pushups': {
      name: 'שכיבות סמיכה יהלום',
      description: 'ידיים ביחד. אימון מעולה לתלת־ראשי.'
    },
    'superman-pulls': {
      name: 'משיכות סופרמן',
      description: 'הרם את החזה מהרצפה כמו סופרמן עף.'
    },
    'inverted-floor-rows': {
      name: 'חתירות רצפה הפוכות',
      description:
        'על הגב, רגליים נשענות. דחף מרפקים לרצפה והרם את החלק העליון של הגב.'
    },
    'doorway-rows': {
      name: 'חתירות במשקוף',
      description: 'תפוס משקוף דלת יציב, התחיל לאחור ומשוך את החזה אליו.'
    },
    'dumbbell-shoulder-press': {
      name: 'לחיצת כתפיים במשקולות',
      description: 'לחץ שתי משקולות מעל הראש. עצור כשהכתפיים נכנעות.'
    },
    'dumbbell-row': {
      name: 'חתירה במשקולת',
      description: 'התכופף מהמותניים. משוך כל משקולת לירך. מתיחה מלאה, כיווץ מלא.'
    },
    'barbell-bench-press': {
      name: 'לחיצת חזה במוט',
      description: '3x5 כבד. המוט לחזה, דחוף למעלה, שלוט בירידה.'
    },
    dips: {
      name: 'מקבילים',
      description: 'רד עמוק במקבילים או על ספסלים, ואז דחוף חזרה.'
    },
    'pull-ups': {
      name: 'מתח',
      description: 'תלה ממוט ומשוך עד שהסנטר עובר את המוט.'
    },
    squats: {
      name: 'סקוואט',
      description: 'סקוואט באוויר. רד נמוך, קום, שמור על קצב.'
    },
    lunges: {
      name: 'לאנג׳ים',
      description: 'צעד קדימה ללאנג׳ עמוק, ואז חזור לעמידה.'
    },
    'glute-bridges': {
      name: 'גשר ישבן',
      description: 'הרם אגן מהרצפה, כווץ ישבן, והורד לאט.'
    },
    'jump-squats': {
      name: 'סקוואט עם קפיצה',
      description: 'רד לסקוואט וקפוץ חזרה למעלה לאימון עם עוצמה.'
    },
    'bulgarian-splits': {
      name: 'ספליט בולגרי',
      description: 'רגל אחורה מורמת, רד עמוק ככל שאתה יכול בשליטה.'
    },
    'barbell-deadlift': {
      name: 'דדליפט במוט',
      description: 'אחוז במוט. התכופף, קום זקוף, כווץ. הורד בשליטה עד כשלון.'
    },
    'barbell-squat': {
      name: 'סקוואט במוט',
      description: '3x5 כבד. עומק מלא, דחוף דרך אמצע כף הרגל, קום זקוף.'
    },
    burpees: {
      name: 'בורפי',
      description: 'רד, בעיטה לאחור, קפיצה. שמור על קצב לאורך הסבב.'
    },
    planks: {
      name: 'פלאנק',
      description: 'החזקה 60–90 שניות. כווץ ליבה וישבן. אל תתן לאגן לשקוע.'
    },
    crunches: {
      name: 'כפיפות בטן',
      description: 'התגלגל כמו כפיפת בטן קטנה.'
    },
    'l-sit': {
      name: 'ישיבת L',
      description: 'החזקה מקסימלית. לחץ שכמה למטה, נעל רגליים, הרם מהרצפה.'
    },
    'side-planks': {
      name: 'פלאנק צדדי',
      description: 'החזק פלאנק חזק מהצד.'
    },
    'leg-raises': {
      name: 'הרמת רגליים',
      description: 'סיום סבב ליבה. הרם רגליים לאט, הורד בשליטה.'
    },
    'hollow-body': {
      name: 'החזקת גוף חלול',
      description: 'החזק תנוחת גוף חלול בצורת בננה הדוקה.'
    },
    'cobra-stretch': {
      name: 'מתיחת קוברה',
      description: 'החזק 45 שניות לפתיחת החזה ודופן הבטן.'
    },
    'childs-pose': {
      name: 'תנוחת ילד',
      description: 'החזק 60 שניות לשחרור הגב התחתון והכתפיים.'
    },
    'couch-stretch': {
      name: 'מתיחת ספה',
      description: 'החזק 60 שניות לכל צד לפתיחת ירכיים וארבע ראשי.'
    },
    'seated-hamstring-stretch': {
      name: 'מתיחת המסטרינג בישיבה',
      description: 'החזק 45 שניות לכל רגל לאורך המסטרינג ועומק סקוואט.'
    }
  },
  displayGroups: {
    upperPush: 'דחיפה פלג עליון',
    upperPull: 'משיכה פלג עליון',
    lowerbody: 'פלג תחתון',
    core: 'ליבה',
    recovery: 'מתיחות'
  },
  muscleGroups: {
    fullBody: 'גוף מלא'
  },
  buttonLabels: [
    'סיימתי',
    'לא יכול עוד',
    'עייף לגמרי',
    'צריך הפסקה',
    'סיים סט'
  ],
  poseAiHints: {
    pushups:
      'הצמד את הטלפון לצד. עומק מלא בשכיבת סמיכה נספר.',
    squats: 'הצמד את הטלפון לצד. עומק מלא בסקוואט נספר.',
    lunges: 'הצמד את הטלפון לצד. לאנג׳ עמוק בכל חזרה נספר.'
  }
};

const ar: MovesTranslations = {
  categories: {
    upper: {
      name: 'الجزء العلوي',
      muscleGroup: 'الجزء العلوي',
      equipHint: 'جهّز تمرين دفع واحد + سحب واحد لعمل متوازن للجزء العلوي.'
    },
    lower: {
      name: 'الجزء السفلي',
      muscleGroup: 'الجزء السفلي',
      equipHint: 'جهّز تمرينين للجزء السفلي في برنامجك اليومي.'
    },
    core: {
      name: 'الجذع',
      muscleGroup: 'الجذع',
      equipHint: 'جهّز تمرينين للجذع في برنامجك اليومي.'
    },
    recovery: {
      name: 'تعافٍ',
      muscleGroup: 'تعافٍ',
      equipHint: 'تمدد عميق في أيام الراحة — بلا رفع.'
    }
  },
  variants: {
    pushups: {
      name: 'تمارين الضغط',
      description: 'اجمع حتى 100 تكراراً إجمالياً عبر المجموعات في يوم الدفع.'
    },
    'incline-pushups': {
      name: 'ضغط مائل',
      description: 'ضغط مع رفع اليدين على مقعد أو درجة.'
    },
    'diamond-pushups': {
      name: 'ضغط الماسة',
      description: 'اليدان معاً. تمرين رائع للعضلة ثلاثية الرؤوس.'
    },
    'superman-pulls': {
      name: 'سحب سوبرمان',
      description: 'ارفع صدرك عن الأرض كأنك سوبرمان يطير.'
    },
    'inverted-floor-rows': {
      name: 'تجديف أرضي معكوس',
      description:
        'على ظهرك، قدمان ثابتتان. ادفع المرفقين للأرض وارفع الجزء العلوي من ظهرك.'
    },
    'doorway-rows': {
      name: 'تجديف بإطار الباب',
      description: 'أمسك إطار باب متين، انحنِ للخلف واسحب صدرك نحوه.'
    },
    'dumbbell-shoulder-press': {
      name: 'ضغط كتف بالدمبل',
      description: 'ادفع الدمبلين فوق الرأس. توقف عندما تستسلم الكتفان.'
    },
    'dumbbell-row': {
      name: 'تجديف بالدمبل',
      description: 'انحنِ من الوركين. اسحب كل دمبل إلى الورك. تمدد كامل وانقباض كامل.'
    },
    'barbell-bench-press': {
      name: 'ضغط صدر بالبار',
      description: '3x5 ثقيل. البار إلى الصدر، ادفع للأعلى، تحكم في النزول.'
    },
    dips: {
      name: 'البار الموازي',
      description: 'انزل بعمق على البار أو مقعدين، ثم ادفع للأعلى.'
    },
    'pull-ups': {
      name: 'العقلة',
      description: 'تعلق من الموت واسحب حتى يتجاوز ذقنك العارضة.'
    },
    squats: {
      name: 'القرفصاء',
      description: 'قرفصاء بالوزن. انزل منخفضاً، قف، حافظ على الإيقاع.'
    },
    lunges: {
      name: 'الاندفاع',
      description: 'خطوة للأمام في اندفاع عميق، ثم عد للوقوف.'
    },
    'glute-bridges': {
      name: 'جسر الأرداف',
      description: 'ارفع الوركين من الأرض، اضغط الأرداف، وانزل ببطء.'
    },
    'jump-squats': {
      name: 'قرفصاء مع قفز',
      description: 'انزل للقرفصاء واقفز للأعلى لقوة إضافية.'
    },
    'bulgarian-splits': {
      name: 'الانقسام البلغاري',
      description: 'القدم الخلفية مرتفعة، انزل بعمق بقدر ما تستطيع.'
    },
    'barbell-deadlift': {
      name: 'رفعة ميتة بالبار',
      description: 'أمسك البار. انحنِ، قف منتصباً، اضغط. انزل بتحكم حتى الفشل.'
    },
    'barbell-squat': {
      name: 'قرفصاء بالبار',
      description: '3x5 ثقيل. عمق كامل، ادفع عبر منتصف القدم، قف منتصباً.'
    },
    burpees: {
      name: 'البربي',
      description: 'انزل، اركل للخلف، اقفز. حافظ على حدة الحركة طوال السباق.'
    },
    planks: {
      name: 'البلانك',
      description: 'ثبات 60–90 ثانية. شد الجذع والأرداف. لا تدع الورك يسقط.'
    },
    crunches: {
      name: 'تمارين البطن',
      description: 'انحنِ للأعلى مثل جلستك الصغيرة.'
    },
    'l-sit': {
      name: 'جلسة L',
      description: 'أقصى ثبات. اضغط الكتف للأسفل، ثبّت الساقين، ارفع عن الأرض.'
    },
    'side-planks': {
      name: 'بلانك جانبي',
      description: 'اثبت في بلانك قوي على جانبك.'
    },
    'leg-raises': {
      name: 'رفع الساقين',
      description: 'ختام سباق الجذع. ارفع الساقين ببطء، انزل بتحكم.'
    },
    'hollow-body': {
      name: 'تثبيت الجسم المجوف',
      description: 'اثبت في وضعية جسم مجوف بشكل موزة محكم.'
    },
    'cobra-stretch': {
      name: 'تمدد الكوبرا',
      description: 'اثبت 45 ثانية لفتح الصدر وجدار البطن.'
    },
    'childs-pose': {
      name: 'وضعية الطفل',
      description: 'اثبت 60 ثانية لتخفيف الضغط عن أسفل الظهر والكتفين.'
    },
    'couch-stretch': {
      name: 'تمدد الأريكة',
      description: 'اثبت 60 ثانية لكل جانب لفتح الوركين والفخذين.'
    },
    'seated-hamstring-stretch': {
      name: 'تمدد أوتار الركبة جالساً',
      description: 'اثبت 45 ثانية لكل ساق لطول أوتار الركبة وعمق القرفصاء.'
    }
  },
  displayGroups: {
    upperPush: 'دفع الجزء العلوي',
    upperPull: 'سحب الجزء العلوي',
    lowerbody: 'الجزء السفلي',
    core: 'الجذع',
    recovery: 'تمدد'
  },
  muscleGroups: {
    fullBody: 'الجسم كاملاً'
  },
  buttonLabels: [
    'انتهيت',
    'لا أستطيع المزيد',
    'تعبت تماماً',
    'أحتاج استراحة',
    'إنهاء المجموعة'
  ],
  poseAiHints: {
    pushups: 'ضع هاتفك على الجانب. عمق الضغط الكامل يُحسب.',
    squats: 'ضع هاتفك على الجانب. عمق القرفصاء الكامل يُحسب.',
    lunges: 'ضع هاتفك على الجانب. اندفاع عميق في كل تكرار يُحسب.'
  }
};

export const moveTranslations: Record<Language, MovesTranslations> = {
  en,
  he,
  ar
};
