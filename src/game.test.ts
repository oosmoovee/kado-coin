import { describe, expect, it } from 'vitest'
import {
  ACHIEVEMENTS, OFFLINE_CAP_SECONDS, UPGRADES, awardPoints, createInitialState, formatNumber, getEvolution,
  pointsPerClick, pointsPerSecond, purchaseUpgrade, purchaseUpgrades, restoreSave, upgradeBatchCost, upgradeCost,
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

  it('keeps all original upgrades and includes the requested new shop items', () => {
    expect(UPGRADES.slice(0, 8).map(({ id }) => id)).toEqual([
      'treat', 'toy', 'collar', 'doghouse', 'factory', 'algorithm', 'rocket', 'universe',
    ])
    expect(UPGRADES).toHaveLength(18)
    expect(UPGRADES.find(({ id }) => id === 'lucky-clover-field')).toMatchObject({ baseCost: 5_000_000, effect: 50_000 })
    expect(UPGRADES.find(({ id }) => id === 'lucky-paw-charm')).toMatchObject({ kind: 'click', baseCost: 2_000_000, effect: 25 })
    expect(UPGRADES.find(({ id }) => id === 'diamond-paw-gauntlet')).toMatchObject({ kind: 'click', baseCost: 100_000_000, effect: 1_000 })
  })

  it('calculates passive production', () => {
    const game = { ...createInitialState(), owned: { toy: 2, collar: 1, 'lucky-clover-field': 1, 'legendary-luck-reactor': 1 } }
    expect(pointsPerSecond(game)).toBe(2 + 5 + 50_000 + 2_500_000_000)
  })

  it('adds both optional paw upgrades to points earned per click', () => {
    const game = { ...createInitialState(), owned: { treat: 2, 'lucky-paw-charm': 1, 'diamond-paw-gauntlet': 2 } }
    expect(pointsPerClick(game)).toBe(2_028)
  })

  it('supports atomic buy-ten and buy-max selections with the existing price curve', () => {
    const toy = UPGRADES.find(({ id }) => id === 'toy')!
    expect(upgradeBatchCost(toy, 0, 2)).toBe(215)
    expect(purchaseUpgrades({ ...createInitialState(), points: 214 }, toy, 10)).toBeNull()
    const ten = purchaseUpgrades({ ...createInitialState(), points: upgradeBatchCost(toy, 0, 10) }, toy, 10)!
    expect(ten.owned.toy).toBe(10)
    expect(ten.points).toBe(0)
    const max = purchaseUpgrades({ ...createInitialState(), points: 215 }, toy, 'max')!
    expect(max.owned.toy).toBe(2)
    expect(max.points).toBe(0)
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
    expect(restored.game.owned.toy).toBe(2)
    expect(restored.game.owned['lucky-clover-field']).toBe(0)
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

  it('unlocks all seven lifetime milestones without changing evolution thresholds', () => {
    const milestones = ACHIEVEMENTS.filter(({ id }) => id.startsWith('milestone-'))
    expect(milestones).toHaveLength(7)
    expect(milestones.map(({ check }) => check({ ...createInitialState(), lifetimePoints: 1_000_000_000_000 }))).toEqual(Array(7).fill(true))
    expect(getEvolution(10_000_000)).toBe(5)
  })

  it('formats trillions, quadrillions, and very large values without broken numbers', () => {
    expect(formatNumber(1_000_000_000_000)).toBe('1T')
    expect(formatNumber(1_000_000_000_000_000)).toBe('1Qa')
    expect(formatNumber(1e60)).toBe('1Nod')
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('∞')
  })
})
