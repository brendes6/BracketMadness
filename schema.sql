-- Cover the Spread — March Madness Bracket Manager
-- SQLite Schema

CREATE TABLE IF NOT EXISTS leagues (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    size        INTEGER NOT NULL CHECK (size IN (4, 8, 16, 32, 64)),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teams (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    name    TEXT    NOT NULL,
    seed    INTEGER NOT NULL,
    region  TEXT    NOT NULL,
    status  TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated'))
);

CREATE TABLE IF NOT EXISTS players (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id       INTEGER NOT NULL REFERENCES leagues(id),
    name            TEXT    NOT NULL,
    current_team_id INTEGER NOT NULL REFERENCES teams(id),
    initial_team_id INTEGER NOT NULL REFERENCES teams(id),
    status          TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated'))
);

CREATE TABLE IF NOT EXISTS matchups (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    league_id        INTEGER NOT NULL REFERENCES leagues(id),
    round            INTEGER NOT NULL,
    favorite_id      INTEGER NOT NULL REFERENCES teams(id),
    underdog_id      INTEGER NOT NULL REFERENCES teams(id),
    spread           REAL    NOT NULL,
    favorite_score   INTEGER,
    underdog_score   INTEGER,
    result           TEXT    NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'final')),
    ncaa_contest_id  INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_league   ON players(league_id);
CREATE INDEX IF NOT EXISTS idx_matchups_league   ON matchups(league_id);
CREATE INDEX IF NOT EXISTS idx_players_team      ON players(current_team_id);
CREATE INDEX IF NOT EXISTS idx_matchups_contest  ON matchups(ncaa_contest_id);
