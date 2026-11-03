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
    steps: [{ type: 'quests', quests: ['power', 'bridge', 'gates', 'pipes', 'shopping'], text: 'לתקן את המשימה הגדולה בכל אזור' }],
    reward: { coins: 30, stars: 2 },
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
  },
  sorting: {
    zone: 'construction', kind: 'side', giver: 'shriron', after: 'bridge', title: 'פס המיון',
    intro: 'עברתם את הגשר! במפעל השרירים יש פס מיון. עזרו לי למיין מזונות לפי חומרי הבנייה שבהם.',
    steps: [{ type: 'flag', flag: 'cSorted', text: 'למיין את המזונות בפס המיון', at: [0, 22.6] }],
    reward: { coins: 15, stars: 1 },
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
  },
  rainbow: {
    zone: 'jungle', kind: 'side', giver: 'kibutzi', title: 'אוסף הקשת',
    intro: 'אתגר בשבילכם: אספו פירות וירקות בחמישה צבעים שונים. ככה זה נראה, גיוון!',
    steps: [{ type: 'colors', colors: ['red', 'orange', 'yellow', 'green', 'purple'], text: 'לאסוף פירות וירקות בחמישה צבעים' }],
    reward: { coins: 15, stars: 1 },
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
  },
  drops: {
    zone: 'water', kind: 'challenge', giver: 'tiptip', after: 'pipes', title: 'טיפות לכולם',
    intro: 'המים זורמים! עכשיו אספו 12 טיפות לפני שהזמן נגמר. מהר, מהר!',
    steps: [{ type: 'flag', flag: 'wDrops', text: 'לאסוף 12 טיפות בזמן', at: [-3, -8] }],
    reward: { coins: 10, stars: 1 },
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
  playRace: {
    zone: 'life', kind: 'challenge', giver: 'pipetin', title: 'מסלול גן המשחקים',
    intro: 'בגן המשחקים יש מסלול מכשולים! עברו את כל הטבעות, גם זו שעל המגלשה, לפני שהזמן נגמר.',
    steps: [{ type: 'flag', flag: 'lRace', text: 'לעבור את מסלול המכשולים בזמן', at: [-9.6, 14] }],
    reward: { coins: 10, stars: 1 },
  },
};

export const QUEST_ORDER = Object.keys(QUESTS);
