import { describe, expect, it } from 'vitest'
import {
  OFFLINE_CAP_SECONDS, UPGRADES, awardPoints, createInitialState, getEvolution,
  pointsPerClick, pointsPerSecond, purchaseUpgrade, restoreSave, upgradeCost,
} from './game'

describe('game calculations', () => {
  it('starts with zero points and earns one point per click', () => {
    const game = createInitialState()
    expect(game.points).toBe(0)
    expect(pointsPerClick(game)).toBe(1)
    expect(awardPoints(game, pointsPerClick(game)).points).toBe(1)
  })

  it('prices repeated upgrades consistently and applies their effects', () => {
    const dogTreat = UPGRADES.find((upgrade) => upgrade.id === 'treat')!
    expect(upgradeCost(dogTreat, 0)).toBe(15)
    expect(upgradeCost(dogTreat, 1)).toBe(18)
    expect(purchaseUpgrade(createInitialState(), dogTreat)).toBeNull()
    const purchased = purchaseUpgrade({ ...createInitialState(), points: 15 }, dogTreat)!
    expect(purchased.points).toBe(0)
    expect(purchased.owned.treat).toBe(1)
    expect(pointsPerClick(purchased)).toBe(2)
  })

  it('calculates passive production', () => {
    const game = { ...createInitialState(), owned: { toy: 2, collar: 1 } }
    expect(pointsPerSecond(game)).toBe(7)
  })

  it('unlocks evolution thresholds from lifetime points', () => {
    expect(getEvolution(0)).toBe(0)
    expect(getEvolution(1_000)).toBe(1)
    expect(getEvolution(10_000)).toBe(2)
    expect(getEvolution(10_000_000)).toBe(5)
  })

  it('restores validated saves and caps offline earnings at eight hours', () => {
    const saved = { ...createInitialState(), points: 40, owned: { toy: 2 }, lastSavedAt: 1_000 }
    const restored = restoreSave(JSON.stringify(saved), 1_000 + 24 * 60 * 60 * 1_000)
    expect(restored.game.points).toBe(40 + OFFLINE_CAP_SECONDS * 2)
    expect(restored.offlineEarnings).toBe(OFFLINE_CAP_SECONDS * 2)
    expect(restored.corrupted).toBe(false)
  })

  it('normalizes negative upgrade counts instead of letting them underflow game values', () => {
    const dogTreat = UPGRADES.find((upgrade) => upgrade.id === 'treat')!
    const game = { ...createInitialState(), owned: { treat: -3, toy: -2 } }
    expect(pointsPerClick(game)).toBe(1)
    expect(pointsPerSecond(game)).toBe(0)
    const purchased = purchaseUpgrade({ ...createInitialState(), points: 15, owned: { treat: -2 } }, dogTreat)!
    expect(purchased.points).toBe(0)
    expect(purchased.owned.treat).toBe(1)
  })

  it('rejects corrupt and structurally invalid saves without throwing', () => {
    expect(restoreSave('{broken').corrupted).toBe(true)
    expect(restoreSave(JSON.stringify({ points: -1 })).corrupted).toBe(true)
  })
})
