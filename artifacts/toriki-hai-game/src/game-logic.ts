import { CABBAGE_TILE, HAND_SIZE, MENU_BY_ID, MENU_TILES, MOUNTAIN_SIZE } from './game-data';

export type PoolToken = 'normal' | 'cabbage';
export type HandTile = { uid: string; typeId: string; level: number; pool: PoolToken[] };
export type GameStatus = 'ready' | 'discard' | 'strengthen' | 'finished';
export type GameState = {
  hand: HandTile[];
  mountain: string[];
  discardPile: HandTile[];
  status: GameStatus;
  pendingDraw: string | null;
  lastEvent: string;
  flashUid: string | null;
};

let uidCounter = 0;
const nextUid = () => `tile-${++uidCounter}`;

const shuffled = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
};

const createTile = (typeId: string): HandTile => ({ uid: nextUid(), typeId, level: 1, pool: [] });

const strengthen = (handTile: HandTile, source: PoolToken) => ({
  ...handTile,
  level: Math.min(4, handTile.level + 1),
  pool: handTile.level >= 4 ? handTile.pool : [...handTile.pool, source],
});

const addOrMerge = (hand: HandTile[], typeId: string, source: PoolToken = 'normal') => {
  const existingIndex = hand.findIndex((item) => item.typeId === typeId);
  if (existingIndex === -1) return { hand: [...hand, createTile(typeId)], merged: false, uid: null };
  const existing = hand[existingIndex];
  const merged = strengthen(existing, source);
  const nextHand = [...hand];
  nextHand[existingIndex] = merged;
  return { hand: nextHand, merged: true, uid: existing.uid };
};

const normalizeInitialHand = (initialIds: string[], mountain: string[]) => {
  let hand: HandTile[] = [];
  let event = '最初の8枚を配りました。';
  let flashUid: string | null = null;
  initialIds.forEach((typeId) => {
    if (typeId === CABBAGE_TILE.id) return;
    const result = addOrMerge(hand, typeId);
    hand = result.hand;
    if (result.merged) event = '重なった牌を自動でまとめました。';
    flashUid = result.uid;
  });
  initialIds.filter((typeId) => typeId === CABBAGE_TILE.id).forEach(() => {
    if (hand.length) {
      const targetIndex = hand.reduce((best, item, index, list) => item.level < list[best].level ? index : best, 0);
      const result = strengthen(hand[targetIndex], 'cabbage');
      hand = hand.map((item, index) => index === targetIndex ? result : item);
      flashUid = result.uid;
      event = 'キャベツ盛で牌をひとつ強化しました。';
    }
  });
  while (hand.length < HAND_SIZE && mountain.length) {
    const typeId = mountain.shift();
    if (!typeId) break;
    if (typeId === CABBAGE_TILE.id) {
      if (hand.length) {
        const targetIndex = hand.reduce((best, item, index, list) => item.level < list[best].level ? index : best, 0);
        const result = strengthen(hand[targetIndex], 'cabbage');
        hand = hand.map((item, index) => index === targetIndex ? result : item);
        flashUid = result.uid;
        event = 'キャベツ盛を初期処理しました。';
      }
      continue;
    }
    const result = addOrMerge(hand, typeId);
    hand = result.hand;
    if (result.merged) {
      event = '補充中に同じ牌が重なりました。';
      flashUid = result.uid;
    }
  }
  return { hand, mountain, event, flashUid };
};

export const createGame = (): GameState => {
  const deck = shuffled([...MENU_TILES.flatMap((tile) => [tile.id, tile.id, tile.id, tile.id]), ...Array(4).fill(CABBAGE_TILE.id)]);
  const initialIds = deck.slice(0, HAND_SIZE);
  const mountain = deck.slice(HAND_SIZE, HAND_SIZE + MOUNTAIN_SIZE);
  const initial = normalizeInitialHand(initialIds, mountain);
  return {
    hand: initial.hand,
    mountain: initial.mountain,
    discardPile: [],
    status: initial.mountain.length ? 'ready' : 'finished',
    pendingDraw: null,
    lastEvent: initial.event,
    flashUid: initial.flashUid,
  };
};

export const drawNext = (state: GameState): GameState => {
  if (state.status !== 'ready' || state.mountain.length === 0) {
    return state.mountain.length === 0 ? { ...state, status: 'finished', lastEvent: '山がなくなりました。最終手札を確認しましょう。' } : state;
  }
  let mountain = [...state.mountain];
  let hand = [...state.hand];
  let lastEvent = '牌を引きました。';
  let flashUid: string | null = null;
  while (mountain.length) {
    const typeId = mountain.shift();
    if (!typeId) break;
    if (typeId === CABBAGE_TILE.id) {
      return { ...state, hand, mountain, status: 'strengthen', pendingDraw: CABBAGE_TILE.id, lastEvent: 'キャベツ盛です。強化する牌を選んでください。', flashUid: null };
    }
    const result = addOrMerge(hand, typeId);
    hand = result.hand;
    if (result.merged) {
      flashUid = result.uid;
      lastEvent = `${MENU_BY_ID[typeId].name}がLv.${hand.find((item) => item.uid === result.uid)?.level ?? 2}に上がりました。続けてドローします。`;
      continue;
    }
    return { ...state, hand, mountain, status: 'discard', pendingDraw: typeId, lastEvent: '9枚になりました。捨てる牌を1枚選んでください。', flashUid };
  }
  return { ...state, hand, mountain, status: 'finished', pendingDraw: null, lastEvent: '山がなくなりました。最終手札を確認しましょう。', flashUid };
};

export const discardAt = (state: GameState, index: number): GameState => {
  if (state.status !== 'discard' || !state.hand[index]) return state;
  const discarded = state.hand[index];
  const hand = state.hand.filter((_, itemIndex) => itemIndex !== index);
  const next: GameState = {
    ...state,
    hand,
    discardPile: [...state.discardPile, discarded],
    status: 'ready',
    pendingDraw: null,
    lastEvent: `${MENU_BY_ID[discarded.typeId].name}を捨てました。次の牌を引きましょう。`,
    flashUid: null,
  };
  return next.mountain.length ? next : { ...next, status: 'finished', lastEvent: '最後の牌を処理しました。最終手札を確認しましょう。' };
};

export const strengthenAt = (state: GameState, index: number): GameState => {
  if (state.status !== 'strengthen' || !state.hand[index]) return state;
  const target = state.hand[index];
  const boosted = strengthen(target, 'cabbage');
  const hand = state.hand.map((item, itemIndex) => itemIndex === index ? boosted : item);
  const next = { ...state, hand, status: 'ready' as const, pendingDraw: null, lastEvent: `${MENU_BY_ID[target.typeId].name}をキャベツ盛で強化しました。`, flashUid: boosted.uid };
  return state.mountain.length ? drawNext(next) : { ...next, status: 'finished', lastEvent: '最後のキャベツ盛を使いました。最終手札を確認しましょう。' };
};

export type ScoreResult = {
  total: number;
  levelPoints: number;
  balancePoints: number;
  categories: { kushi: number; tsumami: number; drink: number };
  exact: boolean;
};

export const calculateScore = (hand: HandTile[]): ScoreResult => {
  const categories = hand.reduce((counts, item) => {
    const category = MENU_BY_ID[item.typeId].category;
    if (category !== 'special') counts[category] += 1;
    return counts;
  }, { kushi: 0, tsumami: 0, drink: 0 });
  const exact = categories.kushi === 3 && categories.tsumami === 3 && categories.drink === 2;
  const gap = Math.abs(categories.kushi - 3) + Math.abs(categories.tsumami - 3) + Math.abs(categories.drink - 2);
  const levelPoints = hand.reduce((sum, item) => sum + item.level * 13, 0);
  const balancePoints = Math.max(0, 420 - gap * 85) + (exact ? 100 : 0);
  return { total: levelPoints + balancePoints, levelPoints, balancePoints, categories, exact };
};