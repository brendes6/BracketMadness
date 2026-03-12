import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Admin() {
    const [leagues, setLeagues] = useState([])
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    // View state
    const [mode, setMode] = useState('spread') // 'spread' or 'score'

    // Form state
    const [leagueId, setLeagueId] = useState('')
    const [favId, setFavId] = useState('')
    const [undId, setUndId] = useState('')
    const [spread, setSpread] = useState('')
    const [favScore, setFavScore] = useState('')
    const [undScore, setUndScore] = useState('')

    useEffect(() => {
        Promise.all([
            fetch(`${API}/leagues`).then(r => r.json()),
            fetch(`${API}/teams`).then(r => r.json())
        ])
            .then(([leagueData, teamData]) => {
                setLeagues(leagueData.leagues || [])
                setTeams(teamData.teams || [])
                if (leagueData.leagues?.length > 0) setLeagueId(leagueData.leagues[0].id)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (favId === undId) {
            setError("Favorite and Underdog cannot be the same team.")
            return
        }

        const endpoint = mode === 'spread' ? `${API}/admin/spread` : `${API}/admin/score`
        const payload = {
            league_id: parseInt(leagueId, 10),
            favorite_id: parseInt(favId, 10),
            underdog_id: parseInt(undId, 10),
        }

        if (mode === 'spread') {
            payload.spread = parseFloat(spread)
        } else {
            payload.favorite_score = parseInt(favScore, 10)
            payload.underdog_score = parseInt(undScore, 10)
        }

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to submit')

            if (mode === 'spread') {
                setSuccess(`Spread updated! Matchup #${data.matchup_id} is pending tonight's game.`)
                setSpread('')
            } else {
                setSuccess(`Final score saved! Matchup #${data.matchup_id} Cover the Spread rules applied.`)
                setFavScore('')
                setUndScore('')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    if (loading) return <div className="p-8 text-gray-500">Loading Admin...</div>

    return (
        <div className="min-h-screen bg-white">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-blue-600 hover:underline text-sm">← Back to App</Link>
                <h1 className="text-xl font-bold text-red-600">Admin Control Panel</h1>
            </div>

            <div className="max-w-2xl mx-auto p-6">
                
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        className={`flex-1 py-3 text-sm font-medium border-b-2 ${mode === 'spread' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => { setMode('spread'); setError(null); setSuccess(null); }}
                    >
                        Enter Spread for Upcoming Game
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-medium border-b-2 ${mode === 'score' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => { setMode('score'); setError(null); setSuccess(null); }}
                    >
                        Enter Final Score for Completed Game
                    </button>
                </div>

                <div className="mb-6">
                    {mode === 'spread' ? (
                        <p className="text-sm text-gray-500">Create a pending matchup and lock in the point spread before the game starts.</p>
                    ) : (
                        <p className="text-sm text-gray-500">Enter the final score for a pending matchup to calculate the margin and eliminate/move players.</p>
                    )}
                </div>

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">{error}</div>}
                {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm mb-4">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target League</label>
                        <select
                            value={leagueId}
                            onChange={(e) => setLeagueId(e.target.value)}
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            required
                        >
                            {leagues.map(l => (
                                <option key={l.id} value={l.id}>{l.name} (Size: {l.size})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Favorite Team */}
                        <div className="p-4 border border-blue-200 bg-blue-50 rounded">
                            <h3 className="text-sm font-bold text-blue-800 mb-3">Favorite</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Team</label>
                                    <select
                                        value={favId}
                                        onChange={(e) => setFavId(e.target.value)}
                                        className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                        required
                                    >
                                        <option value="">Select Favorite...</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>[{t.region} {t.seed}] {t.name}</option>)}
                                    </select>
                                </div>
                                {mode === 'score' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Final Score</label>
                                        <input
                                            type="number"
                                            value={favScore}
                                            onChange={(e) => setFavScore(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                            placeholder="e.g. 75"
                                            required={mode === 'score'}
                                        />
                                    </div>
                                )}
                                {mode === 'spread' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Spread (Expected Margin)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={spread}
                                            onChange={(e) => setSpread(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                            placeholder="e.g. 5.5"
                                            required={mode === 'spread'}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Underdog Team */}
                        <div className="p-4 border border-gray-200 bg-gray-50 rounded">
                            <h3 className="text-sm font-bold text-gray-800 mb-3">Underdog</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Team</label>
                                    <select
                                        value={undId}
                                        onChange={(e) => setUndId(e.target.value)}
                                        className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                        required
                                    >
                                        <option value="">Select Underdog...</option>
                                        {teams.map(t => <option key={t.id} value={t.id}>[{t.region} {t.seed}] {t.name}</option>)}
                                    </select>
                                </div>
                                {mode === 'score' && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Final Score</label>
                                        <input
                                            type="number"
                                            value={undScore}
                                            onChange={(e) => setUndScore(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-1.5 text-sm"
                                            placeholder="e.g. 68"
                                            required={mode === 'score'}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`w-full text-white font-medium rounded py-3 hover:opacity-90 transition ${mode === 'spread' ? 'bg-red-600' : 'bg-blue-600'}`}
                    >
                        {mode === 'spread' ? 'Lock in Spread →' : 'Submit Final Score & Apply Rules →'}
                    </button>
                </form>
            </div>
        </div>
    )
}
