import { createClient } from '@supabase/supabase-js'
import { UPGRADES } from './game'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type LeaderboardKind = 'clicks' | 'lifetime' | 'points'

export type LeaderboardEntry = {
  username: string
  score: number
  clicks: number
  lifetime_points: number
  points: number
}

export type PublicLeaderboards = Record<LeaderboardKind, LeaderboardEntry[]>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function parsePublicLeaderboards(value: unknown): PublicLeaderboards | null {
  if (!isRecord(value)) return null
  const boards = {} as PublicLeaderboards
  for (const kind of ['clicks', 'lifetime', 'points'] as const) {
    const entries = value[kind]
    if (!Array.isArray(entries)) return null
    const parsed: LeaderboardEntry[] = []
    for (const entry of entries) {
      if (!isRecord(entry)
        || typeof entry.username !== 'string'
        || !/^[A-Za-z0-9_]{3,20}$/.test(entry.username)
        || typeof entry.score !== 'number'
        || !Number.isFinite(entry.score)
        || entry.score < 0
        || !['clicks', 'lifetime_points', 'points'].every((field) => typeof entry[field] === 'number' && Number.isFinite(entry[field]) && (entry[field] as number) >= 0)) {
        return null
      }
      parsed.push({
        username: entry.username,
        score: entry.score,
        clicks: entry.clicks as number,
        lifetime_points: entry.lifetime_points as number,
        points: entry.points as number,
      })
    }
    boards[kind] = parsed
  }
  return boards
}

export type ServerGameSnapshot = {
  game: {
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
  offlineEarnings: number
  activeEvent: { type: 'zoomies' | 'viral' | 'nap'; endsAt: number } | null
}

export function parseServerGameSnapshot(value: unknown): ServerGameSnapshot | null {
  if (!isRecord(value)) return null
  const snapshot = value
  const rawGame = snapshot.game
  if (!isRecord(rawGame)) return null
  const game = rawGame
  const numericFields = ['points', 'lifetimePoints', 'clicks', 'goldenPaws', 'prestigeCount', 'playTime', 'lastSavedAt']
  if (!numericFields.every((field) => typeof game[field] === 'number' && Number.isFinite(game[field]) && (game[field] as number) >= 0)) return null
  if (!['clicks', 'goldenPaws', 'prestigeCount', 'playTime'].every((field) => Number.isSafeInteger(game[field]))) return null
  if (!isRecord(game.owned)) return null
  const rawOwned = game.owned
  const owned: Record<string, number> = {}
  for (const upgrade of UPGRADES) {
    const count = rawOwned[upgrade.id]
    if (count === undefined && upgrade.unlockAt !== undefined) {
      owned[upgrade.id] = 0
      continue
    }
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) return null
    owned[upgrade.id] = count
  }
  if (!Array.isArray(game.achievements) || !game.achievements.every((id) => typeof id === 'string')) return null
  if (typeof snapshot.offlineEarnings !== 'number' || !Number.isFinite(snapshot.offlineEarnings) || snapshot.offlineEarnings < 0) return null
  const rawEvent = snapshot.activeEvent
  let activeEvent: ServerGameSnapshot['activeEvent'] = null
  if (rawEvent !== null) {
    if (!isRecord(rawEvent)) return null
    const event = rawEvent
    if (!['zoomies', 'viral', 'nap'].includes(String(event.type)) || typeof event.endsAt !== 'number' || !Number.isFinite(event.endsAt)) return null
    activeEvent = { type: event.type as 'zoomies' | 'viral' | 'nap', endsAt: event.endsAt }
  }
  return {
    game: {
      points: game.points as number,
      lifetimePoints: game.lifetimePoints as number,
      clicks: game.clicks as number,
      owned,
      goldenPaws: game.goldenPaws as number,
      prestigeCount: game.prestigeCount as number,
      achievements: game.achievements,
      playTime: game.playTime as number,
      lastSavedAt: game.lastSavedAt as number,
    },
    offlineEarnings: snapshot.offlineEarnings,
    activeEvent,
  }
}
