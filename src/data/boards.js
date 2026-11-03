import { ITEMS } from './items.js';

// Thinking challenges: every board is a set of rows, and in each row the
// player chooses from options. check(picks) gets the choices, row by row,
// and returns a friendly hint, or null when the plan works. More than one
// answer is usually right, and nothing here punishes a choice of food.
const food = (id) => ({ id, ...ITEMS[id] });
const foods = (...ids) => ids.map(food);
const thing = (id, icon, name, extra) => ({ id, icon, name, ...extra });
const say = (id, name, extra) => ({ id, name, ...extra });

const all = (picks) => picks.flat();
const has = (picks, ...ids) => all(picks).some((o) => ids.includes(o.id));
const weakRow = (rows, picks) => rows.find((r, i) => picks[i].some((o) => o.weak));

const FUEL = foods('bread', 'rice', 'pasta', 'potato', 'candy');
const WEEK = foods('apple', 'tomato', 'banana', 'corn', 'grapes', 'carrot', 'orange', 'broccoli');

const DAY_ROWS = [
  {
    label: '07:30', title: 'ארוחת בוקר',
    hint: 'קורה שאוכלים רק ממתק, וזה לא נורא. אבל לפני יום לימודים ארוך, בוקר מגוון יעזור יותר.',
    options: [say('sandwich', 'כריך עם גבינה וירק'), say('cereal', 'דגנים עם יוגורט ופרי'), say('sweet', 'רק ממתק', { weak: true })],
  },
  {
    label: '10:00', title: 'ההפסקה הגדולה',
    hint: 'עד הצהריים עוד רחוק! נשנוש קטן בהפסקה יעזור להמשיך בכיף.',
    options: [say('fruit', 'פרי ואגוזים'), say('small', 'חצי כריך'), say('none', 'לא אוכל כלום', { weak: true })],
  },
  {
    label: '12:30', title: 'ארוחת צהריים',
    hint: 'חטיף טעים, אבל היום נמשך עד ארבע. בחרו ארוחה שיש בה יותר סוגי מזון.',
    options: [say('lentils', 'אורז עם עדשים וסלט'), say('pasta', 'פסטה עם גבינה וירקות'), say('snack', 'רק שקית חטיף', { weak: true })],
  },
  {
    label: '14:30', title: 'לפני שיעור הספורט',
    hint: 'ממש לפני ספורט כדאי משהו קל. ארוחה ענקית תוכל לחכות לערב.',
    options: [say('banana', 'בננה ומים'), say('light', 'קצת פרי'), say('huge', 'ארוחה ענקית', { weak: true })],
  },
  {
    label: 'כל היום', title: 'מה שותים?',
    hint: 'יום ארוך ופעיל: כדאי שמים יהיו איתכם כל הזמן, ולא רק בערב.',
    options: [say('bottle', 'בקבוק מים שממלאים במהלך היום'), say('evening', 'שותה רק כשחוזר הביתה', { weak: true })],
  },
];

const FINALE_ROWS = [
  { title: 'עיר האנרגיה', right: 'carbs', options: [say('carbs', 'פחמימות נותנות לגוף אנרגיה'), say('sweet', 'רק ממתקים נותנים אנרגיה')] },
  { title: 'מפעל הבנייה', right: 'many', options: [say('one', 'כל מזון שייך רק לקבוצה אחת'), say('many', 'מזון אחד יכול לתת כמה רכיבים, כמו יוגורט: חלבון וסידן')] },
  { title: "ג'ונגל הצבעים", right: 'time', options: [say('every', 'חייבים לאכול את כל הירקות בכל ארוחה'), say('time', 'מה שחשוב הוא גיוון לאורך זמן')] },
  { title: 'ממלכת המים', right: 'varies', options: [say('varies', 'כמה לשתות? זה משתנה לפי הילד, הפעילות ומזג האוויר'), say('same', 'כל הילדים צריכים בדיוק אותה כמות')] },
  { title: 'עיר החיים', right: 'joy', options: [say('fear', 'כדאי לפחד ממזונות מסוימים'), say('joy', 'אוכל הוא גם הנאה, ותכנון קטן עוזר ליום שלם')] },
];

export const BOARDS = {
  fuel: {
    title: 'דלק למסע הרכבת',
    intro: 'הרכבת יוצאת למסע ארוך עם שלוש תחנות. בחרו מה מעמיסים בכל תחנה.',
    rows: [
      { title: 'תחנה 1: העלייה להר', options: FUEL },
      { title: 'תחנה 2: המנהרה הארוכה', options: FUEL },
      { title: 'תחנה 3: הגשר הגבוה', options: FUEL },
    ],
    check(p) {
      const ids = all(p).map((o) => o.id);
      if (ids.filter((id) => id === 'candy').length > 1) return 'סוכרייה אחת בדרך זה כיף! אבל האנרגיה שלה נגמרת מהר, והמסע ארוך. החליפו סוכרייה במשהו שמחזיק יותר זמן.';
      if (new Set(ids).size < 2) return 'הרכבת תגיע, אבל משעמם לה! נסו לגוון ולבחור מקורות אנרגיה שונים.';
      return null;
    },
    win: 'הרכבת טסה! לחם, אורז, פסטה ותפוחי אדמה נותנים אנרגיה לאורך זמן. ממתק? טעים מדי פעם, אבל לא מחליף ארוחה.',
  },
  builders: {
    title: 'השלד של שרירון',
    intro: 'הדגם של הגוף במפעל צריך חומרים. בחרו לכל חלק מזון שעוזר לו.',
    rows: [
      { title: 'שרירים', hint: 'לשרירים עוזר חלבון. נסו שוב בשורת השרירים.', right: 'egg', options: foods('apple', 'egg', 'rice') },
      { title: 'עצמות', hint: 'לעצמות עוזר סידן. נסו שוב בשורת העצמות.', right: 'yogurt', options: foods('pasta', 'carrot', 'yogurt') },
      { title: 'הדם שמוביל חמצן', hint: 'בדם חשוב ברזל. נסו שוב בשורת הדם.', right: 'lentils', options: foods('lentils', 'banana', 'potato') },
      { title: 'התאים והמוח', hint: 'לתאים ולמוח חשובים שומנים. נסו שוב בשורה האחרונה.', right: 'nuts', options: foods('candy', 'nuts', 'tomato') },
    ],
    check(p) {
      const bad = this.rows.find((r, i) => p[i][0].id !== r.right);
      return bad ? bad.hint : null;
    },
    win: 'הדגם עומד! וזה עוד לא הכל: ביצה נותנת גם שומנים, ועדשים גם חלבון וגם סיבים. כל מזון תורם יותר מדבר אחד.',
  },
  week: {
    title: 'שבוע של צבעים',
    intro: 'קיבוצי מתכנן פרי או ירק אחד לכל יום. נסו להגיע לארבעה צבעים לפחות במהלך השבוע.',
    compact: true,
    rows: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'].map((d) => ({ title: 'יום ' + d, options: WEEK })),
    check(p) {
      const colors = new Set(all(p).map((o) => o.color));
      return colors.size < 4 ? `יש לכם ${colors.size === 1 ? 'צבע אחד' : colors.size + ' צבעים'}. החליפו יום או יומיים בצבע אחר.` : null;
    },
    win: 'איזה שבוע צבעוני! לא צריך את כל הצבעים בכל יום. הגיוון נבנה לאט לאט, לאורך השבוע.',
  },
  hot: {
    title: 'מסע ביום חם',
    intro: 'טיפטיפ יוצאת למסע ארוך בשמש. ארזו ארבעה דברים לכל היותר, וענו על השאלה של טיפטיפ.',
    rows: [
      {
        title: 'מה לוקחים?', max: 4, min: 2,
        options: [thing('bottle', '🧴', 'בקבוק מים'), thing('hat', '🧢', 'כובע'), food('orange'), thing('coat', '🧥', 'מעיל עבה'), thing('sled', '🛷', 'מזחלת'), food('banana')],
      },
      {
        title: 'כמה מים צריך לשתות?',
        options: [say('eight', 'בדיוק אותה כמות לכל ילד'), say('varies', 'זה משתנה לפי הגיל, הפעילות ומזג האוויר')],
      },
    ],
    check(p) {
      if (!has(p, 'bottle')) return 'טיפטיפ נעלבת! איך יוצאים ליום חם בלי בקבוק מים?!';
      if (!has(p, 'hat')) return 'השמש חזקה היום. מה יגן על הראש?';
      if (has(p, 'coat', 'sled')) return 'יש בתיק משהו שמתאים יותר לשלג. יש דבר שעדיף להשאיר בבית.';
      if (p[1][0].id !== 'varies') return 'טיפטיפ בהלם! ילד שרץ בשמש וילד שיושב בצל צריכים אותו דבר?';
      return null;
    },
    win: 'טיפטיפ מוכנה! ביום חם ופעיל הגוף מאבד יותר מים דרך הזיעה, ולכן שותים לפי הצורך. אין מספר אחד שמתאים לכולם.',
  },
  meal: {
    title: 'ארוחת ערב',
    intro: 'בחרו עד ארבעה דברים לארוחה. כל מיני שילובים יכולים להיות טובים!',
    rows: [{
      title: 'על הצלחת', max: 4, min: 2,
      options: [...foods('rice', 'pasta', 'potato', 'lentils', 'egg', 'fish', 'cheese', 'tomato', 'carrot', 'broccoli'), thing('cookie', '🍪', 'עוגייה')],
    }],
    check(p) {
      if (!has(p, 'rice', 'pasta', 'potato')) return 'נשמע טעים! מה ייתן אנרגיה לערב? אולי אורז, פסטה או תפוח אדמה.';
      if (!has(p, 'lentils', 'egg', 'fish', 'cheese')) return 'כמעט! מה יעזור לגוף לבנות ולהתחזק? אפשר עדשים, ביצה, דג או גבינה.';
      if (!has(p, 'tomato', 'carrot', 'broccoli')) return 'חסר רק קצת צבע. איזה ירק תרצו להוסיף?';
      return null;
    },
    win: 'בתיאבון! ואם יש גם עוגייה, גם זה בסדר: אוכל הוא גם הנאה. ארוחה אחת לא צריכה להכיל הכל, מה שחשוב הוא הגיוון לאורך היום והשבוע.',
  },
  bag: {
    title: 'תיק ליום ארוך',
    intro: 'מחר יום לימודים עד 16:00. בתיק יש מקום לחמישה דברים. מה אורזים?',
    rows: [{
      title: 'בתוך התיק', max: 5, min: 3,
      options: [
        thing('books', '📚', 'ספרים ומחברות'), thing('bottle', '🧴', 'בקבוק מים'), thing('lunch', '🍱', 'אוכל לצהריים'),
        thing('sandwich', '🥪', 'כריך להפסקה'), thing('fruit', '🍎', 'פרי'), thing('ball', '⚽', 'כדור להפסקה'),
        thing('candy', '🍬', 'ממתק קטן'), thing('pillow', '🛏️', 'כרית'), thing('tv', '📺', 'טלוויזיה'),
      ],
    }],
    check(p) {
      if (has(p, 'tv', 'pillow')) return 'התיק נהיה כבד! יש בפנים משהו שעדיף להשאיר בבית.';
      if (!has(p, 'books')) return 'רגע, איך לומדים בלי ספרים ומחברות?';
      if (!has(p, 'bottle')) return 'יום ארוך: מה תשתו בדרך?';
      if (!has(p, 'lunch')) return 'הלימודים נגמרים ב-16:00. מה תאכלו בצהריים?';
      if (!has(p, 'sandwich', 'fruit')) return 'ומה תאכלו בהפסקה של עשר? הוסיפו משהו קטן.';
      return null;
    },
    win: 'התיק מוכן! יש מה לאכול, מה לשתות וגם מקום למשהו כיפי.',
  },
  day: {
    title: 'תוכנית ליום עד 16:00',
    intro: 'תכננו את היום שלכם. בכל שורה בחרו מה הכי מתאים.',
    rows: DAY_ROWS,
    check(p) {
      return weakRow(this.rows, p)?.hint || null;
    },
    win: 'איזה יום מתוכנן! לא כל יום יוצא מושלם, וזה בסדר. מה שחשוב הוא מה שקורה לאורך זמן, ואת זה כבר יודעים לתכנן.',
  },
  finale: {
    title: 'תוכנית האיזון',
    intro: 'בכל אזור למדתם משהו. בחרו בכל שורה את המשפט הנכון, ותוכנית האיזון של מוחי תחזור לפעול!',
    rows: FINALE_ROWS,
    check(p) {
      const bad = this.rows.find((r, i) => p[i][0].id !== r.right);
      return bad ? `כמעט! תחשבו שוב על מה שקרה ב${bad.title}.` : null;
    },
    win: 'התוכנית שלמה! מרכז הפיקוד מתעורר!',
  },
};
