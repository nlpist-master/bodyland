import { CHARACTER_BY_ID } from '../data/characters.js';
import { QUEST_ORDER } from '../data/quests.js';
import { html } from './Panel.js';

// The story around the game: the opening, and the ending after Mochi's
// command center comes back to life.

export function openStory(game, onDone) {
  game.panel.open({
    title: 'הבעיה ב-BIOVERSE',
    kind: 'story',
    closable: false,
    onClose: onDone,
    render(body, close) {
      body.appendChild(html(`<div class="story">
        <p>עמוק בתוך הגוף יש עולם שלם: BIOVERSE.</p>
        <p>מוחי, מנהל מרכז הפיקוד, שמר שם את <b>תוכנית האיזון</b>, שאומרת לכל האזורים איך לעבוד יחד. אבל הוא שכח איפה שם אותה!</p>
        <p>בלי התוכנית, העיר חשוכה, הגשר שבור, השערים נעולים והצינורות דולפים.</p>
        <p>פרופסור פיפטין מחפש מישהו אמיץ שיעזור לו. אולי אתם?</p>
      </div>`));
      const btn = html('<button class="btn big">יוצאים להרפתקה!</button>');
      btn.addEventListener('click', () => close());
      body.appendChild(btn);
    },
  });
}

const LESSONS = [
  '⚡ פחמימות נותנות אנרגיה לגוף',
  '🧱 חלבון, סידן, ברזל ושומנים בונים ושומרים עליו',
  '🌈 פירות וירקות בצבעים שונים, לאורך זמן',
  '💧 מים לפי מה שהגוף צריך באותו יום',
  '🏡 אוכל הוא גם הנאה, ואין מזון אחד שעושה הכל',
];

export function openEnding(game, onDone) {
  const { progress, quests, inventory, audio } = game;
  const name = CHARACTER_BY_ID[progress.data.character]?.name || '';
  const done = QUEST_ORDER.filter((id) => quests.isDone(id)).length;
  audio.play('secret');
  game.panel.open({
    title: 'BIOVERSE חזר לחיים!',
    kind: 'ending',
    closable: false,
    onClose: onDone,
    render(body, close) {
      const party = html('<div class="confetti" aria-hidden="true"></div>');
      for (let i = 0; i < 36; i++) {
        const c = document.createElement('i');
        c.style.cssText = `left:${(i * 2.8) % 100}%;animation-delay:${(i % 9) * 0.25}s;background:${['#ffd23f', '#ff5fa2', '#2fd6c3', '#4fc3f7', '#ff9b54'][i % 5]}`;
        party.appendChild(c);
      }
      body.appendChild(party);
      body.appendChild(html(`<div class="story">
        <p><b>כל הכבוד${name ? ', ' + name : ''}!</b> האורות דולקים, הרכבת נוסעת, המים זורמים והגשר עומד.</p>
        <p>ואיפה הייתה תוכנית האיזון? מוחי מצא אותה... בתוך הכובע של פרופסור פיפטין. אף אחד לא מבין איך.</p>
        <p>אבל עכשיו היא כבר לא רק אצלם. היא גם אצלכם:</p>
      </div>`));
      body.appendChild(html(`<ul class="lessons">${LESSONS.map((l) => `<li>${l}</li>`).join('')}</ul>`));
      body.appendChild(html(`<div class="wallet"><span>✔ ${done} משימות</span><span>⭐ ${inventory.stars} כוכבים</span><span>🪙 ${inventory.coins} מטבעות</span></div>`));
      const btn = html('<button class="btn big">ממשיכים לחקור את העולם</button>');
      btn.addEventListener('click', () => close());
      body.appendChild(btn);
      body.appendChild(html('<p class="note">כל החברים מחכים לכם במרכז העולם. אפשר לחזור לכל אזור, ובתפריט ההשהיה אפשר להתחיל משחק חדש.</p>'));
    },
  });
}
