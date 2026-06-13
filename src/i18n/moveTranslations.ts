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
    }
  },
  variants: {
    pushups: {
      name: 'Pushups',
      description: "Floor. Down. Up. Repeat until you can't."
    },
    'incline-pushups': {
      name: 'Incline Pushups',
      description: 'Hands on something higher. Great for building up.'
    },
    'diamond-pushups': {
      name: 'Diamond Pushups',
      description: 'Hands together. Super tricep workout.'
    },
    'superman-pulls': {
      name: 'Superman Pulls',
      description: 'Fly like Superman. Lift your chest off the floor.'
    },
    'inverted-floor-rows': {
      name: 'Inverted Floor Rows',
      description:
        'On your back, feet planted. Drive elbows into the floor and lift your upper back.'
    },
    'doorway-rows': {
      name: 'Doorway Rows',
      description:
        'Grab a sturdy door frame, lean back, and pull your chest toward it.'
    },
    squats: {
      name: 'Squats',
      description: 'Drop it low. Stand up. Keep going!'
    },
    lunges: {
      name: 'Lunges',
      description: 'Step forward. Give it your best. Step back.'
    },
    'glute-bridges': {
      name: 'Glute Bridges',
      description: 'Back on the floor. Drive hips up. Squeeze. Lower slowly.'
    },
    'jump-squats': {
      name: 'Jump Squats',
      description: 'Squat down and hop back up for extra power.'
    },
    'bulgarian-splits': {
      name: 'Bulgarian Splits',
      description: 'Back foot up. Go as low as you can.'
    },
    planks: {
      name: 'Planks',
      description: 'Hold steady and stay strong.'
    },
    crunches: {
      name: 'Crunches',
      description: 'Curl up like a little sit-up.'
    },
    'l-sit': {
      name: 'L-Sit',
      description: 'Legs out. Hands down. Hold steady.'
    },
    'side-planks': {
      name: 'Side Planks',
      description: 'Hold on your side. Double the challenge.'
    },
    'leg-raises': {
      name: 'Leg Raises',
      description: 'Legs up. Feel those core muscles work.'
    },
    'hollow-body': {
      name: 'Hollow Body Hold',
      description: 'Banana shape. Hold it strong.'
    }
  },
  displayGroups: {
    upperPush: 'upperbody push',
    upperPull: 'upperbody pull',
    lowerbody: 'lowerbody',
    core: 'core'
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
    }
  },
  variants: {
    pushups: {
      name: 'שכיבות סמיכה',
      description: 'רצפה. למטה. למעלה. חזור על זה עד שאי אפשר יותר.'
    },
    'incline-pushups': {
      name: 'שכיבות סמיכה בשיפוע',
      description: 'ידיים על משהו גבוה יותר. מעולה לבניית כוח.'
    },
    'diamond-pushups': {
      name: 'שכיבות סמיכה יהלום',
      description: 'ידיים ביחד. אימון מעולה לתלת־ראשי.'
    },
    'superman-pulls': {
      name: 'משיכות סופרמן',
      description: 'עוף כמו סופרמן. הרם את החזה מהרצפה.'
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
    squats: {
      name: 'סקוואט',
      description: 'רד נמוך. קום. המשך כך!'
    },
    lunges: {
      name: 'לאנג׳ים',
      description: 'צעד קדימה. תן את המיטב שלך. צעד אחורה.'
    },
    'glute-bridges': {
      name: 'גשר ישבן',
      description: 'גב על הרצפה. הרם אגן. כווץ. הורד לאט.'
    },
    'jump-squats': {
      name: 'סקוואט עם קפיצה',
      description: 'רד לסקוואט וקפוץ חזרה למעלה לאימון עם עוצמה.'
    },
    'bulgarian-splits': {
      name: 'ספליט בולגרי',
      description: 'רגל אחורה למעלה. רד כמה שאתה יכול.'
    },
    planks: {
      name: 'פלאנק',
      description: 'החזק יציב והישאר חזק.'
    },
    crunches: {
      name: 'כפיפות בטן',
      description: 'התגלגל כמו כפיפת בטן קטנה.'
    },
    'l-sit': {
      name: 'ישיבת L',
      description: 'רגליים החוצה. ידיים למטה. החזק יציב.'
    },
    'side-planks': {
      name: 'פלאנק צדדי',
      description: 'החזק מהצד. אתגר כפול.'
    },
    'leg-raises': {
      name: 'הרמת רגליים',
      description: 'רגליים למעלה. הרגש את שרירי הליבה עובדים.'
    },
    'hollow-body': {
      name: 'החזקת גוף חלול',
      description: 'צורת בננה. החזק חזק.'
    }
  },
  displayGroups: {
    upperPush: 'דחיפה פלג עליון',
    upperPull: 'משיכה פלג עליון',
    lowerbody: 'פלג תחתון',
    core: 'ליבה'
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
    }
  },
  variants: {
    pushups: {
      name: 'تمارين الضغط',
      description: 'الأرض. للأسفل. للأعلى. كرّر حتى لا تستطيع المزيد.'
    },
    'incline-pushups': {
      name: 'ضغط مائل',
      description: 'اليدان على شيء أعلى. رائع لبناء القوة.'
    },
    'diamond-pushups': {
      name: 'ضغط الماسة',
      description: 'اليدان معاً. تمرين رائع للعضلة ثلاثية الرؤوس.'
    },
    'superman-pulls': {
      name: 'سحب سوبرمان',
      description: 'اطر مثل سوبرمان. ارفع صدرك عن الأرض.'
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
    squats: {
      name: 'القرفصاء',
      description: 'انزل منخفضاً. قف. واصل!'
    },
    lunges: {
      name: 'الاندفاع',
      description: 'خطوة للأمام. أعطِ أفضل ما لديك. خطوة للخلف.'
    },
    'glute-bridges': {
      name: 'جسر الأرداف',
      description: 'ظهرك على الأرض. ارفع الوركين. اضغط. انزل ببطء.'
    },
    'jump-squats': {
      name: 'قرفصاء مع قفز',
      description: 'انزل للقرفصاء واقفز للأعلى لقوة إضافية.'
    },
    'bulgarian-splits': {
      name: 'الانقسام البلغاري',
      description: 'القدم الخلفية للأعلى. انزل بقدر ما تستطيع.'
    },
    planks: {
      name: 'البلانك',
      description: 'اثبت بثبات وابقَ قوياً.'
    },
    crunches: {
      name: 'تمارين البطن',
      description: 'انحنِ للأعلى مثل جلستك الصغيرة.'
    },
    'l-sit': {
      name: 'جلسة L',
      description: 'الساقان للخارج. اليدان للأسفل. اثبت بثبات.'
    },
    'side-planks': {
      name: 'بلانك جانبي',
      description: 'اثبت على جانبك. تحدٍّ مضاعف.'
    },
    'leg-raises': {
      name: 'رفع الساقين',
      description: 'الساقان للأعلى. اشعر بعضلات الجذع تعمل.'
    },
    'hollow-body': {
      name: 'تثبيت الجسم المجوف',
      description: 'شكل موزة. اثبت بقوة.'
    }
  },
  displayGroups: {
    upperPush: 'دفع الجزء العلوي',
    upperPull: 'سحب الجزء العلوي',
    lowerbody: 'الجزء السفلي',
    core: 'الجذع'
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
