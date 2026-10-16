import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Trophy } from 'lucide-react'
import { formatNumber } from './game'
import { parsePublicLeaderboards, supabase, type LeaderboardKind, type PublicLeaderboards } from './supabase'

const EMPTY_BOARDS: PublicLeaderboards = { clicks: [], lifetime: [], points: [] }
const BOARD_LABELS: Record<LeaderboardKind, string> = {
  clicks: 'Clicks',
  lifetime: 'Lifetime',
  points: 'KADO Points',
}

export function LeaderboardPanel({ onAccountClick, username }: { onAccountClick: () => void; username: string | null }) {
  const [board, setBoard] = useState<LeaderboardKind>('clicks')
  const [boards, setBoards] = useState<PublicLeaderboards>(EMPTY_BOARDS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(supabase))

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const { data, error: requestError } = await supabase.rpc('get_public_leaderboards')
      if (requestError) {
        setError('Leaderboard could not be loaded.')
        setLoading(false)
        console.error('Unable to load public leaderboards:', requestError)
        return
      }
      const parsed = parsePublicLeaderboards(data)
      if (!parsed) {
        setError('Leaderboard data was invalid.')
        setLoading(false)
        console.error('Received invalid public leaderboard data.')
        return
      }
      setBoards(parsed)
      setError('')
      setLoading(false)
    } catch (error) {
      setError('Leaderboard could not be loaded.')
      setLoading(false)
      console.error('Unable to load public leaderboards:', error)
    }
  }, [])

  useEffect(() => {
    void refresh()
    if (!supabase) return
    const interval = window.setInterval(() => void refresh(), 15_000)
    return () => window.clearInterval(interval)
  }, [refresh])

  return (
    <section className="leaderboard-card panel">
      <div className="leaderboard-heading">
        <div className="section-kicker"><Trophy size={14} /> LEADERBOARD</div>
        <button className="leaderboard-refresh" onClick={() => void refresh()} aria-label="Refresh leaderboard" title="Refresh leaderboard"><RefreshCw size={13} /></button>
      </div>
      <div className="leaderboard-tabs" role="tablist" aria-label="Leaderboard categories">
        {(Object.keys(BOARD_LABELS) as LeaderboardKind[]).map((kind) => (
          <button key={kind} role="tab" aria-selected={board === kind} className={board === kind ? 'active' : ''} onClick={() => setBoard(kind)}>{BOARD_LABELS[kind]}</button>
        ))}
      </div>
      {!supabase
        ? <div className="leaderboard-empty">Online leaderboard setup is not connected yet.</div>
        : loading
          ? <div className="leaderboard-empty">Loading players…</div>
          : error
            ? <div className="leaderboard-empty">{error}</div>
            : boards[board].length === 0
              ? <div className="leaderboard-empty">No ranked players yet. Be the first!</div>
              : <ol className="leaderboard-list">
                {boards[board].map((entry, index) => (
                  <li key={`${entry.username}-${index}`}>
                    <span className={`leaderboard-rank ${index < 3 ? 'top-three' : ''}`}>{index + 1}</span>
                    <span className="leaderboard-username">{entry.username}</span>
                    <strong>{formatNumber(entry.score)}</strong>
                  </li>
                ))}
              </ol>}
      <div className="leaderboard-account">
        {username
          ? <><span>Playing as <b>{username}</b></span><button onClick={onAccountClick}>Account</button></>
          : <><span>Want to rank? Create an account.</span><button onClick={onAccountClick}>Sign in</button></>}
      </div>
      <small className="leaderboard-updated">Refreshes automatically every 15 seconds</small>
    </section>
  )
}
