import type { Language } from './types';
import type { AppTranslations } from './types';

type SettingsContent = AppTranslations['settings'];

const en: SettingsContent = {
  title: 'Settings',
  back: 'Back',
  dailySetTarget: {
    title: 'daily set target',
    description: 'How many sets you aim to hit per exercise each day.',
    sets: (count) => `${count} sets`
  },
  rotatingProgram: {
    title: 'rotating program',
    description:
      '5-day RIR plan: push, legs, pull, legs, mixed. Take up to 2 rest (stretch) days per week from the home screen — those push the program back one day. Equipment exercises are 3 sets; bodyweight and core are 2 sets.',
    off: 'Off',
    on: 'On',
    trainingGuide: {
      toggleLabel: 'How hard should each set feel?',
      sections: [
        {
          title: 'Equipment exercises — 3 sets',
          items: [
            { label: 'Set 1:', text: '1–2 reps left in the tank (RIR)' },
            { label: 'Set 2:', text: '1–2 reps left in the tank (RIR)' },
            { label: 'Set 3:', text: 'Go to absolute failure' }
          ]
        },
        {
          title: 'Bodyweight exercises — 2 sets',
          items: [
            { label: 'Set 1:', text: '1 rep left in the tank (RIR)' },
            { label: 'Set 2:', text: 'Go to absolute failure' }
          ]
        },
        {
          title: 'Core — 2 sets',
          items: [
            { label: 'Set 1:', text: 'Controlled pace, or stop 1–2 reps early' },
            { label: 'Set 2:', text: 'Max hold or failure' }
          ]
        },
        {
          title: 'Rest days (player-chosen)',
          items: [
            {
              label: 'Stretch only.',
              text: 'No lifting and no core — deep static stretching. Up to 2 per week; today’s workout moves to tomorrow.'
            }
          ]
        }
      ]
    },
    phases: {
      push: 'push',
      pull: 'pull',
      legs: 'legs',
      mixed: 'mixed',
      recovery: 'stretch'
    },
    restDay: {
      carouselTitle: 'REST',
      carouselKicker: 'today'
    }
  },
  appearance: {
    title: 'appearance',
    nightOn: 'night mode on',
    dayOn: 'day mode on',
    switchToDay: 'switch to day mode',
    switchToNight: 'switch to night mode',
    switchToDayButton: 'day mode',
    switchToNightButton: 'night mode'
  },
  language: {
    title: 'language',
    description: 'Choose your preferred language.',
    options: { en: 'English', he: 'עברית', ar: 'العربية' }
  },
  weightUnit: {
    title: 'weight units',
    description: 'Log and track load in kilograms or pounds (2.5 kg / 5 lb plate jumps).',
    kg: 'kg',
    lb: 'lb'
  },
  faq: {
    title: 'faq',
    description: 'Training basics for getting stronger with minimal equipment.',
    items: [
      {
        question: 'Do I need fancy gym equipment to start?',
        paragraphs: [
          'No. You only need a chair, a bar (or an improvised pull-up surface like a table or door frame), and the floor.'
        ]
      },
      {
        question: 'What is the best way to structure my workouts?',
        list: {
          intro:
            'Start with a Push-Pull-Legs (PPL) split, ideally 3-4 days a week. Focus on compound movements:',
          items: [
            { label: 'Push:', text: 'Push-ups' },
            { label: 'Pull:', text: 'Rows or pull-ups' },
            { label: 'Legs:', text: 'Squats or lunges' },
            { label: 'Core:', text: 'Planks or leg raises' }
          ]
        }
      },
      {
        question: 'How many repetitions are recommended for muscle growth?',
        paragraphs: [
          'While high repetitions (20-30 per set) can help muscles grow when you train until you cannot do another rep, benefits diminish after 30 reps. Aiming for a maximum of 15 reps per set is recommended; once you hit this target, increase the difficulty of the exercise.'
        ]
      },
      {
        question:
          'How do I know when to transition to a more difficult exercise variation?',
        paragraphs: [
          'Once you master your current version and can consistently hit your target repetition range (up to 15 reps), you should shift to a harder variation of the movement to continue increasing resistance. For example, progress from knee push-ups to regular, then to diamond, and finally to decline push-ups.'
        ]
      },
      {
        question: 'How much volume should I aim for?',
        list: {
          intro: 'Volume should be scaled based on the muscle group:',
          items: [
            {
              label: 'Large muscle groups',
              text: '(chest, back, legs): Start with 6-8 sets per week, gradually building to 14-18.'
            },
            {
              label: 'Smaller muscle groups',
              text: '(shoulders, biceps, triceps, core): Start with 4-6 sets per week, gradually building to 8-12.'
            }
          ]
        }
      },
      {
        question: 'What is the role of nutrition in muscle growth?',
        paragraphs: [
          'Nutrition is essential. Calculate your Basal Metabolic Rate (BMR) and adjust your caloric intake based on your goals: maintain a caloric surplus to gain muscle or a deficit to lose fat. Most importantly, ensure your protein intake is high, as it is the primary building block for muscle repair.'
        ]
      },
      {
        question: 'How much sleep do I need?',
        paragraphs: [
          'Muscle growth happens during rest, not in the gym. You need 7 to 9 hours of sleep consistently for your body to recover effectively.'
        ]
      }
    ]
  },
  account: {
    title: 'account',
    description: 'Sign out when you are done for now.',
    signOut: 'sign out'
  }
};

const he: SettingsContent = {
  title: 'הגדרות',
  back: 'חזרה',
  dailySetTarget: {
    title: 'יעד סטים יומי',
    description: 'כמה סטים אתה שואף להשלים לכל תרגיל ביום.',
    sets: (count) => `${count} סטים`
  },
  rotatingProgram: {
    title: 'תוכנית מתחלפת',
    description:
      'תוכנית RIR ל-5 ימים: דחיפה, רגליים, משיכה, רגליים, מעורב. אפשר לקחת עד 2 ימי מנוחה (מתיחות) בשבוע ממסך הבית — זה דוחה את התוכנית ביום. תרגילי ציוד — 3 סטים; משקל גוף וליבה — 2 סטים.',
    off: 'כבוי',
    on: 'פעיל',
    trainingGuide: {
      toggleLabel: 'כמה קשה כל סט צריך להרגיש?',
      sections: [
        {
          title: 'תרגילי ציוד — 3 סטים',
          items: [
            { label: 'סט 1:', text: '1–2 חזרות נשארו בטנק (RIR)' },
            { label: 'סט 2:', text: '1–2 חזרות נשארו בטנק (RIR)' },
            { label: 'סט 3:', text: 'כשלון מלא' }
          ]
        },
        {
          title: 'תרגילי משקל גוף — 2 סטים',
          items: [
            { label: 'סט 1:', text: 'חזרה אחת נשארה בטנק (RIR)' },
            { label: 'סט 2:', text: 'כשלון מלא' }
          ]
        },
        {
          title: 'ליבה — 2 סטים',
          items: [
            { label: 'סט 1:', text: 'קצב בשליטה, או עצור 1–2 חזרות לפני המקסימום' },
            { label: 'סט 2:', text: 'החזקה מקסימלית או כשלון' }
          ]
        },
        {
          title: 'ימי מנוחה (נבחרים על ידי השחקן)',
          items: [
            {
              label: 'מתיחות בלבד.',
              text: 'בלי הרמות ובלי ליבה — מתיחות סטטיות עמוקות. עד 2 בשבוע; האימון של היום עובר למחר.'
            }
          ]
        }
      ]
    },
    phases: {
      push: 'דחיפה',
      pull: 'משיכה',
      legs: 'רגליים',
      mixed: 'מעורב',
      recovery: 'מתיחות'
    },
    restDay: {
      carouselTitle: 'מנוחה',
      carouselKicker: 'היום'
    }
  },
  appearance: {
    title: 'מראה',
    nightOn: 'מצב לילה פעיל',
    dayOn: 'מצב יום פעיל',
    switchToDay: 'עבור למצב יום',
    switchToNight: 'עבור למצב לילה',
    switchToDayButton: 'מצב יום',
    switchToNightButton: 'מצב לילה'
  },
  language: {
    title: 'שפה',
    description: 'בחר את השפה המועדפת עליך.',
    options: { en: 'English', he: 'עברית', ar: 'العربية' }
  },
  weightUnit: {
    title: 'יחידות משקל',
    description: 'רישום ומעקב בק"ג או בליברות (קפיצות של 2.5 ק"ג / 5 lb).',
    kg: 'ק"ג',
    lb: 'lb'
  },
  faq: {
    title: 'שאלות נפוצות',
    description: 'יסודות אימון להתחזקות עם ציוד מינימלי.',
    items: [
      {
        question: 'האם אני צריך ציוד כושר יקר כדי להתחיל?',
        paragraphs: [
          'לא. אתה צריך רק כיסא, מוט (או משטח משיכה מאולתר כמו שולחן או משקוף דלת), והרצפה.'
        ]
      },
      {
        question: 'מה הדרך הטובה ביותר לבנות את האימונים שלי?',
        list: {
          intro:
            'התחל עם חלוקת דחיפה-משיכה-רגליים (PPL), בדרך כלל 3-4 ימים בשבוע. התמקד בתנועות מורכבות:',
          items: [
            { label: 'דחיפה:', text: 'שכיבות סמיכה' },
            { label: 'משיכה:', text: 'חתירות או מתח' },
            { label: 'רגליים:', text: 'סקוואט או לאנג׳ים' },
            { label: 'ליבה:', text: 'פלאנק או הרמת רגליים' }
          ]
        }
      },
      {
        question: 'כמה חזרות מומלצות לצמיחת שריר?',
        paragraphs: [
          'למרות שמספר חזרות גבוה (20-30 לסט) יכול לעזור לשרירים לגדול כשמתאמנים עד שלא יכולים עוד חזרה, היתרונות דועכים אחרי 30 חזרות. מומלץ לכוון למקסימום של 15 חזרות לסט; ברגע שמגיעים ליעד, הגבר את קושי התרגיל.'
        ]
      },
      {
        question: 'איך אדע מתי לעבור לגרסה קשה יותר של תרגיל?',
        paragraphs: [
          'ברגע ששלטת בגרסה הנוכחית ויכולת להגיע בעקביות לטווח החזרות המיועד (עד 15 חזרות), כדאי לעבור לגרסה קשה יותר של התנועה כדי להמשיך להגביר התנגדות. לדוגמה: התקדם משכיבות סמיכה על הברכיים לרגילות, ואז ליהלום, ולבסוף לשכיבות סמיכה בשיפוע.'
        ]
      },
      {
        question: 'כמה נפח אימון כדאי לי לשאוף אליו?',
        list: {
          intro: 'הנפח צריך להיות מותאם לפי קבוצת השריר:',
          items: [
            {
              label: 'קבוצות שריר גדולות',
              text: '(חזה, גב, רגליים): התחל עם 6-8 סטים בשבוע, ובנה בהדרגה ל-14-18.'
            },
            {
              label: 'קבוצות שריר קטנות יותר',
              text: '(כתפיים, ביצפס, טריצפס, ליבה): התחל עם 4-6 סטים בשבוע, ובנה בהדרגה ל-8-12.'
            }
          ]
        }
      },
      {
        question: 'מה התפקיד של תזונה בצמיחת שריר?',
        paragraphs: [
          'תזונה היא חיונית. חשב את קצב חילוף החומרים הבסיסי (BMR) והתאם את צריכת הקלוריות לפי המטרות שלך: שמור על עודף קלורי כדי לבנות שריר או גירעון כדי לרדת בשומן. הכי חשוב — ודא שצריכת החלבון שלך גבוהה, כי הוא אבן הבניין העיקרית לתיקון שריר.'
        ]
      },
      {
        question: 'כמה שינה אני צריך?',
        paragraphs: [
          'צמיחת שריר קורית במנוחה, לא בחדר הכושר. אתה צריך 7 עד 9 שעות שינה באופן עקבי כדי שהגוף יתאושש ביעילות.'
        ]
      }
    ]
  },
  account: {
    title: 'חשבון',
    description: 'התנתק כשאתה מסיים, לעת עתה.',
    signOut: 'התנתק'
  }
};

const ar: SettingsContent = {
  title: 'الإعدادات',
  back: 'رجوع',
  dailySetTarget: {
    title: 'هدف المجموعات اليومي',
    description: 'عدد المجموعات التي تستهدف إكمالها لكل تمرين يوميًا.',
    sets: (count) => `${count} مجموعات`
  },
  rotatingProgram: {
    title: 'برنامج متناوب',
    description:
      'خطة RIR لخمسة أيام: دفع، ساقين، سحب، ساقين، مختلط. يمكنك أخذ حتى يومَي راحة (تمدد) في الأسبوع من الشاشة الرئيسية — وهذا يؤجل البرنامج يومًا واحدًا. تمارين المعدات 3 مجموعات؛ وزن الجسم واللبّ 2 مجموعات.',
    off: 'إيقاف',
    on: 'تشغيل',
    trainingGuide: {
      toggleLabel: 'ما مدى صعوبة كل مجموعة؟',
      sections: [
        {
          title: 'تمارين بالمعدات — 3 مجموعات',
          items: [
            { label: 'المجموعة 1:', text: '1–2 تكرارات متبقية (RIR)' },
            { label: 'المجموعة 2:', text: '1–2 تكرارات متبقية (RIR)' },
            { label: 'المجموعة 3:', text: 'فشل كامل' }
          ]
        },
        {
          title: 'تمارين وزن الجسم — مجموعتان',
          items: [
            { label: 'المجموعة 1:', text: 'تكرار واحد متبقٍ (RIR)' },
            { label: 'المجموعة 2:', text: 'فشل كامل' }
          ]
        },
        {
          title: 'اللبّ — مجموعتان',
          items: [
            { label: 'المجموعة 1:', text: 'إيقاع مضبوط، أو توقف قبل 1–2 تكرارات' },
            { label: 'المجموعة 2:', text: 'أقصى ثبات أو فشل' }
          ]
        },
        {
          title: 'أيام الراحة (يختارها اللاعب)',
          items: [
            {
              label: 'تمدد فقط.',
              text: 'لا رفع ولا لبّ — تمدد ثابت عميق. حتى يومين في الأسبوع؛ ينتقل تمرين اليوم إلى الغد.'
            }
          ]
        }
      ]
    },
    phases: {
      push: 'دفع',
      pull: 'سحب',
      legs: 'ساقين',
      mixed: 'مختلط',
      recovery: 'تمدد'
    },
    restDay: {
      carouselTitle: 'راحة',
      carouselKicker: 'اليوم'
    }
  },
  appearance: {
    title: 'المظهر',
    nightOn: 'الوضع الليلي مفعّل',
    dayOn: 'الوضع النهاري مفعّل',
    switchToDay: 'التبديل إلى الوضع النهاري',
    switchToNight: 'التبديل إلى الوضع الليلي',
    switchToDayButton: 'نهار',
    switchToNightButton: 'ليل'
  },
  language: {
    title: 'اللغة',
    description: 'اختر لغتك المفضلة.',
    options: { en: 'English', he: 'עברית', ar: 'العربية' }
  },
  weightUnit: {
    title: 'وحدات الوزن',
    description: 'سجّل وتتبّع الحمل بالكيلوغرام أو الرطل (زيادات 2.5 كغ / 5 lb).',
    kg: 'كغ',
    lb: 'lb'
  },
  faq: {
    title: 'الأسئلة الشائعة',
    description: 'أساسيات التدريب للتقوّي بأقل قدر من المعدات.',
    items: [
      {
        question: 'هل أحتاج إلى معدات رياضية باهظة للبدء؟',
        paragraphs: [
          'لا. تحتاج فقط إلى كرسي، وعمود (أو سطح سحب مرتجل مثل طاولة أو إطار باب)، والأرض.'
        ]
      },
      {
        question: 'ما أفضل طريقة لتنظيم تماريني؟',
        list: {
          intro:
            'ابدأ بتقسيم الدفع-السحب-الأرجل (PPL)، بمعدل 3-4 أيام في الأسبوع. ركّز على الحركات المركبة:',
          items: [
            { label: 'الدفع:', text: 'تمارين الضغط' },
            { label: 'السحب:', text: 'التجديف أو العقلة' },
            { label: 'الأرجل:', text: 'القرفصاء أو الاندفاع' },
            { label: 'الجذع:', text: 'البلانك أو رفع الساقين' }
          ]
        }
      },
      {
        question: 'كم عدد التكرارات الموصى بها لنمو العضلات؟',
        paragraphs: [
          'رغم أن التكرارات العالية (20-30 لكل مجموعة) يمكن أن تساعد العضلات على النمو عند التدريب حتى لا تستطيع تكراراً آخر، تقل الفوائد بعد 30 تكرارًا. يُنصح بالحد الأقصى 15 تكرارًا لكل مجموعة؛ وعند الوصول إلى هذا الهدف، زِد صعوبة التمرين.'
        ]
      },
      {
        question: 'كيف أعرف متى أنتقل إلى نسخة أصعب من التمرين؟',
        paragraphs: [
          'بمجرد إتقان النسخة الحالية والقدرة على الوصول باستمرار إلى نطاق التكرارات المستهدف (حتى 15 تكرارًا)، انتقل إلى نسخة أصعب من الحركة لمواصلة زيادة المقاومة. على سبيل المثال: تقدّم من ضغط الركبتين إلى الضغط العادي، ثم الماسي، وأخيرًا الضغط المائل.'
        ]
      },
      {
        question: 'كم حجم التدريب يجب أن أستهدف؟',
        list: {
          intro: 'يجب ضبط الحجم حسب مجموعة العضلة:',
          items: [
            {
              label: 'مجموعات العضلات الكبيرة',
              text: '(الصدر، الظهر، الأرجل): ابدأ بـ 6-8 مجموعات أسبوعيًا، ثم زِد تدريجيًا إلى 14-18.'
            },
            {
              label: 'مجموعات العضلات الأصغر',
              text: '(الكتفين، البايسبس، الترايسبس، الجذع): ابدأ بـ 4-6 مجموعات أسبوعيًا، ثم زِد تدريجيًا إلى 8-12.'
            }
          ]
        }
      },
      {
        question: 'ما دور التغذية في نمو العضلات؟',
        paragraphs: [
          'التغذية ضرورية. احسب معدل الأيض الأساسي (BMR) واضبط السعرات الحرارية وفق أهدافك: حافظ على فائض سعرات لبناء العضلات أو عجز لفقدان الدهون. الأهم من ذلك، تأكد من تناول بروتين كافٍ، فهو اللبنة الأساسية لإصلاح العضلات.'
        ]
      },
      {
        question: 'كم ساعة نوم أحتاج؟',
        paragraphs: [
          'نمو العضلات يحدث أثناء الراحة، وليس في صالة الألعاب الرياضية. تحتاج إلى 7 إلى 9 ساعات نوم بانتظام ليتعافى جسمك بفعالية.'
        ]
      }
    ]
  },
  account: {
    title: 'الحساب',
    description: 'سجّل الخروج عندما تنتهي، في الوقت الحالي.',
    signOut: 'تسجيل الخروج'
  }
};

export const settingsContent: Record<Language, SettingsContent> = { en, he, ar };
