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
    'incline-pushups': {
      name: 'Incline Pushups',
      description: 'Hands on a bench, wall or step. The easiest way into pushups.'
    },
    pushups: {
      name: 'Pushups',
      description: 'Work up to 100 total reps across sets on push day.'
    },
    'pike-pushups': {
      name: 'Pike Pushups',
      description: 'Hips high, lower your head between your hands. Builds strong shoulders.'
    },
    'diamond-pushups': {
      name: 'Diamond Pushups',
      description: 'Hands together under your chest. Hits triceps and inner chest hard.'
    },
    dips: {
      name: 'Dips',
      description: 'On park dip bars or two sturdy chairs. Lower until your shoulders pass your elbows.'
    },
    'backpack-pushups': {
      name: 'Backpack Pushups',
      description: 'Pushups wearing a loaded backpack. Add books or water bottles as you get stronger.'
    },
    'archer-pushups': {
      name: 'Archer Pushups',
      description: 'Wide hands, shift onto one arm while the other stays straight. Alternate sides.'
    },
    'superman-pulls': {
      name: 'Superman Pulls',
      description: 'Face down, lift your chest and pull your elbows to your hips.'
    },
    'doorway-rows': {
      name: 'Doorway Rows',
      description: 'Grip a sturdy door frame, lean back, and pull your chest to it.'
    },
    'inverted-floor-rows': {
      name: 'Inverted Floor Rows',
      description: 'On your back, feet planted. Drive your elbows down to lift your upper back.'
    },
    'inverted-rows': {
      name: 'Inverted Rows',
      description: 'Hang under a low park bar, body straight, and pull your chest to it. Walk your feet in to make it easier.'
    },
    'negative-pull-ups': {
      name: 'Negative Pull-Ups',
      description: 'Jump to the top of the bar, then lower yourself slowly over 3–5 seconds. The fastest way to your first pull-up.'
    },
    'chin-ups': {
      name: 'Chin-Ups',
      description: 'Palms facing you, pull until your chin clears the bar. A little easier than pull-ups.'
    },
    'pull-ups': {
      name: 'Pull-Ups',
      description: 'Palms facing away, dead hang to chin over the bar. No kipping.'
    },
    'backpack-pull-ups': {
      name: 'Backpack Pull-Ups',
      description: 'Pull-ups wearing a loaded backpack, straps tight. Start light and add a little each week.'
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
    'step-ups': {
      name: 'Step-Ups',
      description: 'Step onto a park bench or stair and drive up through the front heel.'
    },
    'single-leg-bridges': {
      name: 'Single-Leg Bridges',
      description: 'Glute bridge on one leg, other knee pulled in. Switch sides each set.'
    },
    'jump-squats': {
      name: 'Jump Squats',
      description: 'Squat down and jump as high as you can. Land soft.'
    },
    burpees: {
      name: 'Burpees',
      description: 'Drop to the floor, kick back, and hop up in one crisp motion.'
    },
    'bulgarian-splits': {
      name: 'Bulgarian Splits',
      description: 'Rear foot on a bench, squat as deep as you can with control.'
    },
    'calf-raises': {
      name: 'Calf Raises',
      description: 'Rise onto the balls of your feet as high as you can, pause, and lower slowly. Use one leg when it gets easy.'
    },
    'bench-press': {
      name: 'Bench Press',
      description: 'Lie on a bench and press a barbell from your chest to straight arms. Start light, add weight as you get stronger.'
    },
    'goblet-squats': {
      name: 'Goblet Squats',
      description: 'Hold one dumbbell at your chest and squat deep with your chest up. Go heavier as you get stronger.'
    },
    'backpack-squats': {
      name: 'Backpack Squats',
      description: 'Squats wearing a loaded backpack (or hugging it to your chest).'
    },
    'pistol-squats': {
      name: 'Pistol Squats',
      description: 'One-leg squat all the way down. Hold a pole or post until you own the balance.'
    },
    planks: {
      name: 'Planks',
      description: 'Hold 60–90 seconds with glutes and core braced tight.'
    },
    crunches: {
      name: 'Crunches',
      description: 'Curl up like a little sit-up.'
    },
    'side-planks': {
      name: 'Side Planks',
      description: 'Hold a strong plank on your side. Both sides count as one set.'
    },
    'leg-raises': {
      name: 'Leg Raises',
      description: 'On your back, raise straight legs slowly and lower with control.'
    },
    'hollow-body': {
      name: 'Hollow Body Hold',
      description: 'Hold a tight banana-shaped hollow body position.'
    },
    'hanging-knee-raises': {
      name: 'Hanging Knee Raises',
      description: 'Hang from a park bar and pull your knees to your chest without swinging.'
    },
    'l-sit': {
      name: 'L-Sit',
      description: 'On dip bars or the floor, legs locked out and hips lifted. Max hold.'
    },
    'hanging-leg-raises': {
      name: 'Hanging Leg Raises',
      description: 'Hang from a bar and lift straight legs to hip height or higher.'
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
    'incline-pushups': {
      name: 'שכיבות סמיכה בשיפוע',
      description: 'ידיים על ספסל, קיר או מדרגה. הדרך הקלה ביותר להתחיל שכיבות סמיכה.'
    },
    pushups: {
      name: 'שכיבות סמיכה',
      description: 'השלם עד 100 חזרות סה״כ בכל הסטים ביום דחיפה.'
    },
    'pike-pushups': {
      name: 'שכיבות סמיכה פייק',
      description: 'אגן גבוה, הורד את הראש בין הידיים. בונה כתפיים חזקות.'
    },
    'diamond-pushups': {
      name: 'שכיבות סמיכה יהלום',
      description: 'ידיים צמודות מתחת לחזה. עובד חזק על התלת־ראשי ומרכז החזה.'
    },
    dips: {
      name: 'מקבילים',
      description: 'על מקבילים בפארק או שני כיסאות יציבים. רד עד שהכתפיים עוברות את המרפקים.'
    },
    'backpack-pushups': {
      name: 'שכיבות סמיכה עם תיק',
      description: 'שכיבות סמיכה עם תיק גב טעון. הוסף ספרים או בקבוקי מים ככל שאתה מתחזק.'
    },
    'archer-pushups': {
      name: 'שכיבות סמיכה קשת',
      description: 'ידיים רחבות, עבור ליד אחת בזמן שהשנייה נשארת ישרה. החלף צדדים.'
    },
    'superman-pulls': {
      name: 'משיכות סופרמן',
      description: 'על הבטן, הרם את החזה ומשוך את המרפקים לכיוון המותניים.'
    },
    'doorway-rows': {
      name: 'חתירות במשקוף',
      description: 'תפוס משקוף דלת יציב, הישען לאחור ומשוך את החזה אליו.'
    },
    'inverted-floor-rows': {
      name: 'חתירות רצפה הפוכות',
      description: 'על הגב, רגליים נשענות. דחף מרפקים לרצפה והרם את החלק העליון של הגב.'
    },
    'inverted-rows': {
      name: 'חתירה הפוכה',
      description: 'היתלה מתחת למוט נמוך בפארק, גוף ישר, ומשוך את החזה אליו. קרב את הרגליים כדי להקל.'
    },
    'negative-pull-ups': {
      name: 'מתח שלילי',
      description: 'קפוץ לראש המוט ורד לאט במשך 3–5 שניות. הדרך המהירה למתח הראשון שלך.'
    },
    'chin-ups': {
      name: 'מתח באחיזה הפוכה',
      description: 'כפות ידיים כלפיך, משוך עד שהסנטר עובר את המוט. קצת יותר קל ממתח רגיל.'
    },
    'pull-ups': {
      name: 'מתח',
      description: 'כפות ידיים הרחק ממך, מתלייה מלאה עד סנטר מעל המוט. בלי תנופה.'
    },
    'backpack-pull-ups': {
      name: 'מתח עם תיק',
      description: 'מתח עם תיק גב טעון ורצועות הדוקות. התחל קל והוסף קצת כל שבוע.'
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
    'step-ups': {
      name: 'עליות על ספסל',
      description: 'עלה על ספסל בפארק או מדרגה ודחף למעלה דרך העקב הקדמי.'
    },
    'single-leg-bridges': {
      name: 'גשר על רגל אחת',
      description: 'גשר ישבן על רגל אחת, הברך השנייה אסופה. החלף צד בכל סט.'
    },
    'jump-squats': {
      name: 'סקוואט עם קפיצה',
      description: 'רד לסקוואט וקפוץ הכי גבוה שאתה יכול. נחת ברכות.'
    },
    burpees: {
      name: 'בורפי',
      description: 'רד, בעיטה לאחור, קפיצה. בתנועה אחת חדה.'
    },
    'bulgarian-splits': {
      name: 'ספליט בולגרי',
      description: 'רגל אחורית על ספסל, רד עמוק ככל שאתה יכול בשליטה.'
    },
    'calf-raises': {
      name: 'הרמות עקבים',
      description: 'עלו על כריות כפות הרגליים גבוה ככל האפשר, עצרו רגע, ורדו לאט. כשזה קל, עברו לרגל אחת.'
    },
    'bench-press': {
      name: 'לחיצת חזה',
      description: 'שכבו על ספסל ודחפו מוט משקולות מהחזה עד ליישור הידיים. התחילו קל והוסיפו משקל כשתתחזקו.'
    },
    'goblet-squats': {
      name: 'סקוואט גביע',
      description: 'החזיקו משקולת יד אחת מול החזה ורדו לסקוואט עמוק עם חזה זקוף. הוסיפו משקל כשתתחזקו.'
    },
    'backpack-squats': {
      name: 'סקוואט עם תיק',
      description: 'סקוואט עם תיק גב טעון (או מחובק לחזה).'
    },
    'pistol-squats': {
      name: 'סקוואט אקדח',
      description: 'סקוואט על רגל אחת עד הסוף. החזק עמוד עד שתשלוט בשיווי המשקל.'
    },
    planks: {
      name: 'פלאנק',
      description: 'החזקה 60–90 שניות. כווץ ליבה וישבן. אל תתן לאגן לשקוע.'
    },
    crunches: {
      name: 'כפיפות בטן',
      description: 'התגלגל כמו כפיפת בטן קטנה.'
    },
    'side-planks': {
      name: 'פלאנק צדדי',
      description: 'החזק פלאנק חזק מהצד. שני הצדדים נחשבים לסט אחד.'
    },
    'leg-raises': {
      name: 'הרמת רגליים',
      description: 'על הגב, הרם רגליים ישרות לאט והורד בשליטה.'
    },
    'hollow-body': {
      name: 'החזקת גוף חלול',
      description: 'החזק תנוחת גוף חלול בצורת בננה הדוקה.'
    },
    'hanging-knee-raises': {
      name: 'הרמת ברכיים בתלייה',
      description: 'היתלה ממוט בפארק ומשוך את הברכיים לחזה בלי להתנדנד.'
    },
    'l-sit': {
      name: 'ישיבת L',
      description: 'על מקבילים או על הרצפה, רגליים נעולות ואגן מורם. החזקה מקסימלית.'
    },
    'hanging-leg-raises': {
      name: 'הרמת רגליים בתלייה',
      description: 'היתלה ממוט והרם רגליים ישרות לגובה האגן או יותר.'
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
    'incline-pushups': {
      name: 'ضغط مائل',
      description: 'اليدان على مقعد أو جدار أو درجة. أسهل طريقة للبدء بتمارين الضغط.'
    },
    pushups: {
      name: 'تمارين الضغط',
      description: 'اجمع حتى 100 تكراراً إجمالياً عبر المجموعات في يوم الدفع.'
    },
    'pike-pushups': {
      name: 'ضغط الرمح',
      description: 'الوركان للأعلى، أنزل رأسك بين يديك. يبني أكتافاً قوية.'
    },
    'diamond-pushups': {
      name: 'ضغط الماسة',
      description: 'اليدان معاً تحت صدرك. يعمل بقوة على العضلة ثلاثية الرؤوس ووسط الصدر.'
    },
    dips: {
      name: 'البار الموازي',
      description: 'على المتوازي في الحديقة أو كرسيين متينين. انزل حتى تتجاوز كتفاك مرفقيك.'
    },
    'backpack-pushups': {
      name: 'ضغط بحقيبة الظهر',
      description: 'تمارين ضغط مع حقيبة ظهر محمّلة. أضف كتباً أو زجاجات ماء كلما ازدادت قوتك.'
    },
    'archer-pushups': {
      name: 'ضغط الرامي',
      description: 'اليدان متباعدتان، انتقل إلى ذراع واحدة بينما تبقى الأخرى مستقيمة. بدّل الجانبين.'
    },
    'superman-pulls': {
      name: 'سحب سوبرمان',
      description: 'على بطنك، ارفع صدرك واسحب مرفقيك نحو وركيك.'
    },
    'doorway-rows': {
      name: 'تجديف بإطار الباب',
      description: 'أمسك إطار باب متين، مِل للخلف واسحب صدرك نحوه.'
    },
    'inverted-floor-rows': {
      name: 'تجديف أرضي معكوس',
      description: 'على ظهرك، قدمان ثابتتان. ادفع المرفقين للأسفل لترفع الجزء العلوي من ظهرك.'
    },
    'inverted-rows': {
      name: 'تجديف معكوس',
      description: 'تعلّق تحت عارضة منخفضة في الحديقة، جسمك مستقيم، واسحب صدرك إليها. قرّب قدميك لتسهيلها.'
    },
    'negative-pull-ups': {
      name: 'عقلة سلبية',
      description: 'اقفز إلى أعلى العارضة ثم انزل ببطء خلال 3–5 ثوانٍ. أسرع طريق لأول عقلة لك.'
    },
    'chin-ups': {
      name: 'عقلة بقبضة معكوسة',
      description: 'راحتا اليدين نحوك، اسحب حتى يتجاوز ذقنك العارضة. أسهل قليلاً من العقلة العادية.'
    },
    'pull-ups': {
      name: 'العقلة',
      description: 'راحتا اليدين للخارج، من التعلق الكامل حتى يتجاوز ذقنك العارضة. بلا تأرجح.'
    },
    'backpack-pull-ups': {
      name: 'عقلة بحقيبة الظهر',
      description: 'عقلة مع حقيبة ظهر محمّلة وأحزمة مشدودة. ابدأ بوزن خفيف وأضف قليلاً كل أسبوع.'
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
    'step-ups': {
      name: 'الصعود على المقعد',
      description: 'اصعد على مقعد في الحديقة أو درجة وادفع للأعلى عبر الكعب الأمامي.'
    },
    'single-leg-bridges': {
      name: 'جسر على ساق واحدة',
      description: 'جسر أرداف على ساق واحدة والركبة الأخرى مضمومة. بدّل الجانب كل مجموعة.'
    },
    'jump-squats': {
      name: 'قرفصاء مع قفز',
      description: 'انزل للقرفصاء واقفز لأعلى ما تستطيع. اهبط بنعومة.'
    },
    burpees: {
      name: 'البربي',
      description: 'انزل، اركل للخلف، واقفز في حركة واحدة حادة.'
    },
    'bulgarian-splits': {
      name: 'الانقسام البلغاري',
      description: 'القدم الخلفية على مقعد، انزل بعمق بقدر ما تستطيع بتحكم.'
    },
    'calf-raises': {
      name: 'رفع السمانة',
      description: 'ارتفع على مقدمة قدميك إلى أعلى ما يمكن، توقّف لحظة، ثم انزل ببطء. استخدم ساقاً واحدة عندما يصبح الأمر سهلاً.'
    },
    'bench-press': {
      name: 'ضغط البنش',
      description: 'استلقِ على مقعد وادفع البار من صدرك حتى تستقيم ذراعاك. ابدأ بوزن خفيف وزِده مع تقدّمك.'
    },
    'goblet-squats': {
      name: 'قرفصاء الكأس',
      description: 'أمسك دمبل واحداً أمام صدرك وانزل في قرفصاء عميقة مع صدر مرفوع. زِد الوزن مع تقدّمك.'
    },
    'backpack-squats': {
      name: 'قرفصاء بحقيبة الظهر',
      description: 'قرفصاء مع حقيبة ظهر محمّلة (أو احتضنها أمام صدرك).'
    },
    'pistol-squats': {
      name: 'قرفصاء المسدس',
      description: 'قرفصاء على ساق واحدة حتى الأسفل. أمسك عموداً حتى تتقن التوازن.'
    },
    planks: {
      name: 'البلانك',
      description: 'ثبات 60–90 ثانية. شد الجذع والأرداف. لا تدع الورك يسقط.'
    },
    crunches: {
      name: 'تمارين البطن',
      description: 'ارفع جذعك قليلاً كأنها جلسة بطن صغيرة.'
    },
    'side-planks': {
      name: 'بلانك جانبي',
      description: 'اثبت في بلانك قوي على جانبك. الجانبان يُحسبان مجموعة واحدة.'
    },
    'leg-raises': {
      name: 'رفع الساقين',
      description: 'على ظهرك، ارفع ساقين مستقيمتين ببطء وانزل بتحكم.'
    },
    'hollow-body': {
      name: 'تثبيت الجسم المجوف',
      description: 'اثبت في وضعية جسم مجوف بشكل موزة محكم.'
    },
    'hanging-knee-raises': {
      name: 'رفع الركبتين معلقاً',
      description: 'تعلّق من عارضة في الحديقة واسحب ركبتيك إلى صدرك دون تأرجح.'
    },
    'l-sit': {
      name: 'جلسة L',
      description: 'على المتوازي أو الأرض، الساقان مقفلتان والوركان مرفوعان. أقصى ثبات.'
    },
    'hanging-leg-raises': {
      name: 'رفع الساقين معلقاً',
      description: 'تعلّق من عارضة وارفع ساقين مستقيمتين إلى مستوى الورك أو أعلى.'
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
