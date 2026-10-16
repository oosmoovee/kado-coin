import { describe, expect, it } from 'vitest'
import { parsePublicLeaderboards, parseServerGameSnapshot } from './supabase'

const validSnapshot = {
  game: {
    points: 125,
    lifetimePoints: 250,
    clicks: 25,
    owned: { treat: 1, toy: 2, collar: 0, doghouse: 0, factory: 0, algorithm: 0, rocket: 0, universe: 0 },
    goldenPaws: 1,
    prestigeCount: 1,
    achievements: ['first-bark'],
    playTime: 300,
    lastSavedAt: 1_700_000_000_000,
  },
  offlineEarnings: 25,
  activeEvent: { type: 'zoomies', endsAt: 1_700_000_030_000 },
}

describe('Supabase response parsing', () => {
  it('accepts a valid ranked game snapshot', () => {
    expect(parseServerGameSnapshot(validSnapshot)).toMatchObject({
      game: { points: 125, clicks: 25, achievements: ['first-bark'] },
      offlineEarnings: 25,
      activeEvent: { type: 'zoomies' },
    })
  })

  it('rejects invalid ranked state and malformed achievement data', () => {
    expect(parseServerGameSnapshot({ ...validSnapshot, game: { ...validSnapshot.game, clicks: 1.5 } })).toBeNull()
    expect(parseServerGameSnapshot({ ...validSnapshot, game: { ...validSnapshot.game, achievements: [1] } })).toBeNull()
    expect(parseServerGameSnapshot({ ...validSnapshot, game: { ...validSnapshot.game, owned: [] } })).toBeNull()
  })

  it('accepts only complete, valid public leaderboard rows', () => {
    const boards = {
      clicks: [{ username: 'KadoKeeper', score: 10, clicks: 10, lifetime_points: 20, points: 5 }],
      lifetime: [],
      points: [],
    }
    expect(parsePublicLeaderboards(boards)).toEqual(boards)
    expect(parsePublicLeaderboards({ ...boards, clicks: [{ ...boards.clicks[0], username: 'bad name' }] })).toBeNull()
    expect(parsePublicLeaderboards({ ...boards, clicks: [{ username: 'KadoKeeper', score: -1, clicks: 10, lifetime_points: 20, points: 5 }] })).toBeNull()
  })
})
