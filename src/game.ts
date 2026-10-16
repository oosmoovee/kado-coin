export const SAVE_KEY = 'kado-clicker-save-v1'
export const PRICE_GROWTH = 1.15
export const PRESTIGE_REQUIREMENT = 10_000_000
export const OFFLINE_CAP_SECONDS = 8 * 60 * 60

export type Upgrade = {
  id: string
  name: string
  description: string
  baseCost: number
  effect: number
  kind: 'click' | 'passive'
  category: 'click' | 'passive' | 'legendary'
  icon: string
  unlockAt?: number
}

export const UPGRADES: Upgrade[] = [
  { id: 'treat', name: 'Dog Treat', description: '+1 point per click', baseCost: 15, effect: 1, kind: 'click', category: 'click', icon: '🦴' },
  { id: 'toy', name: 'Squeaky Toy', description: '+1 point per second', baseCost: 100, effect: 1, kind: 'passive', category: 'passive', icon: '🧸' },
  { id: 'collar', name: 'Golden Collar', description: '+5 points per second', baseCost: 500, effect: 5, kind: 'passive', category: 'passive', icon: '✨' },
  { id: 'doghouse', name: "Kado's Doghouse", description: '+20 points per second', baseCost: 2_000, effect: 20, kind: 'passive', category: 'passive', icon: '🏠' },
  { id: 'factory', name: 'Meme Factory', description: '+100 points per second', baseCost: 10_000, effect: 100, kind: 'passive', category: 'passive', icon: '🏭' },
  { id: 'algorithm', name: 'Viral Algorithm', description: '+500 points per second', baseCost: 50_000, effect: 500, kind: 'passive', category: 'passive', icon: '📡' },
  { id: 'rocket', name: 'Doge Rocket', description: '+2,500 points per second', baseCost: 250_000, effect: 2_500, kind: 'passive', category: 'passive', icon: '🚀' },
  { id: 'universe', name: 'Kado Universe', description: '+10,000 points per second', baseCost: 1_000_000, effect: 10_000, kind: 'passive', category: 'passive', icon: '🌌' },
  { id: 'lucky-clover-field', name: 'Lucky Clover Field', description: '+50,000 points per second', baseCost: 5_000_000, effect: 50_000, kind: 'passive', category: 'legendary', icon: '🍀', unlockAt: 5_000_000 },
  { id: 'kado-meme-studio', name: 'KADO Meme Studio', description: '+250,000 points per second', baseCost: 25_000_000, effect: 250_000, kind: 'passive', category: 'legendary', icon: '🎬', unlockAt: 25_000_000 },
  { id: 'viral-content-empire', name: 'Viral Content Empire', description: '+1,000,000 points per second', baseCost: 100_000_000, effect: 1_000_000, kind: 'passive', category: 'legendary', icon: '📱', unlockAt: 100_000_000 },
  { id: 'golden-dog-mansion', name: 'Golden Dog Mansion', description: '+5,000,000 points per second', baseCost: 500_000_000, effect: 5_000_000, kind: 'passive', category: 'legendary', icon: '🏰', unlockAt: 500_000_000 },
  { id: 'kado-moon-base', name: 'KADO Moon Base', description: '+25,000,000 points per second', baseCost: 2_500_000_000, effect: 25_000_000, kind: 'passive', category: 'legendary', icon: '🌙', unlockAt: 2_500_000_000 },
  { id: 'interstellar-dog-park', name: 'Interstellar Dog Park', description: '+100,000,000 points per second', baseCost: 10_000_000_000, effect: 100_000_000, kind: 'passive', category: 'legendary', icon: '🪐', unlockAt: 10_000_000_000 },
  { id: 'kado-multiverse-gate', name: 'KADO Multiverse Gate', description: '+500,000,000 points per second', baseCost: 50_000_000_000, effect: 500_000_000, kind: 'passive', category: 'legendary', icon: '🌌', unlockAt: 50_000_000_000 },
  { id: 'legendary-luck-reactor', name: 'Legendary Luck Reactor', description: '+2,500,000,000 points per second', baseCost: 250_000_000_000, effect: 2_500_000_000, kind: 'passive', category: 'legendary', icon: '👑', unlockAt: 250_000_000_000 },
  { id: 'lucky-paw-charm', name: 'Lucky Paw Charm', description: '+25 points per click', baseCost: 2_000_000, effect: 25, kind: 'click', category: 'click', icon: '🐾', unlockAt: 2_000_000 },
  { id: 'diamond-paw-gauntlet', name: 'Diamond Paw Gauntlet', description: '+1,000 points per click', baseCost: 100_000_000, effect: 1_000, kind: 'click', category: 'click', icon: '💎', unlockAt: 100_000_000 },
]

export type GameState = {
  points: number
  lifetimePoints: number
  clicks: number
  owned: Record<string, number>
  goldenPaws: number
  prestigeCount: number
  achievements: string[]
  playTime: number
  lastSavedAt: number
}

export const ACHIEVEMENTS = [
  { id: 'first-bark', name: 'First Bark', description: 'Give Kado his first click', icon: '🐾', check: (g: GameState) => g.clicks >= 1 },
  { id: 'treat-collector', name: 'Treat Collector', description: 'Own 10 Dog Treats', icon: '🦴', check: (g: GameState) => (g.owned.treat ?? 0) >= 10 },
  { id: 'certified-clicker', name: 'Certified Clicker', description: 'Click 1,000 times', icon: '👆', check: (g: GameState) => g.clicks >= 1_000 },
  { id: 'millionaire', name: 'Kado Millionaire', description: 'Earn 1 million lifetime points', icon: '💰', check: (g: GameState) => g.lifetimePoints >= 1_000_000 },
  { id: 'touch-grass', name: 'Touch Grass', description: 'Play for 60 minutes', icon: '🌱', check: (g: GameState) => g.playTime >= 3_600 },
  { id: 'legendary', name: 'Diamond Paws', description: 'Unlock Legendary Kado', icon: '💎', check: (g: GameState) => g.lifetimePoints >= 10_000_000 },
  { id: 'milestone-1m', name: 'Million Point Milestone', description: 'Reach 1 million lifetime KADO Points', icon: '🪙', check: (g: GameState) => g.lifetimePoints >= 1_000_000 },
  { id: 'milestone-10m', name: 'Ten Million Milestone', description: 'Reach 10 million lifetime KADO Points', icon: '✨', check: (g: GameState) => g.lifetimePoints >= 10_000_000 },
  { id: 'milestone-100m', name: 'Hundred Million Milestone', description: 'Reach 100 million lifetime KADO Points', icon: '🐾', check: (g: GameState) => g.lifetimePoints >= 100_000_000 },
  { id: 'milestone-1b', name: 'Billion Point Milestone', description: 'Reach 1 billion lifetime KADO Points', icon: '🪙', check: (g: GameState) => g.lifetimePoints >= 1_000_000_000 },
  { id: 'milestone-10b', name: 'Ten Billion Milestone', description: 'Reach 10 billion lifetime KADO Points', icon: '✨', check: (g: GameState) => g.lifetimePoints >= 10_000_000_000 },
  { id: 'milestone-100b', name: 'Hundred Billion Milestone', description: 'Reach 100 billion lifetime KADO Points', icon: '🐾', check: (g: GameState) => g.lifetimePoints >= 100_000_000_000 },
  { id: 'milestone-1t', name: 'Trillion Point Milestone', description: 'Reach 1 trillion lifetime KADO Points', icon: '👑', check: (g: GameState) => g.lifetimePoints >= 1_000_000_000_000 },
]

export const EVOLUTIONS = [
  { name: 'Baby Kado', threshold: 0, emoji: '🐶', subtitle: 'A tiny legend in the making', className: 'baby' },
  { name: 'Happy Kado', threshold: 1_000, emoji: '🐕', subtitle: 'Happiness is contagious', className: 'happy' },
  { name: 'Dripped-Out Kado', threshold: 10_000, emoji: '😎', subtitle: 'Too cool for the dog park', className: 'dripped' },
  { name: 'Golden Kado', threshold: 100_000, emoji: '🌟', subtitle: 'Shining brighter every click', className: 'golden' },
  { name: 'Galactic Kado', threshold: 1_000_000, emoji: '🚀', subtitle: 'Goodest dog in the galaxy', className: 'galactic' },
  { name: 'Legendary Kado', threshold: 10_000_000, emoji: '👑', subtitle: 'The legend. The very good boy.', className: 'legendary' },
]

function normalizeOwnedCount(value: number | undefined): number {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0
  return Math.max(0, Math.floor(safeValue))
}

export function createInitialState(): GameState {
  return { points: 0, lifetimePoints: 0, clicks: 0, owned: {}, goldenPaws: 0, prestigeCount: 0, achievements: [], playTime: 0, lastSavedAt: Date.now() }
}

export function upgradeCost(upgrade: Upgrade, owned: number): number {
  const safeOwned = normalizeOwnedCount(owned)
  return Math.ceil(upgrade.baseCost * PRICE_GROWTH ** safeOwned)
}

export function upgradeBatchCost(upgrade: Upgrade, owned: number, quantity: number): number {
  let total = 0
  for (let count = 0; count < quantity; count += 1) {
    total += upgradeCost(upgrade, owned + count)
    if (!Number.isFinite(total)) return Number.POSITIVE_INFINITY
  }
  return total
}

export function pointsPerClick(game: GameState): number {
  return 1
    + normalizeOwnedCount(game.owned.treat)
    + normalizeOwnedCount(game.owned['lucky-paw-charm']) * 25
    + normalizeOwnedCount(game.owned['diamond-paw-gauntlet']) * 1_000
}

export function pointsPerSecond(game: GameState): number {
  return UPGRADES.filter((upgrade) => upgrade.kind === 'passive')
    .reduce((total, upgrade) => total + normalizeOwnedCount(game.owned[upgrade.id]) * upgrade.effect, 0)
}

export function productionMultiplier(game: GameState): number {
  return 1 + game.goldenPaws * 0.05
}

export function getEvolution(lifetimePoints: number): number {
  return EVOLUTIONS.reduce((current, stage, index) => lifetimePoints >= stage.threshold ? index : current, 0)
}

export function awardPoints(game: GameState, amount: number): GameState {
  return { ...game, points: game.points + amount, lifetimePoints: game.lifetimePoints + amount }
}

export function purchaseUpgrade(game: GameState, upgrade: Upgrade): GameState | null {
  const owned = normalizeOwnedCount(game.owned[upgrade.id])
  const cost = upgradeCost(upgrade, owned)
  if (game.points < cost) return null
  return { ...game, points: game.points - cost, owned: { ...game.owned, [upgrade.id]: owned + 1 } }
}

export type PurchaseQuantity = 1 | 10 | 'max'

export function purchaseUpgrades(game: GameState, upgrade: Upgrade, quantity: PurchaseQuantity): GameState | null {
  const targetCount = quantity === 'max' ? Number.POSITIVE_INFINITY : quantity
  let updated = game
  let purchased = 0
  while (purchased < targetCount) {
    const next = purchaseUpgrade(updated, upgrade)
    if (!next) return quantity === 'max' && purchased > 0 ? updated : null
    updated = next
    purchased += 1
  }
  return updated
}

export function validateSave(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const data = value as Record<string, unknown>
  const validNumber = (key: string) => typeof data[key] === 'number' && Number.isFinite(data[key]) && (data[key] as number) >= 0
  if (!['points', 'lifetimePoints', 'clicks', 'goldenPaws', 'prestigeCount', 'playTime', 'lastSavedAt'].every(validNumber)) return null
  if (!data.owned || typeof data.owned !== 'object' || Array.isArray(data.owned)) return null
  const rawOwned = data.owned as Record<string, unknown>
  const owned: Record<string, number> = {}
  for (const upgrade of UPGRADES) {
    const amount = rawOwned[upgrade.id] ?? 0
    if (typeof amount !== 'number' || !Number.isFinite(amount) || !Number.isSafeInteger(amount) || amount < 0) return null
    owned[upgrade.id] = amount
  }
  if (!Array.isArray(data.achievements) || !data.achievements.every((item) => typeof item === 'string')) return null
  const achievements = [...new Set(data.achievements.filter((id) => ACHIEVEMENTS.some((achievement) => achievement.id === id)))]
  return {
    points: data.points as number,
    lifetimePoints: data.lifetimePoints as number,
    clicks: data.clicks as number,
    goldenPaws: data.goldenPaws as number,
    prestigeCount: data.prestigeCount as number,
    playTime: data.playTime as number,
    lastSavedAt: data.lastSavedAt as number,
    owned,
    achievements,
  }
}

export function restoreSave(raw: string | null, now = Date.now()): { game: GameState; offlineEarnings: number; corrupted: boolean } {
  if (!raw) return { game: createInitialState(), offlineEarnings: 0, corrupted: false }
  try {
    const parsed: unknown = JSON.parse(raw)
    const saved = validateSave(parsed)
    if (!saved) return { game: createInitialState(), offlineEarnings: 0, corrupted: true }
    const elapsed = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - saved.lastSavedAt) / 1000))
    const offlineEarnings = pointsPerSecond(saved) * productionMultiplier(saved) * elapsed
    return { game: { ...awardPoints(saved, offlineEarnings), lastSavedAt: now }, offlineEarnings, corrupted: false }
  } catch {
    return { game: createInitialState(), offlineEarnings: 0, corrupted: true }
  }
}

export function formatNumber(value: number): string {
  if (Number.isNaN(value)) return '0'
  if (value === Number.POSITIVE_INFINITY) return '∞'
  if (value === Number.NEGATIVE_INFINITY) return '−∞'
  const absolute = Math.abs(value)
  if (absolute < 1_000) return Math.floor(value).toLocaleString('en-US')
  const suffixes = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg']
  const exponent = Math.floor(Math.log10(absolute) / 3)
  const scaled = absolute / 1_000 ** exponent
  const formatted = scaled.toFixed(1).replace(/\.0$/, '')
  const suffix = suffixes[exponent - 1]
  if (!suffix) return `${value < 0 ? '−' : ''}${absolute.toExponential(2).replace('e+', 'e')}`
  return `${value < 0 ? '−' : ''}${formatted}${suffix}`
}
