// Everything the player can collect. Foods list the nutrient groups they
// are a good source of: a food can belong to more than one group.
// color is used by the jungle gates ("bring two red foods").
export const GROUPS = {
  carbs: 'פחמימות',
  protein: 'חלבון',
  calcium: 'סידן',
  iron: 'ברזל',
  fats: 'שומנים',
  fiber: 'סיבים תזונתיים',
  vitamins: 'ויטמינים ומינרלים',
  water: 'מים',
  sugar: 'סוכר',
};

const food = (name, icon, groups, info, color) => ({ kind: 'food', name, icon, groups, info, color });
const part = (name, icon, info) => ({ kind: 'part', name, icon, groups: [], info });

export const ITEMS = {
  bread: food('לחם', '🍞', ['carbs', 'fiber'], 'פחמימות שנותנות לגוף אנרגיה לאורך זמן. לחם מלא מוסיף גם סיבים.'),
  rice: food('אורז', '🍚', ['carbs'], 'פחמימות: דלק לריצה, למשחק ולחשיבה.'),
  pasta: food('פסטה', '🍝', ['carbs'], 'פחמימות שנותנות אנרגיה ליום פעיל.'),
  potato: food('תפוח אדמה', '🥔', ['carbs', 'vitamins'], 'ירק עשיר בפחמימות, מקור טוב לאנרגיה.'),
  candy: food('סוכרייה', '🍬', ['sugar'], 'סוכר נותן אנרגיה מהירה שנגמרת מהר. טעים מדי פעם, אבל לא מחליף ארוחה מגוונת.'),
  egg: food('ביצה', '🥚', ['protein', 'fats'], 'מקור לחלבון, שעוזר לבנות ולתחזק את הגוף.'),
  yogurt: food('יוגורט', '🥣', ['protein', 'calcium'], 'חלבון וסידן: חומרי בנייה לשרירים ולעצמות.'),
  cheese: food('גבינה', '🧀', ['calcium', 'protein', 'fats'], 'סידן וחלבון לעצמות ולשרירים.'),
  lentils: food('עדשים', '🫘', ['protein', 'iron', 'fiber'], 'קטנייה קטנה עם חלבון, ברזל וסיבים.'),
  nuts: food('אגוזים', '🥜', ['fats', 'protein'], 'שומנים טובים ועוד רכיבי תזונה. שומנים חשובים לתאים ולמוח.'),
  fish: food('דג', '🐟', ['protein', 'fats'], 'חלבון ושומנים שחשובים לגוף ולמוח.'),
  apple: food('תפוח', '🍎', ['fiber', 'vitamins'], 'פרי אדום עם סיבים וויטמינים.', 'red'),
  strawberry: food('תות', '🍓', ['vitamins', 'fiber'], 'פרי אדום עם ויטמין C.', 'red'),
  tomato: food('עגבנייה', '🍅', ['vitamins', 'fiber'], 'ירק אדום עם ויטמינים.', 'red'),
  banana: food('בננה', '🍌', ['carbs', 'fiber', 'vitamins'], 'פרי צהוב עם פחמימות, סיבים ומינרלים.', 'yellow'),
  corn: food('תירס', '🌽', ['carbs', 'fiber'], 'ירק צהוב עם פחמימות וסיבים.', 'yellow'),
  grapes: food('ענבים', '🍇', ['vitamins', 'fiber'], 'פרי סגול ומתוק עם ויטמינים.', 'purple'),
  eggplant: food('חציל', '🍆', ['fiber', 'vitamins'], 'ירק סגול עם סיבים.', 'purple'),
  carrot: food('גזר', '🥕', ['vitamins', 'fiber'], 'ירק כתום עם ויטמין A, שחשוב לעיניים.', 'orange'),
  orange: food('תפוז', '🍊', ['vitamins', 'fiber'], 'פרי כתום עם ויטמין C.', 'orange'),
  broccoli: food('ברוקולי', '🥦', ['vitamins', 'fiber'], 'ירק ירוק עם ויטמינים, מינרלים וסיבים.', 'green'),
  pear: food('אגס', '🍐', ['fiber', 'vitamins'], 'פרי ירוק עם סיבים.', 'green'),
  drop: { kind: 'food', name: 'טיפת מים', icon: '💧', groups: ['water'], info: 'מים עוזרים לגוף לקרר את עצמו ולהעביר חומרים לכל מקום.' },
  gear: part('גלגל שיניים', '⚙️', 'חלק חילוף לגנרטור של תחנת הכוח.'),
  cable: part('כבל חשמל', '🔌', 'מחבר את הגנרטור לרשת החשמל של העיר.'),
  bulb: part('נורה', '💡', 'נורת הבקרה של תחנת הכוח.'),
  plank: part('קרש', '🪵', 'חלק לבניית הגשר במפעל הבנייה.'),
  bolt: part('בורג', '🔩', 'מחזק את קרשי הגשר.'),
  wrench: part('מפתח ברגים', '🔧', 'כלי לתיקון הצינורות בממלכת המים.'),
};

export const COLOR_NAMES = { red: 'אדום', yellow: 'צהוב', purple: 'סגול', orange: 'כתום', green: 'ירוק' };
