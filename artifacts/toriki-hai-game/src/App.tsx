import { useState, type CSSProperties } from 'react';
import { ArrowDown, CircleHelp, Play, RotateCcw, X } from 'lucide-react';
import { GAME_TITLE, MENU_BY_ID } from './game-data';
import { calculateScore, createGame, discardAt, drawNext, strengthenAt, type GameState, type HandTile } from './game-logic';

const CATEGORY_CLASS: Record<string, string> = { kushi: 'cat-seg-kushi', tsumami: 'cat-seg-tsumami', drink: 'cat-seg-drink' };

function TileCard({ item, game, index, onPick }: { item: HandTile; game: GameState; index: number; onPick: (index: number) => void }) {
  const definition = MENU_BY_ID[item.typeId];
  const [imageMissing, setImageMissing] = useState(false);
  const actionable = game.status === 'discard' || game.status === 'strengthen';
  const actionLabel = game.status === 'discard' ? `${definition.name}を捨てる` : `${definition.name}を強化する`;
  return (
    <button
      type="button"
      className={`tile-card ${actionable ? 'is-actionable' : ''} ${game.status === 'discard' ? 'is-discard' : ''} ${game.status === 'strengthen' ? 'is-strengthen' : ''}`}
      style={{ '--tile-border': definition.border, '--tile-text': definition.text } as CSSProperties}
      onClick={() => onPick(index)}
      disabled={!actionable}
      aria-label={actionable ? actionLabel : `${definition.name} Lv.${item.level}`}
      data-testid={`tile-card-${item.uid}`}
    >
      <div className={`tile-art ${imageMissing ? 'is-placeholder' : ''}`} style={{ '--tile-art': `linear-gradient(140deg, ${definition.hue}, ${definition.hue}cc)` } as CSSProperties} data-slot={definition.image}>
        {!imageMissing && <img className="tile-image" src={`${import.meta.env.BASE_URL}menu/${definition.image}`} alt="" onError={() => setImageMissing(true)} />}
        <span className="tile-art-label">{imageMissing ? definition.short : ''}</span>
        {imageMissing && <span className="tile-art-note">画像準備中</span>}
        <span className="tile-level">Lv.{item.level}</span>
      </div>
      <span className="tile-name">{definition.name}</span>
      <span className="tile-category">{definition.categoryLabel}</span>
      <span className="tile-pool" aria-label={`プール ${item.pool.length}枚`}>
        {item.pool.length > 0 && <span className="pool-label">プール</span>}
        {item.pool.map((source, poolIndex) => <span className={`pool-dot ${source === 'cabbage' ? 'cabbage' : ''}`} style={{ '--pool-color': source === 'cabbage' ? '#38815a' : definition.text } as CSSProperties} key={`${item.uid}-pool-${poolIndex}`}>{source === 'cabbage' ? '盛' : '牌'}</span>)}
      </span>
    </button>
  );
}

function MountainBar({ count }: { count: number }) {
  return (
    <div className="mountain-bar" data-testid="status-mountain">
      <div className="mountain-label"><span className="mountain-icon" aria-hidden="true" /><span>山の残り</span></div>
      <div className="mountain-count" data-testid="text-mountain-count">{count}<small>枚</small></div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading"><h2 id="help-title">遊び方</h2><button type="button" className="icon-button" onClick={onClose} aria-label="遊び方を閉じる" data-testid="button-close-help"><X size={19} /></button></div>
        <ol className="help-list">
          <li><span className="help-number">1</span><div><strong>牌を引く</strong>「ドロー」で山から1枚。山は全部で24枚です。</div></li>
          <li><span className="help-number">2</span><div><strong>同じ牌は育つ</strong>同じ商品は自動で合体し、Lv.4まで上がります。合体した牌はプールに残ります。</div></li>
          <li><span className="help-number">3</span><div><strong>9枚なら1枚捨てる</strong>引いた牌が新しい商品なら、手札から1枚選びます。Lv.付きの牌はプールごと捨てます。</div></li>
          <li><span className="help-number">4</span><div><strong>キャベツ盛</strong>緑の特殊牌を引いたら、強化する手札を選択。キャベツはプールに表示されます。</div></li>
          <li><span className="help-number">5</span><div><strong>3・3・2を目指す</strong>最後の8枚を「串3 / つまみ・〆3 / ドリンク・デザート2」に近づけるほど高得点です。</div></li>
        </ol>
        <button type="button" className="modal-close" onClick={onClose} data-testid="button-dismiss-help">ゲームに戻る</button>
      </section>
    </div>
  );
}

function FinishCard({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const score = calculateScore(game.hand);
  const categoryTotal = Math.max(1, score.categories.kushi + score.categories.tsumami + score.categories.drink);
  return (
    <section className="finish-card" data-testid="panel-score">
      <span className="finish-kicker">GAME COMPLETE</span>
      <h2>{score.exact ? 'きれいな三三二です。' : 'おつかれさまでした。'}</h2>
      <div className="score-big" data-testid="text-final-score">{score.total}<small>点</small></div>
      <div className="score-rows">
        <div className="score-row"><span>3・3・2 バランス</span><strong>{score.exact ? '満点 +100' : `${score.balancePoints}点`}</strong></div>
        <div className="score-row"><span>牌のレベル合計</span><strong>{score.levelPoints}点</strong></div>
      </div>
      <div className="category-track" aria-label="カテゴリ構成">
        <span className="cat-seg-kushi" style={{ width: `${score.categories.kushi / categoryTotal * 100}%` }} />
        <span className="cat-seg-tsumami" style={{ width: `${score.categories.tsumami / categoryTotal * 100}%` }} />
        <span className="cat-seg-drink" style={{ width: `${score.categories.drink / categoryTotal * 100}%` }} />
      </div>
      <div className="category-legend">
        <span><i className="legend-dot cat-seg-kushi" />串 {score.categories.kushi}</span>
        <span><i className="legend-dot cat-seg-tsumami" />つまみ・〆 {score.categories.tsumami}</span>
        <span><i className="legend-dot cat-seg-drink" />ドリンク・デザート {score.categories.drink}</span>
      </div>
      <button type="button" className="start-button" onClick={onRestart} data-testid="button-restart-finish"><RotateCcw size={18} />もう一度遊ぶ</button>
    </section>
  );
}

function Landing({ onStart, onHelp }: { onStart: () => void; onHelp: () => void }) {
  return (
    <main className="screen-wrap">
      <header className="game-header"><div className="brand-lockup"><span className="brand-mark">串</span><div><p className="brand-kicker">IZAKAYA SCORE ATTACK</p><p className="brand-title">{GAME_TITLE}</p></div></div><button type="button" className="icon-button" onClick={onHelp} aria-label="遊び方を開く" data-testid="button-open-help"><CircleHelp size={20} /></button></header>
      <section className="hero">
        <span className="eyebrow">一手ずつ、いい夜を。</span>
        <h1>今夜の一皿を<br /><em>育てよう。</em></h1>
        <p className="hero-copy">焼き鳥、つまみ、グラス。24枚の山から牌を引き、重ね、選ぶ。最後に残る8枚で、あなたの一軒をつくります。</p>
        <div className="rule-strip" aria-label="カテゴリカラー"><span className="r" /><span className="y" /><span className="b" /><span className="g" /></div>
        <button type="button" className="start-button" onClick={onStart} data-testid="button-start-game"><Play size={18} fill="currentColor" />ゲームを始める</button>
        <p className="sub-note">手札8枚 / 山24枚 / 目標 3・3・2</p>
      </section>
      <footer className="footer-note">画面を片手で持って遊べます</footer>
    </main>
  );
}

function GameScreen({ game, onDraw, onPick, onRestart, onHelp }: { game: GameState; onDraw: () => void; onPick: (index: number) => void; onRestart: () => void; onHelp: () => void }) {
  const isFinished = game.status === 'finished';
  const statusTitle = game.status === 'discard' ? '1枚選んで捨ててください' : game.status === 'strengthen' ? '強化する牌を選んでください' : isFinished ? 'ゲーム終了' : '次の一手を選びましょう';
  const statusDetail = game.status === 'discard' ? '黄色い枠の牌をタップすると捨てられます。' : game.status === 'strengthen' ? '緑の枠から、キャベツ盛をのせる牌を選びます。' : isFinished ? '最後の8枚でスコアを計算しました。' : game.lastEvent;
  return (
    <main className="screen-wrap">
      <header className="game-header"><div className="brand-lockup"><span className="brand-mark">串</span><div><p className="brand-kicker">IZAKAYA SCORE ATTACK</p><p className="brand-title">{GAME_TITLE}</p></div></div><button type="button" className="icon-button" onClick={onHelp} aria-label="遊び方を開く" data-testid="button-open-help-game"><CircleHelp size={20} /></button></header>
      <MountainBar count={game.mountain.length} />
      <section className="game-main">
        <div className={`turn-status ${game.status === 'discard' ? 'is-discard' : ''} ${game.status === 'strengthen' ? 'is-strengthen' : ''}`} role="status" data-testid="status-turn"><strong>{statusTitle}</strong><span>{statusDetail}</span></div>
        <div className="hand-heading"><h2>あなたの手札</h2><span>{game.hand.length} / 8 枚</span></div>
        <div className="hand-grid" data-testid="grid-hand">{game.hand.map((item, index) => <TileCard key={`${item.uid}-${item.level}`} item={item} game={game} index={index} onPick={onPick} />)}</div>
        {(game.status === 'discard' || game.status === 'strengthen') && <p className="action-hint">{game.status === 'discard' ? '捨てたい牌をタップ' : '強化したい牌をタップ'}</p>}
        {!isFinished && <div className="draw-panel"><button type="button" className="draw-button" disabled={game.status !== 'ready' || game.mountain.length === 0} onClick={onDraw} data-testid="button-draw"><ArrowDown size={18} />牌を引く</button><button type="button" className="restart-button" onClick={onRestart} aria-label="ゲームを最初からやり直す" data-testid="button-restart"><RotateCcw size={18} /><span>やり直す</span></button></div>}
        <p className="discard-count">捨て牌 {game.discardPile.length}枚</p>
        {isFinished && <FinishCard game={game} onRestart={onRestart} />}
      </section>
    </main>
  );
}

function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const startGame = () => setGame(createGame());
  const onDraw = () => setGame((current) => current ? drawNext(current) : current);
  const onPick = (index: number) => setGame((current) => {
    if (!current) return current;
    if (current.status === 'discard') return discardAt(current, index);
    if (current.status === 'strengthen') return strengthenAt(current, index);
    return current;
  });
  return (
    <div className="game-app">
      {game ? <GameScreen game={game} onDraw={onDraw} onPick={onPick} onRestart={startGame} onHelp={() => setHelpOpen(true)} /> : <Landing onStart={startGame} onHelp={() => setHelpOpen(true)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default App;