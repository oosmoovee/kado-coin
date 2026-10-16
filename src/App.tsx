import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent, ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, Award, BookOpen, Check, ChevronRight, CircleHelp, Home,
  Coins, Copy, Crown, ExternalLink, Flame, Heart, Lock, LogIn, LogOut, Minus, UserRound,
  Play, RotateCcw, Send, Settings, Share2, ShoppingBag, Sparkles, Volume2, VolumeX, X, Zap,
} from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import {
  ACHIEVEMENTS, EVOLUTIONS, PRESTIGE_REQUIREMENT, SAVE_KEY, UPGRADES, awardPoints,
  createInitialState, formatNumber, getEvolution, pointsPerClick, pointsPerSecond,
  productionMultiplier, purchaseUpgrades, restoreSave, upgradeBatchCost, upgradeCost, type GameState, type PurchaseQuantity,
} from './game'
import { LeaderboardPanel } from './Leaderboard'
import { parseServerGameSnapshot, supabase } from './supabase'

type EventType = 'zoomies' | 'viral' | 'nap'
type GameEvent = { type: EventType; endsAt: number; title: string; description: string }
type Tab = 'play' | 'shop' | 'stats' | 'achievements'
type ShopCategory = 'click' | 'passive' | 'legendary'
type Achievement = typeof ACHIEVEMENTS[number]

const COMMUNITY_URL = import.meta.env.VITE_COMMUNITY_URL || ''
const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL || 'https://t.me/KADOCOINCOMMUNITY'
const TWITTER_URL = import.meta.env.VITE_TWITTER_URL || 'https://x.com/KadoCoinDev'
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '8Eznb1ZdDjxa7ayXxDbieW2uRG5xgn1L3rudRz4Rpump'

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const titles: Record<string, string> = {
    '/': 'KADO — A legend that grows together',
    '/coin-info': 'Coin info — KADO',
    '/lore': 'The Kado story — KADO',
    '/community': 'Community — KADO',
    '/play': 'KADO CLICKER — The goodest clicker on the internet',
  }

  useEffect(() => {
    document.title = titles[path] || titles['/']
  }, [path])

  if (path === '/play') return <ClickerGame />

  const page = path === '/coin-info'
    ? <CoinInfoPage />
    : path === '/lore'
      ? <LorePage />
      : path === '/community'
        ? <CommunityPage />
        : <HomePage />

  return <SiteLayout>{page}</SiteLayout>
}

function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-home">
      <header className="home-header">
        <a className="home-brand" href="/" aria-label="KADO home"><span>✦</span> KADO <small>$KADO</small></a>
        <nav className="home-nav" aria-label="Main navigation">
          <a href="/coin-info">Coin info</a>
          <a href="/lore">Lore</a>
          <a href="/community">Community</a>
        </nav>
        <a className="home-header-play" href="/play"><Play size={15} fill="currentColor" /> Play</a>
      </header>
      <main>{children}</main>
      <footer className="home-footer">
        <a className="home-brand" href="/" aria-label="KADO home"><span>✦</span> KADO <small>$KADO</small></a>
        <span>Just KADO. Just luck. Just vibes. 🐶🍀</span>
        <a href="/play">PLAY KADO CLICKER →</a>
      </footer>
    </div>
  )
}

function HomePage() {
  return (
    <section className="landing game-menu">
      <div className="game-menu-copy">
        <div className="landing-intro">
          <span className="home-eyebrow">A LEGEND THAT GROWS TOGETHER</span>
          <h1>A little luck goes a long way.</h1>
          <p>Meet Kado, discover the story, and join the community. No crypto or on-chain activity needed.</p>
        </div>
        <article className="landing-lore">
          <span className="lore-label">THE WORLD OF KADO</span>
          <p className="landing-premise">An ancient civilization protects a prophecy about a future movement. The Golden Authority challenges the principle of shared opportunity.</p>
          <p className="landing-creator-note">Build this universe with me, one meaningful decision at a time. Preserve what I establish, propose what remains undecided, and never take creative control away from me.</p>
        </article>
        <a className="play-menu-button" href="/play">
          <span className="play-menu-icon"><Play size={29} fill="currentColor" /></span>
          <span className="play-menu-label"><b>Play Kado Clicker</b><small>Enter the game</small></span>
          <span className="play-menu-arrow" aria-hidden="true">→</span>
        </a>
        <div className="landing-links">
          <a className="sketch-link landing-secondary" href="/coin-info"><Coins size={21} /><span><b>Coin info</b><small>What KADO is — and isn't</small></span><span className="landing-arrow" aria-hidden="true">↗</span></a>
          <a className="sketch-link landing-secondary" href="/lore"><BookOpen size={21} /><span><b>Lore</b><small>Explore the story</small></span><span className="landing-arrow" aria-hidden="true">↗</span></a>
        </div>
      </div>
      <figure className="home-photo-card landing-photo">
        <img src="/images/IMG_9230.jpeg" alt="KADO close up surrounded by gold coins and treasure" />
        <figcaption><span>✦</span> THE DOG. THE NAME. THE LUCK.</figcaption>
      </figure>
    </section>
  )
}

function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="home-content-heading">
      <span className="home-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  )
}

function CoinInfoPage() {
  const [copied, setCopied] = useState(false)
  const [copyMessage, setCopyMessage] = useState('')

  const copyContractAddress = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setCopied(true)
      setCopyMessage('CA copied to clipboard')
      window.setTimeout(() => setCopied(false), 1800)
      window.setTimeout(() => setCopyMessage(''), 2800)
    } catch {
      setCopyMessage('Could not copy automatically. Select and copy the address above.')
    }
  }

  return (
    <section className="home-content-section standalone-page">
      <PageHeading eyebrow="THE SYMBOL AND THE PROJECT" title="Coin info" />
      <div className="home-content-grid">
        <article className="lore-card">
          <h3>The golden coin</h3>
          <p>The coin bearing Kado’s portrait and surrounding stars is a symbol of luck and shared fortune. Its origin, history, powers, and role in any game are still undecided. It is not established as magical or as a financial instrument.</p>
          <div className="proposal-note">
            <span>Possible readings · Not confirmed</span>
            <p>It could be an emblem of good fortune shared by a community, a clue linking Kado’s modern world to the ancient civilization, or a symbol whose meaning comes from the Keepers themselves. None of these interpretations is canon yet.</p>
          </div>
        </article>
        <article className="lore-card">
          <h3>$KADO token</h3>
          <p>The golden coin in the story is a symbol; it should not be confused with the real-world $KADO token. KADO Clicker points are virtual, have no cash value, and are not redeemable for tokens.</p>
          <div className="token-details">
            <p>Name: KADO COIN</p>
            <p>Ticker: $KADO</p>
            <p>Supply: 1,000,000,000</p>
            <p>Utility: None</p>
          </div>
          <p className="story-ca">CA: {CONTRACT_ADDRESS}</p>
          <button className="copy-ca-button" onClick={copyContractAddress}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied!' : 'Copy CA'}</button>
          <p className="copy-feedback" role="status" aria-live="polite">{copyMessage}</p>
        </article>
      </div>
    </section>
  )
}

function LorePage() {
  return (
    <section className="home-content-section standalone-page">
      <PageHeading eyebrow="THE FICTIONAL UNIVERSE · STILL UNFOLDING" title="The story so far">
        These are the established story foundations. The unanswered questions are part of the mystery, not gaps to fill without the creator’s approval.
      </PageHeading>
      <div className="lore-story-grid">
        <article className="lore-card lore-card-featured">
          <span className="lore-label">THE ANCIENT PROPHECY</span>
          <h3>A movement was foretold—not Kado.</h3>
          <p>Long before the digital age, an ancient civilization predicted an era when people could connect across great distances and unite around a shared purpose. The prophecy described a movement, not Kado himself.</p>
          <p>As Kado draws attention and the Kado Keepers gather, a connection to that prediction becomes possible—but what the prophecy truly means remains unknown.</p>
          <p className="lore-question">Is this the movement the civilization foresaw, is there a deeper meaning, or will the connection only become clear with time? The mystery remains open.</p>
        </article>
        <article className="lore-card">
          <span className="lore-label">A HIDDEN CIVILIZATION</span>
          <h3>Why did they remain hidden?</h3>
          <p>The civilization survived in secret to protect the prophecy. Its name, location, culture, and history have not been decided.</p>
          <div className="proposal-note"><span>Possible explanation · Not confirmed</span><p>They may have concealed themselves because they feared outsiders could seize or misuse what they protected. This is a direction to explore, not established history.</p></div>
          <div className="proposal-note">
            <span>Possible ties to the modern world · Open</span>
            <p>They might have left traces for later generations, kept their distance entirely, or found some indirect way to observe events. No contact, location, or modern relationship has been established.</p>
          </div>
          <p>“Silent Guardians” is a former working title, not its confirmed name.</p>
        </article>
        <article className="lore-card">
          <span className="lore-label">AN EXTERNAL ANTAGONIST</span>
          <h3>The Golden Authority</h3>
          <p>This working title describes a powerful institution that seeks to monopolize opportunity and fortune. Its philosophy challenges shared fortune: it may argue that opportunity must be controlled, not freely shared.</p>
          <p>It is outside the Kado Keepers—not an internal rival faction. Its final name, leadership, methods, motives, and connection to the prophecy or the ancient civilization remain undecided.</p>
          <div className="proposal-note">
            <span>Possible motivations · Not confirmed</span>
            <p>Some people might support centralized control because they believe it offers stability, predictable rules, or protection from exploitation. Its influence could depend on being seen as a trusted gatekeeper.</p>
          </div>
          <p className="lore-question">If more people could share in opportunity, the Authority might risk losing its influence—or fear that a familiar system would become less predictable. These are story directions to consider, not settled motives.</p>
        </article>
      </div>
    </section>
  )
}

function CommunityPage() {
  return (
    <section className="home-content-section standalone-page">
      <PageHeading eyebrow="A WORLD BUILT WITH ITS COMMUNITY" title="Everyone can be part of the story.">
        These are possible ways to make participation meaningful—not confirmed game mechanics. On-chain participation is never a requirement.
      </PageHeading>
      <div className="community-proposals">
        <article className="proposal-card"><Sparkles size={20} /><h3>Milestones &amp; shared progress</h3><p>Celebrate the Kado legend’s growth and the collective effort of the Kado Keepers.</p></article>
        <article className="proposal-card"><BookOpen size={20} /><h3>Creative contributions</h3><p>Invite proposals for characters, relationships, places, landmarks, and story chapters.</p></article>
        <article className="proposal-card"><Heart size={20} /><h3>Community events</h3><p>Explore events inspired by the world and its mythology, with ways to join that do not involve crypto.</p></article>
      </div>
      <p className="creator-note">The community can help propose and expand the universe. Its creator retains final say over foundational lore and major canon decisions.</p>
      <div className="story-community">
        <a href="https://x.com/kadocoindev?s=11" target="_blank" rel="noreferrer">Follow KADO on X ↗</a>
        <a href="https://t.me/KADOCOINCOMMUNITY" target="_blank" rel="noreferrer">Join the Telegram community ↗</a>
      </div>
    </section>
  )
}

function ClickerGame() {
  useEffect(() => {
    document.title = 'KADO CLICKER — The goodest clicker on the internet'
  }, [])

  const reduceMotion = useReducedMotion()
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [serverGameLoaded, setServerGameLoaded] = useState(false)
  const [serverLoadAttempt, setServerLoadAttempt] = useState(0)
  const [username, setUsername] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authUsername, setAuthUsername] = useState('')
  const [authError, setAuthError] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [game, setGame] = useState<GameState>(() => {
    const restored = restoreSave(localStorage.getItem(SAVE_KEY))
    return restored.game
  })
  const [offlineEarnings, setOfflineEarnings] = useState(() => restoreSave(localStorage.getItem(SAVE_KEY)).offlineEarnings)
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<'settings' | 'prestige' | 'import' | 'help' | 'account' | null>(null)
  const [tab, setTab] = useState<Tab>('play')
  const [shopCategory, setShopCategory] = useState<ShopCategory>('passive')
  const [buyQuantity, setBuyQuantity] = useState<PurchaseQuantity>(1)
  const [purchaseFlash, setPurchaseFlash] = useState<{ upgradeId: string; sequence: number } | null>(null)
  const [shopCelebration, setShopCelebration] = useState('')
  const [rewardQueue, setRewardQueue] = useState<Achievement[]>([])
  const [rewardPopup, setRewardPopup] = useState<Achievement | null>(null)
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
  const purchaseSequence = useRef(0)
  const actionQueue = useRef<Promise<void>>(Promise.resolve())
  const isRanked = Boolean(supabase && session && serverGameLoaded)
  const gameReady = !supabase || (!authLoading && (!session || serverGameLoaded))

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
    if (!session) localStorage.setItem(SAVE_KEY, JSON.stringify(updated))
    return updated
  }, [session])

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
    let mounted = true
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.error('Unable to restore the player session:', error)
        setAuthError('Could not restore your account session. Please sign in again.')
      }
      setSession(data.session)
      setAuthLoading(false)
    }).catch((error: unknown) => {
      if (!mounted) return
      console.error('Unable to restore the player session:', error)
      setAuthError('Could not restore your account session. Please sign in again.')
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setServerGameLoaded(false)
      if (!nextSession) setUsername(null)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) return
    const restored = restoreSave(localStorage.getItem(SAVE_KEY))
    setGame(save(restored.game))
    if (restored.offlineEarnings > 0) {
      setOfflineEarnings(restored.offlineEarnings)
      notify(`While you were away, Kado fetched ${formatNumber(restored.offlineEarnings)} points!`)
    } else if (restored.corrupted) notify('Your save was corrupted, so a fresh game has started.')
  }, [notify, save, session])

  useEffect(() => {
    if (!supabase || !session) return
    let mounted = true
    setServerGameLoaded(false)
    void Promise.all([
      supabase.rpc('game_action', { p_action: 'load', p_upgrade_id: null }),
      supabase.from('player_profiles').select('username').eq('id', session.user.id).single(),
    ]).then(([gameResult, profileResult]) => {
      if (!mounted) return
      if (gameResult.error) {
        console.error('Unable to load the ranked player game:', gameResult.error)
        notify('Could not load your ranked game. Please try again.')
        return
      }
      const snapshot = parseServerGameSnapshot(gameResult.data)
      if (!snapshot) {
        console.error('Received invalid ranked game state.')
        notify('The saved game data could not be read. Please contact support.')
        return
      }
      if (profileResult.error) {
        console.error('Unable to load the player profile:', profileResult.error)
        notify('Could not load your username. Please try again.')
        return
      }
      setUsername(profileResult.data.username)
      setGame(snapshot.game)
      setActiveEvent(snapshot.activeEvent ? {
        type: snapshot.activeEvent.type,
        endsAt: snapshot.activeEvent.endsAt,
        title: { zoomies: 'KADO ZOOMIES', viral: 'VIRAL MOMENT', nap: 'NAP TIME' }[snapshot.activeEvent.type],
        description: { zoomies: '5× points per click', viral: '2× passive production', nap: 'Kado is resting. Wake-up bonus incoming!' }[snapshot.activeEvent.type],
      } : null)
      setOfflineEarnings(snapshot.offlineEarnings)
      setServerGameLoaded(true)
      if (snapshot.offlineEarnings > 0) notify(`While you were away, Kado fetched ${formatNumber(snapshot.offlineEarnings)} points!`)
    }).catch((error: unknown) => {
      if (!mounted) return
      console.error('Unable to load the ranked player game:', error)
      notify('Could not load your ranked game. Please try again.')
    })
    return () => { mounted = false }
  }, [notify, serverLoadAttempt, session])

  const performServerAction = useCallback((action: string, upgradeId: string | null = null, quantity = 1) => {
    if (!supabase || !session || !isRanked) return Promise.resolve()
    const client = supabase
    const run = actionQueue.current.then(async () => {
      const { data, error } = await client.rpc('game_action', { p_action: action, p_upgrade_id: upgradeId, p_quantity: quantity })
      if (error) throw error
      const snapshot = parseServerGameSnapshot(data)
      if (!snapshot) throw new Error('The server returned invalid game data.')
      setGame(snapshot.game)
      setActiveEvent(snapshot.activeEvent ? {
        type: snapshot.activeEvent.type,
        endsAt: snapshot.activeEvent.endsAt,
        title: { zoomies: 'KADO ZOOMIES', viral: 'VIRAL MOMENT', nap: 'NAP TIME' }[snapshot.activeEvent.type],
        description: { zoomies: '5× points per click', viral: '2× passive production', nap: 'Kado is resting. Wake-up bonus incoming!' }[snapshot.activeEvent.type],
      } : null)
    })
    actionQueue.current = run.catch(() => undefined)
    return run
  }, [isRanked, session])

  const submitAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setAuthError('')
    setAuthBusy(true)
    try {
      if (authMode === 'signup') {
        const cleanUsername = authUsername.trim()
        if (!/^[A-Za-z0-9_]{3,20}$/.test(cleanUsername)) {
          setAuthError('Username must be 3–20 letters, numbers, or underscores.')
          return
        }
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: { username: cleanUsername },
            emailRedirectTo: `${window.location.origin}/play`,
          },
        })
        if (error) throw error
        if (data.session) {
          setModal(null)
          setAuthPassword('')
          setVerificationEmail('')
          notify('Account created! Your ranked Kado game is ready.')
        } else {
          setVerificationEmail(authEmail.trim())
          setAuthError('Check your email to confirm your account, then sign in to start your ranked game.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
        if (error) throw error
        setModal(null)
        setAuthPassword('')
      }
    } catch (error) {
      console.error('Account sign-in failed:', error)
      setAuthError(error instanceof Error ? error.message : 'Could not complete sign-in.')
    } finally {
      setAuthBusy(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!supabase || !verificationEmail) return
    setAuthBusy(true)
    setAuthError('')
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: { emailRedirectTo: `${window.location.origin}/play` },
      })
      if (error) throw error
      notify('A new verification email has been sent.')
    } catch (error) {
      console.error('Could not resend the account verification email:', error)
      setAuthError(error instanceof Error ? error.message : 'Could not resend the verification email.')
    } finally {
      setAuthBusy(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Could not sign out:', error)
      notify('Could not sign out. Please try again.')
      return
    }
    setServerGameLoaded(false)
    notify('Signed out. Your local game is still saved on this browser.')
  }

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
    if (activeEvent || isRanked) return
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
  }, [activeEvent, isRanked, notify])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isRanked) {
        void performServerAction('heartbeat').catch((error: unknown) => {
          console.error('Could not sync ranked game progress:', error)
          notify(error instanceof Error ? error.message : 'Could not sync your ranked progress.')
        })
      } else if (!session) {
        setGame((current) => save(current))
      }
    }, 10_000)
    return () => window.clearInterval(timer)
  }, [isRanked, notify, performServerAction, save, session])

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
      setRewardQueue((current) => [...current, ...nextAchievements.filter((item) => item.id.startsWith('milestone-'))])
    }
  }, [game, notify])

  useEffect(() => {
    if (rewardPopup || rewardQueue.length === 0) return
    setRewardPopup(rewardQueue[0])
    setRewardQueue((current) => current.slice(1))
    const timer = window.setTimeout(() => setRewardPopup(null), 3_400)
    return () => window.clearTimeout(timer)
  }, [rewardPopup, rewardQueue])

  useEffect(() => {
    if (!shopCelebration) return
    const timer = window.setTimeout(() => setShopCelebration(''), 2_200)
    return () => window.clearTimeout(timer)
  }, [shopCelebration])

  useEffect(() => {
    if (evolutionIndex > previousEvolution.current) notify(`Evolution unlocked: ${EVOLUTIONS[evolutionIndex].name}!`)
    previousEvolution.current = evolutionIndex
  }, [evolutionIndex, notify])

  const handleClickKado = (event: MouseEvent<HTMLButtonElement>) => {
    if (!gameReady) return
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
    if (isRanked) {
      void performServerAction('click').catch((error: unknown) => {
        console.error('Ranked click was rejected:', error)
        notify(error instanceof Error ? error.message : 'Your click could not be saved to the leaderboard.')
        void performServerAction('load').catch((refreshError: unknown) => console.error('Unable to refresh ranked game:', refreshError))
      })
    }
    setCombo((value) => Math.min(value + 1, 25))
    if (comboTimer.current) clearTimeout(comboTimer.current)
    comboTimer.current = setTimeout(() => setCombo(0), 1500)
    playSound()
  }

  const buyUpgrade = (upgrade: typeof UPGRADES[number]) => {
    if (!gameReady) return
    const owned = game.owned[upgrade.id] ?? 0
    if (isRanked) {
      const quantity = buyQuantity === 'max' ? -1 : buyQuantity
      void performServerAction('purchase', upgrade.id, quantity).then(() => {
        setPurchaseFlash({ upgradeId: upgrade.id, sequence: ++purchaseSequence.current })
        if (owned === 0 && upgrade.baseCost >= 100_000_000) setShopCelebration(upgrade.name)
        playSound(420, 0.11)
        notify(`${upgrade.name} acquired!`)
      }).catch((error: unknown) => {
        console.error('Ranked upgrade purchase was rejected:', error)
        notify(error instanceof Error ? error.message : 'This upgrade could not be saved.')
        void performServerAction('load').catch((refreshError: unknown) => console.error('Unable to refresh ranked game:', refreshError))
      })
      return
    }
    const updated = purchaseUpgrades(game, upgrade, buyQuantity)
    if (!updated) return
    const bought = (updated.owned[upgrade.id] ?? 0) - owned
    setGame(save(updated))
    setPurchaseFlash({ upgradeId: upgrade.id, sequence: ++purchaseSequence.current })
    if (owned === 0 && upgrade.baseCost >= 100_000_000) setShopCelebration(upgrade.name)
    playSound(420, 0.11)
    notify(`${bought > 1 ? `${bought}× ` : ''}${upgrade.name} acquired!`)
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
    if (isRanked) {
      void performServerAction('surprise').catch((error: unknown) => {
        console.error('Ranked surprise request was rejected:', error)
        notify(error instanceof Error ? error.message : 'A new surprise is not ready yet.')
      })
      return
    }
    if (activeEvent) return
    const roll = Math.random()
    if (roll < 0.34) startEvent('zoomies')
    else if (roll < 0.67) startEvent('viral')
    else startEvent('nap')
  }

  const livePps = pps * (activeEvent?.type === 'viral' ? 2 : 1)
  const handlePrestige = () => {
    if (isRanked) {
      void performServerAction('prestige').then(() => {
        setModal(null)
        notify('Reincarnation complete! Your ranked progress has been saved.')
      }).catch((error: unknown) => {
        console.error('Ranked reincarnation was rejected:', error)
        notify(error instanceof Error ? error.message : 'Reincarnation could not be completed.')
      })
      return
    }
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
    if (isRanked) {
      notify('Ranked saves cannot be imported because leaderboard scores are verified by the server.')
      return
    }
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
        <a className="brand" href="/" aria-label="Kado Clicker home">
          <span className="brand-icon">🐶</span>
          <span className="brand-word">KADO<span>CLICKER</span></span>
        </a>
        <div className="topbar-right">
          <div className="live-pill"><span /> IDLE GAME</div>
          <a className="icon-btn" href="/" aria-label="Home" title="Back to KADO home"><Home size={17} /></a>
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
          </section>
          <section className="account-card panel">
            <div className="section-kicker"><UserRound size={14} /> PLAYER ACCOUNT</div>
            {session && !serverGameLoaded
              ? <><p>Your ranked game is loading. Local scores are not used for the public boards.</p><button className="account-action" onClick={() => setServerLoadAttempt((attempt) => attempt + 1)}>Retry ranked game load</button></>
              : username
              ? <><p>Ranked as <strong>{username}</strong></p><button className="account-action" onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></>
              : <><p>{supabase ? 'Create an account to save verified scores to the public boards.' : 'Local play is available. Online rankings will appear when connected.'}</p><button className="account-action" onClick={() => { setAuthError(''); setModal('account') }}><LogIn size={14} /> {supabase ? 'Sign in / create account' : 'Account setup'}</button></>}
          </section>
          <LeaderboardPanel username={username} onAccountClick={() => { setAuthError(''); setModal('account') }} />
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
              disabled={!gameReady}
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
            <button className="zoomies-trigger" onClick={triggerRandomEvent} disabled={!eventsOpen || !gameReady} title="Trigger a random surprise event">
              <Sparkles size={14} /> {activeEvent ? 'EVENT LIVE' : 'SURPRISE ME'}
            </button>
          </div>
          <p className="click-hint"><span className="click-indicator" /> TAP KADO TO COLLECT <kbd>SPACE</kbd></p>
          <div className="evolution-progress">
            <div className="progress-heading"><span><Crown size={14} /> NEXT EVOLUTION</span><b>{nextEvolution ? nextEvolution.name : 'MAX EVOLUTION'}</b></div>
            <div className="progress-track"><motion.div className="progress-fill" animate={{ width: `${nextEvolution ? Math.min(100, ((game.lifetimePoints - evolution.threshold) / (nextEvolution.threshold - evolution.threshold)) * 100) : 100}%` }} /></div>
            <small>{nextEvolution ? `${formatNumber(Math.max(0, nextEvolution.threshold - game.lifetimePoints))} points to go` : 'You are the very goodest boy.'}</small>
          </div>
          {gameReady && game.points >= PRESTIGE_REQUIREMENT && <button className="prestige-callout" onClick={() => setModal('prestige')}><RotateCcw size={16} /> REINCARNATION AVAILABLE <ChevronRight size={16} /></button>}
        </section>

        <aside className={`side-panel right-panel ${tab === 'shop' ? 'mobile-active' : ''}`}>
          <section className="shop panel">
            <div className="shop-heading"><div><div className="section-kicker"><ShoppingBag size={14} /> THE GOODIE SHOP</div><p>Tools for a very good dog.</p></div><span className="shop-count">{UPGRADES.reduce((t, u) => t + (game.owned[u.id] ?? 0), 0)} OWNED</span></div>
            <div className="shop-buy-controls" role="group" aria-label="Purchase quantity">
              {([{ value: 1, label: 'BUY 1' }, { value: 10, label: 'BUY 10' }, { value: 'max', label: 'BUY MAX' }] as const).map((option) =>
                <button key={option.label} className={buyQuantity === option.value ? 'active' : ''} onClick={() => setBuyQuantity(option.value)} aria-pressed={buyQuantity === option.value}>{option.label}</button>)}
            </div>
            <div className="shop-categories" role="tablist" aria-label="Upgrade categories">
              {([
                { id: 'click', label: 'Click', icon: '🐾' },
                { id: 'passive', label: 'Income', icon: '⚡' },
                { id: 'legendary', label: 'Legendary', icon: '👑' },
              ] as { id: ShopCategory; label: string; icon: string }[]).map((category) =>
                <button key={category.id} role="tab" aria-selected={shopCategory === category.id} className={shopCategory === category.id ? 'active' : ''} onClick={() => setShopCategory(category.id)}>
                  <span>{category.icon}</span>{category.label}
                </button>)}
            </div>
            <div className="upgrade-list">
              {UPGRADES.filter((upgrade) => upgrade.category === shopCategory).map((upgrade, index) => {
                const owned = game.owned[upgrade.id] ?? 0
                const cost = upgradeCost(upgrade, owned)
                const locked = upgrade.unlockAt !== undefined && game.lifetimePoints < upgrade.unlockAt
                const selectedCost = buyQuantity === 10 ? upgradeBatchCost(upgrade, owned, 10) : cost
                const canAfford = gameReady && !locked && game.points >= selectedCost
                return <motion.button key={upgrade.id} className={`upgrade-row ${canAfford ? 'affordable' : ''} ${locked ? 'locked' : ''}`} onClick={() => buyUpgrade(upgrade)} disabled={!canAfford} whileTap={canAfford ? { scale: 0.975 } : undefined} initial={{ opacity: 0, x: 12 }} animate={purchaseFlash?.upgradeId === upgrade.id
                  ? { opacity: 1, x: 0, scale: [1, 1.04, 1], boxShadow: ['0 0 0 #f1c94b00', '0 0 22px #e8c743b3', '0 0 0 #f1c94b00'] }
                  : { opacity: 1, x: 0 }} transition={{ delay: index * 0.035, duration: purchaseFlash?.upgradeId === upgrade.id ? 0.55 : 0.2 }}>
                  <span className="upgrade-icon">{upgrade.icon}</span>
                  <span className="upgrade-main"><span className="upgrade-name">{upgrade.name}</span><span className="upgrade-description">{upgrade.description}</span>
                    <span className={`upgrade-price ${canAfford ? 'price-ready' : ''}`}>{locked ? <><Lock size={11} /> Unlock at {formatNumber(upgrade.unlockAt ?? 0)} lifetime</> : <><Coins size={12} /> {formatNumber(selectedCost)} pts{buyQuantity === 10 ? ' for 10' : buyQuantity === 'max' ? ' each' : ''}</>}</span>
                  </span>
                  <span className="upgrade-owned">{owned}</span>
                </motion.button>
              })}
            </div>
            <div className="shop-footnote"><Sparkles size={13} /> 15% price increase per purchase · BUY MAX spends only what you can afford</div>
            <AnimatePresence>
              {shopCelebration && <motion.div className="shop-celebration" initial={{ opacity: 0, scale: 0.8, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -8 }}>
                <Sparkles size={18} /><span><b>LEGENDARY PURCHASE!</b><small>{shopCelebration} joins your pack</small></span><Coins size={20} />
              </motion.div>}
            </AnimatePresence>
          </section>
          <section className="reincarnation-card panel">
            <div className="reincarnation-icon"><RotateCcw size={19} /></div>
            <div className="reincarnation-copy"><b>REINCARNATION</b><span>Reset. Rise. Repeat.</span><small>Unlock at {formatNumber(PRESTIGE_REQUIREMENT)} current points</small></div>
            <button onClick={() => game.points >= PRESTIGE_REQUIREMENT && setModal('prestige')} disabled={!gameReady || game.points < PRESTIGE_REQUIREMENT} aria-label="Reincarnation details"><ChevronRight size={18} /></button>
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
        {rewardPopup && <motion.div className="milestone-popup" initial={{ y: -35, opacity: 0, scale: 0.85 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -25, opacity: 0, scale: 0.9 }}>
          <span className="milestone-sparkle">✦</span><span className="milestone-icon">{rewardPopup.icon}</span><span><b>MILESTONE REACHED</b><small>{rewardPopup.name}</small></span><Coins size={20} className="milestone-coin" />
        </motion.div>}
        {offlineEarnings > 0 && <motion.div className="offline-card" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
          <button className="close-offline" onClick={() => setOfflineEarnings(0)} aria-label="Dismiss offline earnings"><X size={15} /></button><span>🌙</span><div><b>Kado held down the fort!</b><small>You earned <strong>{formatNumber(offlineEarnings)} points</strong> while away.</small></div><button className="offline-ok" onClick={() => setOfflineEarnings(0)}>NICE!</button>
        </motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {modal && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setModal(null)}>
          <motion.div className="modal-card" initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} role="dialog" aria-modal="true">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="Close dialog"><X size={18} /></button>
            {modal === 'account' && <><span className="modal-eyebrow">YOUR PLACE IN THE PACK</span><h2>{username ? `Welcome, ${username}` : 'Player account'}</h2>{!supabase
              ? <p>Online accounts and leaderboards are not connected yet. You can still play locally; local scores are not eligible for the public boards.</p>
              : session
                ? <><p>{serverGameLoaded ? 'Your ranked game is saved to your account. Your email address is not shown on the public leaderboards.' : 'Your account is signed in, but the ranked game has not loaded yet.'}</p><div className="token-notice"><b>Separate saves</b> Your existing browser save is kept separate from your verified ranked game.</div><div className="token-notice"><b>Fair-play limits</b> Scores are calculated by the server from accepted game actions, not client-submitted totals. Rate limits discourage abuse but cannot fully prevent bots or modified clients.</div>{!serverGameLoaded && <button className="button-primary full-button" onClick={() => setServerLoadAttempt((attempt) => attempt + 1)}>Retry ranked game load</button>}<button className="button-muted full-button" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button></>
                : <><div className="account-mode-switch"><button className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); setAuthError(''); setVerificationEmail('') }}>Sign in</button><button className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthError('') }}>Create account</button></div><form className="account-form" onSubmit={(event) => void submitAccount(event)}>{authMode === 'signup' && <label>Public username<input autoComplete="username" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} placeholder="3–20 letters, numbers, or _" /></label>}<label>Email<input type="email" autoComplete="email" required value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} required minLength={8} value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="At least 8 characters" /></label>{authError && <p className="account-error" role="alert">{authError}</p>}{verificationEmail && authMode === 'signup' && <><p className="account-private-note" role="status">A verification link was sent to {verificationEmail}. If it expired or sent you to an unreachable address, resend it here.</p><button className="button-muted full-button" type="button" onClick={() => void resendVerificationEmail()} disabled={authBusy}>{authBusy ? 'Please wait…' : 'Resend verification email'}</button></>}<p className="account-private-note">Your email stays private. Only your chosen username and game scores appear publicly. Scores are server-calculated; anti-cheat rate limits are not a guarantee against bots.</p><button className="button-primary full-button" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create ranked account' : 'Sign in'}</button></form></>}</>}
            {modal === 'settings' && <><span className="modal-eyebrow">MAKE YOURSELF AT HOME</span><h2>Settings</h2><p>Tweak your Kado Clicker experience.</p><button className="setting-row" onClick={() => setMuted(!muted)}><span><VolumeX size={18} /> Mute sounds</span><span className={`toggle ${muted ? 'on' : ''}`} /></button><button className="setting-row" onClick={() => setSoundOn(!soundOn)}><span><Volume2 size={18} /> Click sounds</span><span className={`toggle ${soundOn ? 'on' : ''}`} /></button><div className="save-actions"><button onClick={exportSave}><ArrowDownToLine size={16} /> Export save</button>{!isRanked && <button onClick={() => setModal('import')}><ArrowUpFromLine size={16} /> Import save</button>}</div>{isRanked ? <div className="token-notice"><b>Ranked game</b> Imports and resets are disabled so leaderboard scores stay server-verified.</div> : <button className="reset-button" onClick={() => { if (window.confirm('Start a new game? This will permanently reset your current local save.')) { const fresh = save(createInitialState()); setGame(fresh); setModal(null); notify('Fresh paws, fresh start!') } }}><Minus size={15} /> Reset game</button>}{username && <button className="reset-button" onClick={() => void signOut()}><LogOut size={15} /> Sign out of {username}</button>}</>}
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
