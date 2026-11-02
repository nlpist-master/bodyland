// The three playable characters. They differ only in looks, never in abilities.
export const CHARACTERS = [
  {
    id: 'dvori',
    name: 'דבורי',
    blurb: 'סקרנית ואוהבת לגלות סודות',
    type: 'girl',
    hairStyle: 'braids',
    skin: 0xf6cfae,
    hair: 0x6b3e26,
    accent: 0xff5fa2,   // ribbons
    shirt: 0xff9cc8,
    collar: 0xffffff,
    skirt: 0x7a4bc0,
    legs: 0x4f3d72,
    shoes: 0x3a2440,
    bag: 0xffc94a,
  },
  {
    id: 'yaeli',
    name: 'יעלי',
    blurb: 'זריזה ותמיד מוכנה למשימה',
    type: 'girl',
    hairStyle: 'ponytail',
    skin: 0xffdcc2,
    hair: 0xc98a45,
    accent: 0x2fd6c3,   // bow + scrunchie
    shirt: 0x5ed6cc,
    collar: 0xffffff,
    skirt: 0x2f5fa8,
    legs: 0x26385e,
    shoes: 0x1e2a44,
    bag: 0xff7b54,
  },
  {
    id: 'uri',
    name: 'אורי',
    blurb: 'אוהב לבנות ולתקן מכונות',
    type: 'boy',
    hairStyle: 'short',
    skin: 0xf3c7a2,
    hair: 0x6a4428,
    kippah: 0x15152a,
    shirt: 0xffffff,
    collar: 0xffffff,
    pants: 0x243457,
    shoes: 0x222222,
    bag: 0x4cbf5a,
    tzitzit: 0xfafafa,
  },
];

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));
