// Missions. Each quest has steps that are checked automatically:
//   talk    - speak with an NPC (npc)
//   collect - carry items: need: [[itemId, count], ...]
//   flag    - a flag set by the world (machine fixed, gate opened...)
//   flags   - several flags, shown as "2/3"
//   visit   - visit zones (zones)
//   quests  - finish other quests (quests)
//   colors  - collect foods of these colors at least once (colors)
// at: [x, z] marks the target on the minimap; find: item ids whose nearest
// pickup is marked instead.
// kind: main (the zone's big mission), side, challenge (timed).
export const QUESTS = {
  // ---------------------------------------------------------------- hub
  tour: {
    zone: 'hub', kind: 'main', giver: 'pipetin', title: 'סיור ב-BIOVERSE',
    intro: 'יש לי רעיון! לכו לבקר בכל חמשת האזורים. בכל אחד מחכה חבר שצריך עזרה.',
    steps: [
      { type: 'visit', zones: ['energy', 'construction', 'jungle', 'water', 'life'], text: 'לבקר בכל האזורים' },
      { type: 'talk', npc: 'mochi', zone: 'hub', text: 'לספר למוחי על הסיור', at: [-2.2, 19.8], say: 'ביקרתם בכל האזורים? מרשים! כמעט כמו אני. עכשיו בואו נחזיר להם את הכוח.' },
    ],
    reward: { coins: 10, stars: 1 },
  },
  command: {
    zone: 'hub', kind: 'main', giver: 'mochi', after: 'tour', title: 'להחזיר את מרכז הפיקוד לפעולה',
    intro: 'המסך שלי מראה שכל האזורים צריכים תיקון. תקנו את המשימה הגדולה בכל אזור, ומרכז הפיקוד יחזור לפעול!',
    steps: [{ type: 'quests', quests: ['power', 'bridge', 'gates', 'pipes', 'schoolDay'], text: 'לתקן את המשימה הגדולה בכל אזור' }],
    reward: { coins: 30, stars: 2 },
  },
  finale: {
    zone: 'hub', kind: 'main', giver: 'mochi', after: 'command', title: 'תוכנית האיזון',
    intro: 'כל האזורים עובדים! ועכשיו נזכרתי: את תוכנית האיזון אפשר להרכיב מחדש ממה שלמדתם בכל אזור. בואו ללוח הבקרה לידי!',
    steps: [{ type: 'flag', flag: 'hFinale', text: 'להרכיב את תוכנית האיזון בלוח הבקרה', at: [2.4, 20] }],
    reward: { coins: 50, stars: 3 },
  },

  // ---------------------------------------------------------------- energy
  power: {
    zone: 'energy', kind: 'main', giver: 'pipetin', title: 'להדליק את תחנת הכוח',
    intro: 'הגנרטור התקלקל! צריך למצוא שלושה חלקים: גלגל שיניים, כבל ונורה. חפשו גבוה ונמוך!',
    steps: [
      { type: 'collect', need: [['gear', 1], ['cable', 1], ['bulb', 1]], text: 'למצוא גלגל שיניים, כבל ונורה', find: ['gear', 'cable', 'bulb'] },
      { type: 'flag', flag: 'eRepaired', text: 'להתקין את החלקים בגנרטור', at: [0, 13.4] },
      { type: 'flag', flag: 'ePower', text: 'להזין את הגנרטור במקורות אנרגיה', at: [0, 13.4], find: ['bread', 'rice', 'pasta', 'potato'] },
    ],
    reward: { coins: 25, stars: 1 },
    thanks: 'תראו את האורות! מכונה צריכה דלק נכון, וגם הגוף. פחמימות הן מקור אנרגיה חשוב.',
  },
  train: {
    zone: 'energy', kind: 'side', giver: 'pipetin', after: 'power', title: 'הרכבת חוזרת לנסוע',
    intro: 'יש חשמל! עכשיו אפשר להפעיל את הרכבת. הידית נמצאת בתחנת הרכבת.',
    steps: [{ type: 'flag', flag: 'eTrain', text: 'להפעיל את הרכבת מהרציף', at: [-23, -8.6] }],
    reward: { coins: 10, stars: 0 },
  },
  lightRace: {
    zone: 'energy', kind: 'challenge', giver: 'pipetin', after: 'power', title: 'מרוץ האורות',
    intro: 'עכשיו כשהעיר מוארת, יש מרוץ! עברו דרך כל טבעות האור לפני שהזמן נגמר.',
    steps: [{ type: 'flag', flag: 'eRace', text: 'לעבור את כל הטבעות בזמן', at: [-3, -24] }],
    reward: { coins: 10, stars: 1 },
  },
  fuel: {
    zone: 'energy', kind: 'side', giver: 'pipetin', after: 'train', title: 'דלק למסע הרכבת',
    intro: 'הרכבת רוצה לצאת למסע ארוך! בואו לרציף ותכננו מה היא לוקחת בכל תחנה.',
    steps: [{ type: 'flag', flag: 'eFuel', text: 'לתכנן את הדלק למסע ברציף', at: [-23, -8.6] }],
    reward: { coins: 15, stars: 1 },
    thanks: 'איזה מסע! ועכשיו אני נזכר: המשקפיים שלי היו על הרכבת כל הזמן. לא, רגע, הם עליי.',
  },

  // ---------------------------------------------------------------- construction
  bridge: {
    zone: 'construction', kind: 'main', giver: 'shriron', title: 'לבנות את הגשר',
    intro: 'הגשר שבור! אספו 4 קרשים ו-2 ברגים, הפעילו את המנוף כדי להוריד קורה, ואז נבנה יחד!',
    steps: [
      { type: 'collect', need: [['plank', 4], ['bolt', 2]], text: 'לאסוף 4 קרשים ו-2 ברגים', find: ['plank', 'bolt'] },
      { type: 'flag', flag: 'cCrane', text: 'להפעיל את המנוף', at: [-4.2, 1] },
      { type: 'flag', flag: 'cBuilt', text: 'להניח את הקרשים על הקורה', at: [0, 8] },
    ],
    reward: { coins: 25, stars: 1 },
    thanks: 'יש גשר! חלבונים עובדים ככה בגוף: בונים ומתקנים כל הזמן. מי הכי חזק? אתם!',
  },
  sorting: {
    zone: 'construction', kind: 'side', giver: 'shriron', after: 'bridge', title: 'פס המיון',
    intro: 'עברתם את הגשר! במפעל השרירים יש פס מיון. עזרו לי למיין מזונות לפי חומרי הבנייה שבהם.',
    steps: [{ type: 'flag', flag: 'cSorted', text: 'למיין את המזונות בפס המיון', at: [0, 22.6] }],
    reward: { coins: 15, stars: 1 },
  },
  builders: {
    zone: 'construction', kind: 'side', giver: 'shriron', after: 'sorting', title: 'השלד של שרירון',
    intro: 'בניתי דגם ענק של הגוף! עכשיו צריך לבחור לכל חלק את החומר שעוזר לו. בואו לפס המיון!',
    steps: [{ type: 'flag', flag: 'cModel', text: 'לבחור חומרים לדגם הגוף', at: [0, 22.6] }],
    reward: { coins: 15, stars: 1 },
    thanks: 'הדגם עומד! עכשיו אני מתרגש, ובשבילי זה אומר להרים עוד משהו כבד!',
  },

  // ---------------------------------------------------------------- jungle
  gates: {
    zone: 'jungle', kind: 'main', giver: 'kibutzi', title: 'שערי הצבעים',
    intro: 'כל שער בגן נפתח רק עם שני פירות או ירקות בצבע שלו: אדום, צהוב וסגול. ואחר כך צריך לתקן את תחנת הסיבים.',
    steps: [
      { type: 'flags', flags: ['jGateRed', 'jGateYellow', 'jGatePurple'], text: 'לפתוח את שלושת שערי הצבעים', at: [20, 16.6], find: ['apple', 'strawberry', 'tomato', 'banana', 'corn', 'grapes', 'eggplant'] },
      { type: 'flag', flag: 'jFiber', text: 'להזין את תחנת הסיבים בשלושה מזונות שונים', at: [-14.2, 22], find: ['carrot', 'broccoli', 'pear', 'orange', 'apple'] },
    ],
    reward: { coins: 25, stars: 1 },
    thanks: 'הגן נפתח והתחנה עובדת! סיבים תזונתיים עוזרים למערכת העיכול לעבוד כמו שצריך.',
  },
  rainbow: {
    zone: 'jungle', kind: 'side', giver: 'kibutzi', title: 'אוסף הקשת',
    intro: 'אתגר בשבילכם: אספו פירות וירקות בחמישה צבעים שונים. ככה זה נראה, גיוון!',
    steps: [{ type: 'colors', colors: ['red', 'orange', 'yellow', 'green', 'purple'], text: 'לאסוף פירות וירקות בחמישה צבעים' }],
    reward: { coins: 15, stars: 1 },
  },
  treetop: {
    zone: 'jungle', kind: 'side', giver: 'kibutzi', after: 'gates', title: 'צמרת העץ',
    intro: 'יש מטבעות על העץ הגדול! קפצו על הפטרייה האדומה, ובאוויר המשיכו קדימה אל הצמרת.',
    steps: [{ type: 'flag', flag: 'jungleTree', text: 'לקפוץ מהפטרייה אל צמרת העץ', at: [2.2, 17.3] }],
    reward: { coins: 10, stars: 0 },
  },
  variety: {
    zone: 'jungle', kind: 'side', giver: 'kibutzi', after: 'gates', title: 'שבוע של צבעים',
    intro: 'בשביל התכנון הגדול צריך שקט. מצאו את המערה הסודית מאחורי העלים, ושם נתכנן שבוע שלם!',
    steps: [
      { type: 'flag', flag: 'jungleCave', text: 'למצוא את המערה הסודית' },
      { type: 'flag', flag: 'jWeek', text: 'לתכנן שבוע צבעוני ליד הגבישים', at: [-28, 11] },
    ],
    reward: { coins: 15, stars: 1 },
    thanks: 'שבוע מעולה! לא צריך לאכול הכל בכל יום. הגיוון קורה לאט, כמו שאבוקדו מבשיל.',
  },

  // ---------------------------------------------------------------- water
  pipes: {
    zone: 'water', kind: 'main', giver: 'tiptip', title: 'להציל את ממלכת המים',
    intro: 'הצינור דולף והסכר סגור! מצאו את מפתח הברגים (אני חושבת שהוא למעלה על מגדל המים), תקנו את הצינור ופתחו את שלושת השסתומים על הסכר!',
    steps: [
      { type: 'collect', need: [['wrench', 1]], text: 'למצוא את מפתח הברגים', find: ['wrench'] },
      { type: 'flag', flag: 'wPipe', text: 'לתקן את הצינור הדולף', at: [18.5, -21.2] },
      { type: 'flags', flags: ['wValve0', 'wValve1', 'wValve2'], text: 'לפתוח את שלושת השסתומים על הסכר', at: [0, 27] },
    ],
    reward: { coins: 25, stars: 1 },
    thanks: 'הצלתם אותנו!!! אני בוכה מאושר. אל תדאגו, יש לי מספיק מים בשביל זה.',
  },
  drops: {
    zone: 'water', kind: 'challenge', giver: 'tiptip', after: 'pipes', title: 'טיפות לכולם',
    intro: 'המים זורמים! עכשיו אספו 12 טיפות לפני שהזמן נגמר. מהר, מהר!',
    steps: [{ type: 'flag', flag: 'wDrops', text: 'לאסוף 12 טיפות בזמן', at: [-3, -8] }],
    reward: { coins: 10, stars: 1 },
  },
  hotDay: {
    zone: 'water', kind: 'side', giver: 'tiptip', after: 'pipes', title: 'מסע ביום חם',
    intro: 'אני יוצאת למסע בשמש הלוהטת! עזרו לי לארוז בתחנת הציוד, אחרת אתאדה!!!',
    steps: [{ type: 'flag', flag: 'wHot', text: 'לארוז ציוד למסע בתחנת הציוד', at: [-2, -17] }],
    reward: { coins: 15, stars: 1 },
    thanks: 'חזרתי בחיים! טוב, הלכתי עד הפינה. אבל היה חם מאוד!',
  },

  // ---------------------------------------------------------------- life
  shopping: {
    zone: 'life', kind: 'main', giver: 'kibutzi', title: 'קניות במכולת',
    intro: 'המקרר בבית ריק! קנו במכולת לחם, גבינה ועגבנייה, וסדרו אותם במקרר.',
    steps: [
      { type: 'collect', need: [['bread', 1], ['cheese', 1], ['tomato', 1]], text: 'לקנות לחם, גבינה ועגבנייה', at: [17.2, -6.4] },
      { type: 'flag', flag: 'lFridge', text: 'לסדר את המצרכים במקרר בבית', at: [-17.9, -0.8] },
    ],
    reward: { coins: 20, stars: 1 },
  },
  meal: {
    zone: 'life', kind: 'main', giver: 'kibutzi', after: 'shopping', title: 'מכינים ארוחה',
    intro: 'המקרר מלא! בואו לכיריים בבית ונכין ארוחת ערב. אין תשובה אחת נכונה, יש המון שילובים טעימים.',
    steps: [{ type: 'flag', flag: 'lMeal', text: 'להכין ארוחה בכיריים', at: [-15.2, -0.9] }],
    reward: { coins: 15, stars: 1 },
    thanks: 'היה טעים מאוד! וזה מה שאני תמיד אומר: מגוון, אבל בלי לחץ.',
  },
  bag: {
    zone: 'life', kind: 'main', giver: 'pipetin', after: 'meal', title: 'אורזים תיק',
    intro: 'מחר יום לימודים ארוך, עד 16:00! ארזו את התיק על השולחן בבית. ואל תשכחו את מה שאני תמיד שוכח!',
    steps: [{ type: 'flag', flag: 'lBag', text: 'לארוז תיק על השולחן בבית', at: [-14, -4.5] }],
    reward: { coins: 15, stars: 1 },
    thanks: 'התיק מוכן! עכשיו לכו לבית הספר. שרירון מחכה בחצר עם המשימה הגדולה.',
  },
  schoolDay: {
    zone: 'life', kind: 'main', giver: 'shriron', after: 'bag', title: 'יום לימודים עד 16:00',
    intro: 'יום ארוך זה כמו מרוץ ארוך! היכנסו לכיתה, ועל הלוח תתכננו את כל היום עד 16:00.',
    steps: [{ type: 'flag', flag: 'lDay', text: 'לתכנן את היום על הלוח בכיתה', at: [0, 28.6] }],
    reward: { coins: 30, stars: 2 },
    thanks: 'תכנון של אלופים! עכשיו מוחי צריך לשמוע על זה. חזרו למרכז העולם!',
  },
  playRace: {
    zone: 'life', kind: 'challenge', giver: 'pipetin', title: 'מסלול גן המשחקים',
    intro: 'בגן המשחקים יש מסלול מכשולים! עברו את כל הטבעות, גם זו שעל המגלשה, לפני שהזמן נגמר.',
    steps: [{ type: 'flag', flag: 'lRace', text: 'לעבור את מסלול המכשולים בזמן', at: [-9.6, 14] }],
    reward: { coins: 10, stars: 1 },
  },
};

export const QUEST_ORDER = Object.keys(QUESTS);
