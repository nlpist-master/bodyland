import { ITEMS } from './items.js';
import { QUEST_ORDER } from './quests.js';
import { ZONE_ORDER } from './zones.js';

// Badges earned by playing. got(game) is checked now and then; once earned,
// a badge stays in the save file.
const flag = (game, name) => !!game.progress.data.flags[name];
const done = (game, id) => game.quests.isDone(id);

export const ACHIEVEMENTS = [
  { id: 'first', icon: '🎒', title: 'יוצאים לדרך', text: 'לסיים משימה ראשונה', got: (g) => QUEST_ORDER.some((id) => done(g, id)) },
  { id: 'explorer', icon: '🧭', title: 'מגלי עולמות', text: 'לבקר בכל חמשת האזורים', got: (g) => ZONE_ORDER.every((z) => g.progress.data.visited[z]) },
  { id: 'power', icon: '⚡', title: 'מדליקי העיר', text: 'להדליק את תחנת הכוח', got: (g) => done(g, 'power') },
  { id: 'bridge', icon: '🌉', title: 'בוני הגשר', text: 'לבנות את הגשר', got: (g) => done(g, 'bridge') },
  { id: 'water', icon: '💧', title: 'מצילי המים', text: 'להציל את ממלכת המים', got: (g) => done(g, 'pipes') },
  { id: 'cave', icon: '💎', title: 'סוד במערה', text: 'למצוא את המערה הסודית', got: (g) => flag(g, 'jungleCave') },
  { id: 'tree', icon: '🌳', title: 'בצמרת העץ', text: 'לקפוץ עד צמרת העץ', got: (g) => flag(g, 'jungleTree') },
  { id: 'rainbow', icon: '🌈', title: 'אוספי הקשת', text: 'לאסוף חמישה צבעים', got: (g) => done(g, 'rainbow') },
  { id: 'racer', icon: '⏱️', title: 'אלופי הזמן', text: 'לנצח בכל שלושת אתגרי הזמן', got: (g) => ['eRace', 'wDrops', 'lRace'].every((f) => flag(g, f)) },
  { id: 'foods', icon: '🍽️', title: 'טועמים הכל', text: 'לאסוף 15 סוגי מזון שונים', got: (g) => Object.keys(g.progress.data.seen).filter((id) => ITEMS[id]?.kind === 'food').length >= 15 },
  { id: 'upgrade', icon: '🔧', title: 'משדרגים', text: 'לקנות שדרוג ראשון', got: (g) => Object.keys(g.progress.data.upgrades).length > 0 },
  { id: 'planner', icon: '📅', title: 'מתכננים מעולים', text: 'לתכנן יום לימודים עד 16:00', got: (g) => flag(g, 'lDay') },
  { id: 'hero', icon: '🏆', title: 'גיבורי BIOVERSE', text: 'להרכיב את תוכנית האיזון', got: (g) => flag(g, 'hFinale') },
  { id: 'all', icon: '👑', title: 'הכל הושלם', text: 'לסיים את כל המשימות', got: (g) => QUEST_ORDER.every((id) => done(g, id)) },
];
