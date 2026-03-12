import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Standard NCAA bracket matchup order per region (seed pairings)
const BRACKET_ORDER = [
    [1, 16], [8, 9], [5, 12], [4, 13],
    [6, 11], [3, 14], [7, 10], [2, 15],
]

// Regions layout: left half and right half
const LEFT_REGIONS = ['East', 'West']
const RIGHT_REGIONS = ['South', 'Midwest']

export default function LeagueView() {
    const { id } = useParams()
    const [league, setLeague] = useState(null)
    const [players, setPlayers] = useState([])
    const [matchups, setMatchups] = useState([])
    const [teams, setTeams] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        Promise.all([
            fetch(`${API}/league/${id}`).then(r => r.json()),
            fetch(`${API}/matchups/${id}`).then(r => r.json()),
            fetch(`${API}/teams`).then(r => r.json()),
        ])
            .then(([leagueData, matchupData, teamData]) => {
                setLeague(leagueData.league)
                setPlayers(leagueData.players || [])
                setMatchups(matchupData.matchups || [])
                setTeams(teamData.teams || [])
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [id])

    if (loading) return <div className="p-8 text-gray-500">Loading bracket…</div>
    if (error) return (
        <div className="p-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
        </div>
    )

    // Build lookup maps
    const teamById = {}
    teams.forEach(t => { teamById[t.id] = t })

    // Map: teamId -> list of players INITIALLY on that team
    const playersByInitialTeamId = {}
    players.forEach(p => {
        if (!playersByInitialTeamId[p.initial_team_id]) playersByInitialTeamId[p.initial_team_id] = []
        playersByInitialTeamId[p.initial_team_id].push(p)
    })

    // Build matchup index: key = "favId-undId" -> matchup
    const matchupByTeamPair = {}
    matchups.forEach(m => {
        matchupByTeamPair[`${m.favorite_id}-${m.underdog_id}`] = m
        matchupByTeamPair[`${m.underdog_id}-${m.favorite_id}`] = m
    })

    // Group teams by region
    const teamsByRegion = {}
    teams.forEach(t => {
        if (!teamsByRegion[t.region]) teamsByRegion[t.region] = {}
        teamsByRegion[t.region][t.seed] = t
    })

    const activeCount = players.filter(p => p.status === 'active').length

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <Link to="/" className="text-blue-600 hover:underline text-sm">← Back</Link>
                <div className="flex items-center justify-between mt-1">
                    <h1 className="text-xl font-bold">{league?.name}</h1>
                    <span className="text-sm text-gray-500">{activeCount} / {players.length} players active</span>
                </div>
            </div>

            {/* Bracket */}
            <div className="overflow-x-auto overflow-y-auto p-4">
                <div style={{ minWidth: '1400px' }}>
                    {/* Top half: East (left) vs South (right) */}
                    <BracketHalf
                        leftRegion={LEFT_REGIONS[0]}
                        rightRegion={RIGHT_REGIONS[0]}
                        teamsByRegion={teamsByRegion}
                        matchupByTeamPair={matchupByTeamPair}
                        playersByInitialTeamId={playersByInitialTeamId}
                        teamById={teamById}
                        label="Semifinal 1"
                    />

                    {/* Championship placeholder */}
                    <div className="flex justify-center my-2">
                        <div className="bg-gray-100 border border-gray-300 rounded px-6 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Championship
                        </div>
                    </div>

                    {/* Bottom half: West (left) vs Midwest (right) */}
                    <BracketHalf
                        leftRegion={LEFT_REGIONS[1]}
                        rightRegion={RIGHT_REGIONS[1]}
                        teamsByRegion={teamsByRegion}
                        matchupByTeamPair={matchupByTeamPair}
                        playersByInitialTeamId={playersByInitialTeamId}
                        teamById={teamById}
                        label="Semifinal 2"
                    />
                </div>
            </div>
        </div>
    )
}

/**
 * Given a round of matchup entries, determine winners and build the next round.
 * Each entry is { topTeam, botTeam, matchup } or null (TBD).
 * Returns the next round where pairs of winners form new matchups.
 */
function buildNextRound(prevRound, matchupByTeamPair) {
    const nextRound = []
    for (let i = 0; i < prevRound.length; i += 2) {
        const m1 = prevRound[i]
        const m2 = prevRound[i + 1]

        const win1 = getWinnerInfo(m1)
        const win2 = getWinnerInfo(m2)

        if (win1 && win2) {
            // Both games decided — look up the matchup between the two winners
            const key = `${win1.team.id}-${win2.team.id}`
            const matchup = matchupByTeamPair[key] || null
            nextRound.push({ 
                topTeam: win1.team, botTeam: win2.team, matchup,
                topPlayers: win1.players, botPlayers: win2.players 
            })
        } else if (win1 && !win2) {
            nextRound.push({ 
                topTeam: win1.team, botTeam: null, matchup: null,
                topPlayers: win1.players, botPlayers: [] 
            })
        } else if (!win1 && win2) {
            nextRound.push({ 
                topTeam: null, botTeam: win2.team, matchup: null,
                topPlayers: [], botPlayers: win2.players 
            })
        } else {
            nextRound.push(null) // both TBD
        }
    }
    return nextRound
}

/** Get the winning team AND the owning players based on Cover the Spread logic */
function getWinnerInfo(entry) {
    if (!entry || !entry.matchup || entry.matchup.result !== 'final') return null
    const m = entry.matchup
    const { topTeam, botTeam, topPlayers, botPlayers } = entry

    if (!topTeam || !botTeam) return null

    const topIsFav = m.favorite_id === topTeam.id
    const margin = m.favorite_score - m.underdog_score
    const covered = margin > m.spread

    if (margin > 0) {
        // Favorite wins
        if (covered) {
            // Fav wins & covers -> Fav stays
            return {
                team: topIsFav ? topTeam : botTeam,
                players: topIsFav ? topPlayers : botPlayers
            }
        } else {
            // Fav wins but no cover -> Und takes Fav team
            return {
                team: topIsFav ? topTeam : botTeam,
                players: topIsFav ? botPlayers : topPlayers
            }
        }
    } else {
        // Underdog wins -> Und stays
        return {
            team: topIsFav ? botTeam : topTeam,
            players: topIsFav ? botPlayers : topPlayers
        }
    }
}

/* One half of the bracket: left region flowing right ↔ right region flowing left */
function BracketHalf({ leftRegion, rightRegion, teamsByRegion, matchupByTeamPair, playersByInitialTeamId, teamById, label }) {
    const leftTeams = teamsByRegion[leftRegion] || {}
    const rightTeams = teamsByRegion[rightRegion] || {}

    return (
        <div className="flex items-center">
            {/* Left region - flows left to right */}
            <RegionBracket
                region={leftRegion}
                teamsMap={leftTeams}
                matchupByTeamPair={matchupByTeamPair}
                playersByInitialTeamId={playersByInitialTeamId}
                direction="ltr"
            />

            {/* Center: Final Four slot */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center px-3" style={{ width: '120px' }}>
                <div className="text-xs text-gray-400 font-semibold uppercase mb-1">{label}</div>
                <div className="w-full border border-dashed border-gray-300 rounded p-2 text-center">
                    <div className="h-6 text-xs text-gray-300">TBD</div>
                    <div className="border-t border-dashed border-gray-300 my-1" />
                    <div className="h-6 text-xs text-gray-300">TBD</div>
                </div>
            </div>

            {/* Right region - flows right to left */}
            <RegionBracket
                region={rightRegion}
                teamsMap={rightTeams}
                matchupByTeamPair={matchupByTeamPair}
                playersByInitialTeamId={playersByInitialTeamId}
                direction="rtl"
            />
        </div>
    )
}

/* A single region's bracket (4 rounds: R64, R32, Sweet 16, Elite 8) */
function RegionBracket({ region, teamsMap, matchupByTeamPair, playersByInitialTeamId, direction }) {
    // Build round 1 matchups from standard bracket order
    const r1 = BRACKET_ORDER.map(([highSeed, lowSeed]) => {
        const topTeam = teamsMap[highSeed]
        const botTeam = teamsMap[lowSeed]
        if (!topTeam || !botTeam) return null

        const key = `${topTeam.id}-${botTeam.id}`
        const matchup = matchupByTeamPair[key] || null
        
        const topPlayers = playersByInitialTeamId[topTeam.id] || []
        const botPlayers = playersByInitialTeamId[botTeam.id] || []

        return { topTeam, botTeam, matchup, topPlayers, botPlayers }
    }).filter(Boolean)

    // Build full bracket tree: R64 -> R32 -> S16 -> E8
    const roundCount = 4
    const rounds = [r1]

    for (let r = 1; r < roundCount; r++) {
        const prevRound = rounds[r - 1]
        const nextRound = buildNextRound(prevRound, matchupByTeamPair)
        rounds.push(nextRound)
    }

    const roundLabels = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8']

    const cols = direction === 'ltr' ? rounds : [...rounds].reverse()
    const colLabels = direction === 'ltr' ? roundLabels : [...roundLabels].reverse()

    return (
        <div className="flex-1">
            {/* Region label */}
            <div className="text-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{region}</span>
            </div>

            <div className="flex">
                {cols.map((round, colIdx) => {
                    const actualRoundIdx = direction === 'ltr' ? colIdx : rounds.length - 1 - colIdx
                    const spacingPower = direction === 'ltr' ? colIdx : rounds.length - 1 - colIdx

                    return (
                        <div key={colIdx} className="flex-1 flex flex-col" style={{ minWidth: '150px' }}>
                            <div className="text-center mb-1">
                                <span className="text-[10px] text-gray-400 uppercase">{colLabels[colIdx]}</span>
                            </div>
                            <div
                                className="flex flex-col justify-around flex-1"
                                style={{ gap: `${Math.pow(2, spacingPower) * 4 - 4}px` }}
                            >
                                {round.map((item, matchIdx) => {
                                    if (!item) {
                                        // TBD slot
                                        return (
                                            <div key={matchIdx} className="flex flex-col">
                                                <TeamSlot team={null} players={[]} direction={direction} isWinner={false} isLoser={false} />
                                                <TeamSlot team={null} players={[]} direction={direction} isWinner={false} isLoser={false} isBotSlot />
                                            </div>
                                        )
                                    }

                                    const { topTeam, botTeam, matchup, topPlayers, botPlayers } = item
                                    const isFinal = matchup?.result === 'final'
                                    let topWon = false, botWon = false

                                    if (isFinal && topTeam && botTeam) {
                                        const topIsFav = matchup.favorite_id === topTeam.id
                                        if (topIsFav) {
                                            topWon = matchup.favorite_score > matchup.underdog_score
                                            botWon = matchup.underdog_score > matchup.favorite_score
                                        } else {
                                            topWon = matchup.underdog_score > matchup.favorite_score
                                            botWon = matchup.favorite_score > matchup.underdog_score
                                        }
                                    }

                                    const topScore = (isFinal && topTeam)
                                        ? (matchup.favorite_id === topTeam.id ? matchup.favorite_score : matchup.underdog_score)
                                        : null
                                    const botScore = (isFinal && botTeam)
                                        ? (matchup.favorite_id === botTeam.id ? matchup.favorite_score : matchup.underdog_score)
                                        : null

                                    return (
                                        <div key={matchIdx} className="flex flex-col relative w-full border-r border-transparent">
                                            <TeamSlot
                                                team={topTeam}
                                                players={topPlayers}
                                                direction={direction}
                                                isWinner={topWon}
                                                isLoser={isFinal && !topWon}
                                                score={topScore}
                                            />
                                            {matchup && matchup.result === 'pending' && (
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100 text-[10px] text-yellow-800 px-2 py-0.5 border border-yellow-300 rounded shadow-sm z-10 whitespace-nowrap">
                                                    {matchup.favorite_id === topTeam?.id ? topTeam.name : (botTeam ? botTeam.name : 'TBD')}: -{matchup.spread}
                                                </div>
                                            )}
                                            <TeamSlot
                                                team={botTeam}
                                                players={botPlayers}
                                                direction={direction}
                                                isWinner={botWon}
                                                isLoser={isFinal && !botWon}
                                                score={botScore}
                                                isBotSlot
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* A single team slot in the bracket */
function TeamSlot({ team, players, direction, isWinner, isLoser, score, isBotSlot }) {
    if (!team) {
        return (
            <div
                className={`border border-gray-200 px-2 py-1 text-xs bg-gray-50 ${isBotSlot ? 'border-t-0' : ''
                    }`}
                style={{ height: '36px' }}
            >
                <span className="text-gray-300">—</span>
            </div>
        )
    }

    const activePlayers = players.filter(p => p.status === 'active')
    const eliminatedPlayers = players.filter(p => p.status === 'eliminated')
    const hasActive = activePlayers.length > 0

    let bgClass = 'bg-white'
    if (isWinner && hasActive) bgClass = 'bg-green-50'
    else if (isWinner) bgClass = 'bg-blue-50'
    else if (isLoser) bgClass = 'bg-gray-50'

    let borderAccent = ''
    if (hasActive) borderAccent = direction === 'ltr' ? 'border-l-2 border-l-green-500' : 'border-r-2 border-r-green-500'
    else if (eliminatedPlayers.length > 0) borderAccent = direction === 'ltr' ? 'border-l-2 border-l-red-400' : 'border-r-2 border-r-red-400'

    const playerNames = [
        ...activePlayers.map(p => ({ name: p.name, active: true })),
        ...eliminatedPlayers.map(p => ({ name: p.name, active: false })),
    ]

    return (
        <div
            className={`border border-gray-200 ${bgClass} ${borderAccent} ${isBotSlot ? 'border-t-0' : ''
                } flex items-center justify-between px-1.5`}
            style={{ height: '36px' }}
            title={playerNames.map(p => `${p.name} (${p.active ? 'active' : 'out'})`).join(', ')}
        >
            {direction === 'ltr' ? (
                <>
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 w-4 text-right flex-shrink-0">{team.seed}</span>
                        <span className={`text-xs font-medium truncate ${isLoser ? 'text-gray-400 line-through' : ''}`}>
                            {team.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                        {playerNames.length > 0 && (
                            <span className={`text-[9px] truncate max-w-[60px] ${playerNames[0].active ? 'text-green-700 font-medium' : 'text-red-400 line-through'
                                }`}>
                                {playerNames[0].name}
                            </span>
                        )}
                        {score !== null && (
                            <span className={`text-xs font-bold ml-1 ${isWinner ? 'text-green-700' : 'text-gray-400'}`}>{score}</span>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-1 flex-shrink-0 mr-1">
                        {score !== null && (
                            <span className={`text-xs font-bold mr-1 ${isWinner ? 'text-green-700' : 'text-gray-400'}`}>{score}</span>
                        )}
                        {playerNames.length > 0 && (
                            <span className={`text-[9px] truncate max-w-[60px] ${playerNames[0].active ? 'text-green-700 font-medium' : 'text-red-400 line-through'
                                }`}>
                                {playerNames[0].name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                        <span className={`text-xs font-medium truncate ${isLoser ? 'text-gray-400 line-through' : ''}`}>
                            {team.name}
                        </span>
                        <span className="text-[10px] text-gray-400 w-4 flex-shrink-0">{team.seed}</span>
                    </div>
                </>
            )}
        </div>
    )
}
