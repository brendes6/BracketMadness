import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function Home() {
    const [leagues, setLeagues] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({ name: '', size: 4, players: '', randomize: true, first_round_bye: false })
    const [error, setError] = useState(null)
    const [creating, setCreating] = useState(false)

    const fetchLeagues = () => {
        fetch(`${API}/leagues`)
            .then(r => r.json())
            .then(data => {
                setLeagues(data.leagues || [])
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }

    useEffect(() => { fetchLeagues() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        setCreating(true)
        setError(null)

        const playerNames = formData.players
            .split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)

        if (playerNames.length !== formData.size) {
            setError(`Need exactly ${formData.size} player names, got ${playerNames.length}`)
            setCreating(false)
            return
        }

        try {
            const res = await fetch(`${API}/leagues`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    size: formData.size,
                    players: playerNames,
                    randomize: formData.randomize,
                    first_round_bye: formData.first_round_bye,
                }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create league')
            }
            setFormData({ name: '', size: 4, players: '', randomize: true, first_round_bye: false })
            setShowForm(false)
            fetchLeagues()
        } catch (err) {
            setError(err.message)
        } finally {
            setCreating(false)
        }
    }

    const sizeOptions = []
    for (let i = 4; i <= 64; i += 2) {
        sizeOptions.push(i)
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Cover the Spread</h1>
                    <p className="text-sm text-gray-500">March Madness Bracket Manager</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                >
                    {showForm ? 'Cancel' : '+ New League'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="float-right font-bold">×</button>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded p-4 mb-6">
                    <h2 className="font-semibold mb-3">Create League</h2>
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">League Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Dave's Pool"
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Size (must be even, 4–64)
                        </label>
                        <select
                            value={formData.size}
                            onChange={e => setFormData({ ...formData, size: parseInt(e.target.value) })}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                            {sizeOptions.map(n => (
                                <option key={n} value={n}>{n} players</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Player Names (one per line, exactly {formData.size})
                        </label>
                        <textarea
                            required
                            rows={Math.min(formData.size, 10)}
                            value={formData.players}
                            onChange={e => setFormData({ ...formData, players: e.target.value })}
                            placeholder={"Alice\nBob\nCharlie\n..."}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                        />
                    </div>
                    <div className="mb-4 flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.randomize}
                                onChange={e => setFormData({ ...formData, randomize: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            Randomize Team Assignments
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                disabled={formData.size === 64}
                                checked={formData.first_round_bye && formData.size < 64}
                                onChange={e => setFormData({ ...formData, first_round_bye: e.target.checked })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className={formData.size === 64 ? "opacity-50" : ""}>
                                First Round Bye (Players inevitably play themselves Round 1)
                            </span>
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        {creating ? 'Creating...' : 'Create League'}
                    </button>
                </form>
            )}

            {loading ? (
                <p className="text-gray-500 text-sm">Loading leagues...</p>
            ) : leagues.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-lg mb-1">No leagues yet</p>
                    <p className="text-sm">Create one to get started.</p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase">
                                <th className="px-4 py-3">League</th>
                                <th className="px-4 py-3">Size</th>
                                <th className="px-4 py-3">Active</th>
                                <th className="px-4 py-3">Eliminated</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {leagues.map(l => (
                                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{l.name}</td>
                                    <td className="px-4 py-3 text-gray-600">{l.size}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-green-700 font-medium">{l.active_players}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-red-600 font-medium">{l.total_players - l.active_players}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            to={`/league/${l.id}`}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            View Bracket →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
