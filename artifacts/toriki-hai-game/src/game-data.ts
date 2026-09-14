export const GAME_TITLE = 'トリキ牌ゲーム';
export const HAND_SIZE = 8;
export const MOUNTAIN_SIZE = 24;

export type TileCategory = 'kushi' | 'tsumami' | 'drink' | 'special';

export type TileDefinition = {
  id: string;
  name: string;
  category: TileCategory;
  categoryLabel: string;
  short: string;
  image: string;
  hue: string;
  border: string;
  text: string;
};

const tile = (
  id: string,
  name: string,
  category: TileCategory,
  short: string,
  image: string,
  hue: string,
  border: string,
  text: string,
): TileDefinition => ({
  id, name, category, short, image, hue, border, text,
  categoryLabel: category === 'kushi' ? '串' : category === 'tsumami' ? 'つまみ・〆' : category === 'drink' ? 'ドリンク・デザート' : '特殊',
});

export const MENU_TILES: TileDefinition[] = [
  tile('momo', 'もも貴族焼', 'kushi', 'もも', 'momo.png', '#ad3d31', '#c87868', '#9d3028'),
  tile('mune', 'むね貴族焼', 'kushi', 'むね', 'mune.png', '#b44a31', '#d18a72', '#9d3028'),
  tile('tsukune', 'つくねチーズ', 'kushi', 'つくね', 'tsukune.png', '#a93736', '#ce7770', '#9d3028'),
  tile('heart', 'ハート塩', 'kushi', 'ハート', 'heart.png', '#8e3a3f', '#c27c79', '#9d3028'),
  tile('mochi', 'もちもちチーズ', 'kushi', 'もち', 'mochi.png', '#b45835', '#d49a78', '#9d3028'),
  tile('gyu', '牛串焼', 'kushi', '牛串', 'gyu.png', '#793c35', '#b8756d', '#9d3028'),
  tile('karaage', 'トリキの唐揚', 'tsumami', '唐揚', 'karaage.png', '#c48622', '#e1bd67', '#a36a10'),
  tile('nanban', 'チキン南蛮', 'tsumami', '南蛮', 'nanban.png', '#d09b2c', '#e2c56c', '#a36a10'),
  tile('kamameshi', 'とり釜飯', 'tsumami', '釜飯', 'kamameshi.png', '#ba7923', '#ddb068', '#a36a10'),
  tile('potato', 'ポテトサラダ', 'tsumami', 'ポテサラ', 'potato.png', '#c39a36', '#dfc986', '#a36a10'),
  tile('yamaimo', '山芋の鉄板焼', 'tsumami', '山芋', 'yamaimo.png', '#b77e28', '#dbb66f', '#a36a10'),
  tile('tamago', '味付煮玉子', 'tsumami', '煮玉子', 'tamago.png', '#cb8b25', '#e3be70', '#a36a10'),
  tile('kinmugi', 'メガ金麦', 'drink', '金麦', 'kinmugi.png', '#317c9d', '#76b5c8', '#23647f'),
  tile('highball', 'メガハイボール', 'drink', 'ハイボール', 'highball.png', '#286c92', '#6ba8c2', '#23647f'),
  tile('lemon', 'メガレモンサワー', 'drink', 'レモン', 'lemon.png', '#3d86a3', '#7db8c8', '#23647f'),
  tile('catalana', 'カタラーナアイス', 'drink', 'カタラーナ', 'catalana.png', '#397596', '#77a9b9', '#23647f'),
];

export const CABBAGE_TILE: TileDefinition = tile('cabbage', 'キャベツ盛', 'special', '盛', 'cabbage.png', '#38815a', '#78ae82', '#2d704b');
export const MENU_BY_ID = Object.fromEntries(MENU_TILES.map((item) => [item.id, item])) as Record<string, TileDefinition>;