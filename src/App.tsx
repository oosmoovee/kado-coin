import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, Award, Check, ChevronRight, CircleHelp,
  Coins, Copy, Crown, ExternalLink, Flame, Heart, Minus,
  RotateCcw, Send, Settings, Share2, ShoppingBag, Sparkles, Volume2, VolumeX, X, Zap,
} from 'lucide-react'
import {
  ACHIEVEMENTS, EVOLUTIONS, PRESTIGE_REQUIREMENT, SAVE_KEY, UPGRADES, awardPoints,
  createInitialState, formatNumber, getEvolution, pointsPerClick, pointsPerSecond,
  productionMultiplier, purchaseUpgrade, restoreSave, upgradeCost, type GameState,
} from './game'

type EventType = 'zoomies' | 'viral' | 'nap'
type GameEvent = { type: EventType; endsAt: number; title: string; description: string }
type Tab = 'play' | 'shop' | 'stats' | 'achievements'

const COMMUNITY_URL = import.meta.env.VITE_COMMUNITY_URL || ''
const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/KADOCOINCOMMUNITY'
const TWITTER_URL = import.meta.env.VITE_TWITTER_URL || 'https://x.com/KadoCoinDev'
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '8Eznb1ZdDjxa7ayXxDbieW2uRG5xgn1L3rudRz4Rpump'

function App() {
  const reduceMotion = useReducedMotion()
  const [game, setGame] = useState<GameState>(() => {
    const restored = restoreSave(localStorage.getItem(SAVE_KEY))
    return restored.game
  })
  const [offlineEarnings, setOfflineEarnings] = useState(() => restoreSave(localStorage.getItem(SAVE_KEY)).offlineEarnings)
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<'settings' | 'prestige' | 'import' | 'help' | null>(null)
  const [tab, setTab] = useState<Tab>('play')
  const [muted, setMuted] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [combo, setCombo] = useState(0)
  const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number }[]>([])
  const [importText, setImportText] = useState('')
  const [copied, setCopied] = useState(false)
  const audioContext = useRef<AudioContext | null>(null)
  const dogButton = useRef<HTMLButtonElement | null>(null)
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idRef = useRef(0)

  const ppc = pointsPerClick(game)
  const pps = pointsPerSecond(game) * productionMultiplier(game)
  const evolutionIndex = getEvolution(game.lifetimePoints)
  const evolution = EVOLUTIONS[evolutionIndex]
  const nextEvolution = EVOLUTIONS[evolutionIndex + 1]
  const unlocked = game.achievements.length
  const previousEvolution = useRef(evolutionIndex)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => current === message ? '' : current), 2800)
  }, [])

  const save = useCallback((state: GameState) => {
    const updated = { ...state, lastSavedAt: Date.now() }
    localStorage.setItem(SAVE_KEY, JSON.stringify(updated))
    return updated
  }, [])

  const playSound = useCallback((frequency = 620, duration = 0.065) => {
    if (!soundOn || muted) return
    try {
      audioContext.current ??= new AudioContext()
      const context = audioContext.current
      if (context.state === 'suspended') void context.resume()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, context.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.65, context.currentTime + duration)
      gain.gain.setValueAtTime(0.09, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + duration)
    } catch (error) {
      console.warn('Unable to play click sound:', error)
    }
  }, [muted, soundOn])

  useEffect(() => {
    const restored = restoreSave(localStorage.getItem(SAVE_KEY))
    setGame(save(restored.game))
    if (restored.offlineEarnings > 0) {
      setOfflineEarnings(restored.offlineEarnings)
      notify(`While you were away, Kado fetched ${formatNumber(restored.offlineEarnings)} points!`)
    } else if (restored.corrupted) notify('Your save was corrupted, so a fresh game has started.')
  }, [notify, save])

  useEffect(() => {
    const tick = window.setInterval(() => {
      setGame((current) => {
        return {
          ...awardPoints(current, pps * (activeEvent?.type === 'viral' ? 2 : 1)),
          playTime: current.playTime + 1,
        }
      })
      if (activeEvent) {
        const remaining = Math.max(0, Math.ceil((activeEvent.endsAt - Date.now()) / 1000))
        setSecondsLeft(remaining)
        if (remaining === 0) {
          setActiveEvent(null)
          if (activeEvent.type === 'nap') {
            const bonus = Math.max(100, pps * 20)
            setGame((current) => awardPoints(current, bonus))
            notify(`Kado woke up with a ${formatNumber(bonus)} point bonus!`)
          } else notify(`${activeEvent.title} is over!`)
        }
      }
    }, 1000)
    return () => window.clearInterval(tick)
  }, [activeEvent, notify, pps])

  useEffect(() => {
    if (activeEvent) return
    const timer = window.setTimeout(() => {
      const type: EventType = Math.random() < 1 / 3 ? 'zoomies' : Math.random() < 0.5 ? 'viral' : 'nap'
      const config = {
        zoomies: { title: 'KADO ZOOMIES', description: '5× points per click', duration: 15 },
        viral: { title: 'VIRAL MOMENT', description: '2× passive production', duration: 30 },
        nap: { title: 'NAP TIME', description: 'Kado is resting. Wake-up bonus incoming!', duration: 12 },
      }[type]
      setActiveEvent({ type, title: config.title, description: config.description, endsAt: Date.now() + config.duration * 1000 })
      setSecondsLeft(config.duration)
      notify(`${config.title}! ${config.description}`)
    }, 45_000 + Math.random() * 45_000)
    return () => window.clearTimeout(timer)
  }, [activeEvent, notify])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => save(current))
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [save])

  useEffect(() => () => {
    if (comboTimer.current) clearTimeout(comboTimer.current)
    if (audioContext.current) void audioContext.current.close()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || modal || event.repeat) return
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName))) return
      event.preventDefault()
      dogButton.current?.click()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modal])

  useEffect(() => {
    const nextAchievements = ACHIEVEMENTS.filter((item) => !game.achievements.includes(item.id) && item.check(game))
    if (nextAchievements.length) {
      setGame((current) => ({ ...current, achievements: [...current.achievements, ...nextAchievements.map((item) => item.id)] }))
      nextAchievements.forEach((item) => notify(`Achievement unlocked: ${item.name} ${item.icon}`))
    }
  }, [game, notify])

  useEffect(() => {
    if (evolutionIndex > previousEvolution.current) notify(`Evolution unlocked: ${EVOLUTIONS[evolutionIndex].name}!`)
    previousEvolution.current = evolutionIndex
  }, [evolutionIndex, notify])

  const handleClickKado = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const id = ++idRef.current
    const x = event.detail === 0 ? rect.width / 2 : event.clientX - rect.left
    const y = event.detail === 0 ? rect.height / 2 : event.clientY - rect.top
    const comboBonus = Math.floor(combo / 5)
    const clickMultiplier = activeEvent?.type === 'zoomies' ? 5 : 1
    setClickEffects((effects) => [...effects.slice(-12), { id, x, y }])
    setGame((current) => {
      const amount = (ppc + comboBonus) * clickMultiplier
      const updated = awardPoints(current, amount)
      updated.clicks += 1
      return updated
    })
    setCombo((value) => Math.min(value + 1, 25))
    if (comboTimer.current) clearTimeout(comboTimer.current)
    comboTimer.current = setTimeout(() => setCombo(0), 1500)
    playSound()
  }

  const buyUpgrade = (upgrade: typeof UPGRADES[number]) => {
    const updated = purchaseUpgrade(game, upgrade)
    if (!updated) return
    setGame(save(updated))
    playSound(420, 0.11)
    notify(`${upgrade.name} acquired!`)
  }

  const startEvent = (type: EventType) => {
    if (activeEvent) return
    const config = {
      zoomies: { title: 'KADO ZOOMIES', description: '5× points per click', duration: 15 },
      viral: { title: 'VIRAL MOMENT', description: '2× passive production', duration: 30 },
      nap: { title: 'NAP TIME', description: 'Kado is resting. Wake-up bonus incoming!', duration: 12 },
    }[type]
    setActiveEvent({ type, title: config.title, description: config.description, endsAt: Date.now() + config.duration * 1000 })
    setSecondsLeft(config.duration)
    notify(`${config.title}! ${config.description}`)
  }

  const triggerRandomEvent = () => {
    if (activeEvent) return
    const roll = Math.random()
    if (roll < 0.34) startEvent('zoomies')
    else if (roll < 0.67) startEvent('viral')
    else startEvent('nap')
  }

  const livePps = pps * (activeEvent?.type === 'viral' ? 2 : 1)
  const handlePrestige = () => {
    const paws = Math.max(1, Math.floor(Math.sqrt(game.points / PRESTIGE_REQUIREMENT)))
    const reset = {
      ...createInitialState(),
      lifetimePoints: game.lifetimePoints,
      clicks: game.clicks,
      achievements: game.achievements,
      playTime: game.playTime,
      goldenPaws: game.goldenPaws + paws,
      prestigeCount: game.prestigeCount + 1,
    }
    setGame(save(reset))
    setModal(null)
    notify(`Reincarnation complete! +${paws} Golden Paws`)
  }

  const exportSave = () => {
    const blob = new Blob([JSON.stringify({ ...game, lastSavedAt: Date.now() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'kado-clicker-save.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const importSave = () => {
    const restored = restoreSave(importText, Date.now())
    if (restored.corrupted) {
      notify('That save file is invalid. Your current game is safe.')
      return
    }
    setGame(save(restored.game))
    setImportText('')
    setModal(null)
    notify('Save imported successfully!')
  }

  const copyContract = async () => {
    if (!CONTRACT_ADDRESS) {
      notify('Token address has not been configured yet.')
      return
    }
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      notify('Could not access clipboard. Please copy the address manually.')
    }
  }

  const shareScore = async () => {
    const text = `I've collected ${formatNumber(game.lifetimePoints)} KADO Points in KADO CLICKER! Can you beat my score? 🐶`
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: 'KADO CLICKER', text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        notify('Score copied — go show off!')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') notify('Could not share your score.')
    }
  }

  const eventsOpen = !activeEvent

  return (
    <div className="app-shell min-h-screen">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="Kado Clicker home">
          <span className="brand-icon">🐶</span>
          <span className="brand-word">KADO<span>CLICKER</span></span>
          <span className="beta-badge">BETA</span>
        </a>
        <div className="topbar-right">
          <div className="live-pill"><span /> IDLE GAME</div>
          <a className="icon-btn top-link" href={TWITTER_URL} target="_blank" rel="noreferrer" aria-label="Kado on X" title="Follow Kado on X"><ExternalLink size={17} /></a>
          <button className="icon-btn" onClick={() => setModal('help')} aria-label="How to play" title="How to play"><CircleHelp size={18} /></button>
          <button className="icon-btn" onClick={() => setModal('settings')} aria-label="Settings" title="Settings"><Settings size={18} /></button>
        </div>
      </header>

      <main className="game-grid">
        <aside className={`side-panel left-panel ${tab === 'stats' || tab === 'achievements' ? 'mobile-active' : ''}`}>
          <section className="player-card panel">
            <div className="section-kicker"><Activity size={14} /> PLAYER STATS</div>
            <div className="stat-row"><span>Points per click</span><strong><Zap size={13} /> {formatNumber(ppc)}</strong></div>
            <div className="stat-row"><span>Points per second</span><strong><Activity size={13} /> {formatNumber(livePps)}</strong></div>
            <div className="stat-row"><span>Total clicks</span><strong>{formatNumber(game.clicks)}</strong></div>
            <div className="stat-row"><span>Lifetime earned</span><strong>{formatNumber(game.lifetimePoints)}</strong></div>
            <div className="stat-row"><span>Play time</span><strong>{formatDuration(game.playTime)}</strong></div>
            <div className="stat-row"><span>Upgrades bought</span><strong>{Object.values(game.owned).reduce((total, count) => total + count, 0)}</strong></div>
            <div className="stat-row"><span>Golden Paws</span><strong className="gold-text">✦ {game.goldenPaws}</strong></div>
          </section>
          <section className="achievements-card panel">
            <div className="panel-heading"><div className="section-kicker"><Award size={14} /> ACHIEVEMENTS</div><span className="count-chip">{unlocked}/{ACHIEVEMENTS.length}</span></div>
            <div className="achievement-list">
              {ACHIEVEMENTS.map((achievement) => {
                const has = game.achievements.includes(achievement.id)
                return <div className={`achievement-row ${has ? 'is-unlocked' : ''}`} key={achievement.id}>
                  <span className="achievement-icon">{has ? achievement.icon : '🔒'}</span>
                  <span className="achievement-copy"><b>{achievement.name}</b><small>{achievement.description}</small></span>
                  {has && <Check size={14} className="achievement-check" />}
                </div>
              })}
            </div>
            <button className="text-button" onClick={() => setTab('achievements')}>View all achievements <ChevronRight size={14} /></button>
          </section>
          <section className="community-card panel">
            <div className="section-kicker"><Heart size={14} /> THE PACK</div>
            <p>Good dogs. Good vibes. One very good coin.</p>
            <div className="community-buttons">
              <a className="community-link" href={TWITTER_URL} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Follow on X</a>
              <a className="community-link" href={TELEGRAM_URL} target="_blank" rel="noreferrer"><Send size={14} /> Telegram</a>
              {COMMUNITY_URL && COMMUNITY_URL !== TELEGRAM_URL && <a className="community-link" href={COMMUNITY_URL} target="_blank" rel="noreferrer"><Heart size={14} /> Join community</a>}
            </div>
            <button className="contract-button" onClick={copyContract} aria-label="Copy token contract address" title="Copy token contract address">
              <span><small>TOKEN CONTRACT</small><b>{CONTRACT_ADDRESS}</b></span>
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <div className="leaderboard-unavailable"><span>LEADERBOARD</span><b>Currently unavailable</b></div>
          </section>
        </aside>

        <section className={`center-panel ${tab === 'play' ? 'mobile-active' : ''}`}>
          <div className="score-card">
            <span className="score-label">YOUR KADO POINTS</span>
            <motion.div key={Math.floor(game.points)} className="score-value" initial={{ scale: 1.035 }} animate={{ scale: 1 }} transition={{ duration: 0.22 }}>
              {formatNumber(game.points)}
            </motion.div>
            <div className="score-meta"><span><Zap size={13} /> {formatNumber(ppc)} / click</span><i /><span><Activity size={13} /> {formatNumber(livePps)} / sec</span></div>
          </div>

          <div className="evolution-label"><span className="evo-dot" /> {evolution.name.toUpperCase()} <span className="label-divider">·</span> {evolution.subtitle}</div>
          {activeEvent && <motion.div className={`event-banner ${activeEvent.type}`} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <span>{activeEvent.type === 'zoomies' ? '⚡' : activeEvent.type === 'viral' ? '📡' : '💤'}</span>
            <div><b>{activeEvent.title}</b><small>{activeEvent.description}</small></div><strong>{secondsLeft}s</strong>
          </motion.div>}

          <div className={`dog-stage ${evolution.className} ${activeEvent?.type === 'nap' ? 'napping' : ''}`}>
            <div className="stage-sparkle sparkle-a">✦</div><div className="stage-sparkle sparkle-b">✧</div>
            <div className="stage-ring ring-one" /><div className="stage-ring ring-two" />
            <motion.button
              ref={dogButton}
              className={`dog-button ${activeEvent?.type === 'nap' ? 'sleepy' : ''}`}
              onClick={handleClickKado}
              aria-label={`Click Kado to earn ${formatNumber(ppc)} KADO Points`}
              title="Every 5 consecutive clicks adds a bonus point"
              whileTap={reduceMotion ? undefined : { scale: 0.91, rotate: -3 }}
              animate={{ y: reduceMotion ? 0 : activeEvent?.type === 'nap' ? [0, 3, 0] : [0, -8, 0] }}
              transition={{ duration: activeEvent?.type === 'nap' ? 2 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <KadoPortrait key={evolution.className} evolution={evolution} />
              <span className="dog-shadow" />
              <AnimatePresence>
                {clickEffects.map((effect) => <motion.span className="float-point" key={effect.id} style={{ left: effect.x, top: effect.y }} initial={{ opacity: 1, y: 0, scale: 0.65 }} animate={{ opacity: 0, y: -72, scale: 1.35, rotate: -10 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} onAnimationComplete={() => setClickEffects((items) => items.filter((item) => item.id !== effect.id))}>
                  +{formatNumber((ppc + Math.floor(combo / 5)) * (activeEvent?.type === 'zoomies' ? 5 : 1))}
                </motion.span>)}
              </AnimatePresence>
              {activeEvent?.type === 'nap' && <span className="sleep-z">Z z z</span>}
            </motion.button>
            <div className="stage-floor" />
            {combo >= 3 && <motion.div className="combo-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} key={combo}>🔥 {combo} COMBO</motion.div>}
            <button className="zoomies-trigger" onClick={triggerRandomEvent} disabled={!eventsOpen} title="Trigger a random surprise event">
              <Sparkles size={14} /> {activeEvent ? 'EVENT LIVE' : 'SURPRISE ME'}
            </button>
          </div>
          <p className="click-hint"><span className="click-indicator" /> TAP KADO TO COLLECT <kbd>SPACE</kbd></p>
          <div className="evolution-progress">
            <div className="progress-heading"><span><Crown size={14} /> NEXT EVOLUTION</span><b>{nextEvolution ? nextEvolution.name : 'MAX EVOLUTION'}</b></div>
            <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${nextEvolution ? Math.min(100, ((game.lifetimePoints - evolution.threshold) / (nextEvolution.threshold - evolution.threshold)) * 100) : 100}%` }} /></div>
            <small>{nextEvolution ? `${formatNumber(Math.max(0, nextEvolution.threshold - game.lifetimePoints))} points to go` : 'You are the very goodest boy.'}</small>
          </div>
          {game.points >= PRESTIGE_REQUIREMENT && <button className="prestige-callout" onClick={() => setModal('prestige')}><RotateCcw size={16} /> REINCARNATION AVAILABLE <ChevronRight size={16} /></button>}
        </section>

        <aside className={`side-panel right-panel ${tab === 'shop' ? 'mobile-active' : ''}`}>
          <section className="shop panel">
            <div className="shop-heading"><div><div className="section-kicker"><ShoppingBag size={14} /> THE GOODIE SHOP</div><p>Tools for a very good dog.</p></div><span className="shop-count">{UPGRADES.reduce((t, u) => t + (game.owned[u.id] ?? 0), 0)} OWNED</span></div>
            <div className="upgrade-list">
              {UPGRADES.map((upgrade, index) => {
                const owned = game.owned[upgrade.id] ?? 0
                const cost = upgradeCost(upgrade, owned)
                const canAfford = game.points >= cost
                return <motion.button key={upgrade.id} className={`upgrade-row ${canAfford ? 'affordable' : ''}`} onClick={() => buyUpgrade(upgrade)} disabled={!canAfford} whileTap={canAfford ? { scale: 0.975 } : undefined} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.035 }}>
                  <span className="upgrade-icon">{upgrade.icon}</span>
                  <span className="upgrade-main"><span className="upgrade-name">{upgrade.name}</span><span className="upgrade-description">{upgrade.description}</span><span className={`upgrade-price ${canAfford ? 'price-ready' : ''}`}><Coins size={12} /> {formatNumber(cost)} pts</span></span>
                  <span className="upgrade-owned">{owned}</span>
                </motion.button>
              })}
            </div>
            <div className="shop-footnote"><Sparkles size={13} /> Prices increase by 15% with every purchase</div>
          </section>
          <section className="reincarnation-card panel">
            <div className="reincarnation-icon"><RotateCcw size={19} /></div>
            <div className="reincarnation-copy"><b>REINCARNATION</b><span>Reset. Rise. Repeat.</span><small>Unlock at {formatNumber(PRESTIGE_REQUIREMENT)} current points</small></div>
            <button onClick={() => game.points >= PRESTIGE_REQUIREMENT && setModal('prestige')} disabled={game.points < PRESTIGE_REQUIREMENT} aria-label="Reincarnation details"><ChevronRight size={18} /></button>
          </section>
          <section className="share-card">
            <div className="share-doodle">✦</div><div><b>Beat the pack?</b><span>Show off your score.</span></div>
            <button onClick={shareScore} aria-label="Share your score"><Share2 size={17} /></button>
          </section>
        </aside>
      </main>

      <footer className="disclaimer"><span>🐾</span> KADO Points are virtual in-game points and have no cash value. They are not redeemable for $KADO tokens.</footer>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {([
          ['play', <Flame size={19} />, 'Play'],
          ['shop', <ShoppingBag size={19} />, 'Shop'],
          ['stats', <Activity size={19} />, 'Stats'],
          ['achievements', <Award size={19} />, 'Awards'],
        ] as [Tab, ReactNode, string][]).map(([value, icon, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{icon}<span>{label}</span></button>)}
      </nav>

      <AnimatePresence>
        {toast && <motion.div className="toast" initial={{ y: 25, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }}><span>🐾</span>{toast}</motion.div>}
        {offlineEarnings > 0 && <motion.div className="offline-card" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
          <button className="close-offline" onClick={() => setOfflineEarnings(0)} aria-label="Dismiss offline earnings"><X size={15} /></button><span>🌙</span><div><b>Kado held down the fort!</b><small>You earned <strong>{formatNumber(offlineEarnings)} points</strong> while away.</small></div><button className="offline-ok" onClick={() => setOfflineEarnings(0)}>NICE!</button>
        </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {modal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <motion.div className="modal-card" initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close dialog"><X size={18} /></button>
            {modal === 'settings' && <><span className="modal-eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><p>Tweak your Kado Clicker experience.</p><button className="setting-row" onClick={() => setMuted(!muted)}><span><VolumeX size={18} /> Mute sounds</span><span className={`toggle ${muted ? 'on' : ''}`} /></button><button className="setting-row" onClick={() => setSoundOn(!soundOn)}><span><Volume2 size={18} /> Click sounds</span><span className={`toggle ${soundOn ? 'on' : ''}`} /></button><div className="save-actions"><button onClick={exportSave}><ArrowDownToLine size={16} /> Export save</button><button onClick={() => setModal('import')}><ArrowUpFromLine size={16} /> Import save</button></div><button className="reset-button" onClick={() => { if (window.confirm('Start a new game? This will permanently reset your current local save.')) { const fresh = save(createInitialState()); setGame(fresh); setModal(null); notify('Fresh paws, fresh start!') } }}><Minus size={15} /> Reset game</button></>}
            {modal === 'prestige' && <><span className="modal-eyebrow">A FRESH START. A BIGGER BARK.</span><div className="prestige-modal-icon">🐾</div><h2>Reincarnate Kado?</h2><p>Begin again with permanent Golden Paws. Each Paw boosts all production by <b>5%</b>.</p><div className="prestige-details"><span><b>You'll lose</b><small>Current points &amp; all upgrades</small></span><span><b>You'll keep</b><small>Achievements, lifetime points &amp; playtime</small></span><span><b>You'll gain</b><small>{Math.max(1, Math.floor(Math.sqrt(game.points / PRESTIGE_REQUIREMENT)))} Golden Paw(s)</small></span></div><div className="modal-actions"><button className="button-muted" onClick={() => setModal(null)}>Not yet</button><button className="button-primary" onClick={handlePrestige}><RotateCcw size={15} /> Reincarnate</button></div></>}
            {modal === 'import' && <><span className="modal-eyebrow">RESTORE YOUR JOURNEY</span><h2>Import save</h2><p>Paste your exported Kado Clicker save JSON below. This replaces current progress.</p><textarea className="import-textarea" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="Paste save JSON here..." /><div className="modal-actions"><button className="button-muted" onClick={() => setModal('settings')}>Back</button><button className="button-primary" onClick={importSave} disabled={!importText.trim()}><ArrowUpFromLine size={15} /> Import save</button></div></>}
            {modal === 'help' && <><span className="modal-eyebrow">THE VERY SHORT VERSION</span><h2>How to play</h2><div className="help-list"><p><span>01</span> Click Kado to earn KADO Points. Go on, give him a boop.</p><p><span>02</span> Spend points on upgrades to make every click and second count.</p><p><span>03</span> Earn lifetime points to evolve Kado and unlock achievements.</p><p><span>04</span> Come back later — Kado earns while you're away (up to 8 hours).</p><p><span>05</span> Reincarnate at 10M current points for permanent Golden Paws.</p></div><div className="token-notice"><b>Just a game!</b> KADO Points are virtual in-game points and have no cash value. They are not redeemable for $KADO tokens.</div><button className="button-primary full-button" onClick={() => setModal(null)}>Got it, let's play! <ChevronRight size={16} /></button></>}
          </motion.div>
        </div>}
      </AnimatePresence>
    </div>
  )
}

function KadoPortrait({ evolution }: { evolution: typeof EVOLUTIONS[number] }) {
  const [broken, setBroken] = useState(false)
  const suffix = evolution.className
  const imageSources = [`/kado-${suffix}.png`, '/kado.png', '/kado.jpg']
  const [imageAttempt, setImageAttempt] = useState(0)
  return <div className={`kado-portrait ${suffix}`}>
    {!broken && <img src={imageSources[imageAttempt]} alt="" draggable={false} onError={() => {
      if (imageAttempt + 1 >= imageSources.length) setBroken(true)
      else setImageAttempt((attempt) => attempt + 1)
    }} />}
    {broken && <div className={`kado-placeholder ${suffix}`} aria-hidden="true"><span className="dog-ears"><i /><i /></span><span className="dog-face">
      <span className="dog-eye eye-left" /><span className="dog-eye eye-right" /><span className="dog-snout"><i /><b /></span><span className="dog-cheek cheek-left" /><span className="dog-cheek cheek-right" />
    </span>{evolutionIndexEmoji(evolution)}{suffix === 'dripped' && <span className="dog-shades">━ ━</span>}</div>}
  </div>
}

function evolutionIndexEmoji(evolution: typeof EVOLUTIONS[number]) {
  return <span className="portrait-accent" aria-hidden="true">{evolution.emoji}</span>
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default App
