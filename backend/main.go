package main

import (
	"database/sql"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/tursodatabase/libsql-client-go/libsql"
)

var db *sql.DB

// Player represents a player in the league dashboard response.
type Player struct {
	ID            int    `json:"id"`
	Name          string `json:"name"`
	CurrentTeamID int    `json:"current_team_id"`
	InitialTeamID int    `json:"initial_team_id"` // New field for historical tracking
	TeamName      string `json:"team_name"`
	TeamSeed      int    `json:"team_seed"`
	TeamRegion    string `json:"team_region"`
	Status        string `json:"status"`
}

// Team represents a tournament team.
type Team struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Seed   int    `json:"seed"`
	Region string `json:"region"`
}

// League holds basic league info.
type League struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Size int    `json:"size"`
}

// Matchup represents a single game matchup.
type Matchup struct {
	ID            int     `json:"id"`
	Round         int     `json:"round"`
	FavoriteID    int     `json:"favorite_id"`
	FavoriteName  string  `json:"favorite_name"`
	UnderdogID    int     `json:"underdog_id"`
	UnderdogName  string  `json:"underdog_name"`
	Spread        float64 `json:"spread"`
	FavoriteScore *int    `json:"favorite_score"`
	UnderdogScore *int    `json:"underdog_score"`
	Result        string  `json:"result"`
}

// CreateLeagueRequest is the JSON body for creating a new league.
type CreateLeagueRequest struct {
	Name          string   `json:"name" binding:"required"`
	Size          int      `json:"size" binding:"required"`
	Players       []string `json:"players" binding:"required"`
	Randomize     bool     `json:"randomize"`
	FirstRoundBye bool     `json:"first_round_bye"`
}

// AdminSpreadRequest is the JSON body for setting the spread (Morning workflow).
type AdminSpreadRequest struct {
	LeagueID   int     `json:"league_id" binding:"required"`
	FavoriteID int     `json:"favorite_id" binding:"required"`
	UnderdogID int     `json:"underdog_id" binding:"required"`
	Spread     float64 `json:"spread" binding:"required"`
}

// AdminScoreRequest is the JSON body for entering final score (Night workflow).
type AdminScoreRequest struct {
	LeagueID      int `json:"league_id" binding:"required"`
	FavoriteID    int `json:"favorite_id" binding:"required"`
	UnderdogID    int `json:"underdog_id" binding:"required"`
	FavoriteScore int `json:"favorite_score" binding:"required"`
	UnderdogScore int `json:"underdog_score" binding:"required"`
}

func main() {
	// DB path: check env, then fall back to ../bracket.db (dev layout)
	dbURL := os.Getenv("TURSO_DATABASE_URL")
	dbToken := os.Getenv("TURSO_AUTH_TOKEN")
	var connStr string

	if dbURL != "" && dbToken != "" {
		connStr = dbURL + "?authToken=" + dbToken
	} else if dbURL != "" {
		connStr = dbURL
	} else {
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = filepath.Join("..", "bracket.db")
		}
		connStr = "file:" + dbPath
	}

	var err error
	db, err = sql.Open("libsql", connStr)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	r := gin.Default()

	// CORS — allow all origins for Cloud Run + local dev
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Content-Type"},
		AllowCredentials: false,
	}))

	// API routes
	r.GET("/leagues", getLeagues)
	r.POST("/leagues", createLeague)
	r.GET("/teams", getTeams)
	r.GET("/league/:id", getLeague)
	r.GET("/matchups/:league_id", getMatchups)
	r.POST("/admin/spread", postAdminSpread)
	r.POST("/admin/score", postAdminScore)

	// Serve frontend static files (production build)
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = filepath.Join("..", "frontend", "dist")
	}
	if _, err := os.Stat(staticDir); err == nil {
		r.Static("/assets", filepath.Join(staticDir, "assets"))
		r.StaticFile("/favicon.ico", filepath.Join(staticDir, "favicon.ico"))
		// SPA fallback: serve index.html for non-API routes
		r.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(staticDir, "index.html"))
		})
		log.Printf("Serving frontend from %s", staticDir)
	} else {
		log.Printf("No frontend build at %s — API-only mode", staticDir)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on :%s", port)
	r.Run(":" + port)
}

func getLeagues(c *gin.Context) {
	rows, err := db.Query(`
		SELECT l.id, l.name, l.size,
		       COUNT(DISTINCT p.name) as total,
		       COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.name END) as active
		FROM leagues l
		LEFT JOIN players p ON p.league_id = l.id
		GROUP BY l.id
		ORDER BY l.id DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type LeagueSummary struct {
		ID            int    `json:"id"`
		Name          string `json:"name"`
		Size          int    `json:"size"`
		TotalPlayers  int    `json:"total_players"`
		ActivePlayers int    `json:"active_players"`
	}

	var leagues []LeagueSummary
	for rows.Next() {
		var l LeagueSummary
		if err := rows.Scan(&l.ID, &l.Name, &l.Size, &l.TotalPlayers, &l.ActivePlayers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		leagues = append(leagues, l)
	}

	c.JSON(http.StatusOK, gin.H{"leagues": leagues})
}

func createLeague(c *gin.Context) {
	var req CreateLeagueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validSizes := map[int]bool{4: true, 8: true, 16: true, 32: true, 64: true}
	if !validSizes[req.Size] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "size must be 4, 8, 16, 32, or 64"})
		return
	}

	if len(req.Players) != req.Size {
		c.JSON(http.StatusBadRequest, gin.H{"error": "number of players must match league size"})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	result, err := tx.Exec("INSERT INTO leagues (name, size) VALUES (?, ?)", req.Name, req.Size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	leagueID, _ := result.LastInsertId()

	rows, err := tx.Query("SELECT id FROM teams ORDER BY id LIMIT 64")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var allTeams []int
	for rows.Next() {
		var id int
		rows.Scan(&id)
		allTeams = append(allTeams, id)
	}

	if len(allTeams) < 64 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "database must have exactly 64 teams to generate a bracket"})
		return
	}

	// Group/Shuffle Logic for 64 teams
	var organizedTeams []int

	if req.FirstRoundBye && req.Size < 64 {
		// Group standard NCAA first round matchups (1v16, 2v15... 8v9) per region
		// Region chunks are 0-15, 16-31, 32-47, 48-63
		var pairedTeams []int
		for region := 0; region < 4; region++ {
			offset := region * 16
			for pairOffset := 0; pairOffset < 8; pairOffset++ {
				pairedTeams = append(pairedTeams, allTeams[offset+pairOffset])       // e.g. Seed 1
				pairedTeams = append(pairedTeams, allTeams[offset+15-pairOffset])    // e.g. Seed 16
			}
		}

		if req.Randomize {
			// Instead of shuffling individuals, shuffle chunks of size (64 / req.Size)
			chunkSize := 64 / req.Size
			chunks := make([][]int, req.Size)
			for i := 0; i < req.Size; i++ {
				chunks[i] = pairedTeams[i*chunkSize : (i+1)*chunkSize]
			}
			
			// Shuffle chunks
			for i := range chunks {
				j := i + int(rand.Int31n(int32(len(chunks)-i)))
				chunks[i], chunks[j] = chunks[j], chunks[i]
			}
			
			// Flatten
			for _, chunk := range chunks {
				organizedTeams = append(organizedTeams, chunk...)
			}
		} else {
			organizedTeams = pairedTeams
		}

	} else {
		// No byes (or size 64)
		organizedTeams = allTeams
		if req.Randomize {
			for i := range organizedTeams {
				j := i + int(rand.Int31n(int32(len(organizedTeams)-i)))
				organizedTeams[i], organizedTeams[j] = organizedTeams[j], organizedTeams[i]
			}
		}
	}

	// Assign the 64 teams to users evenly
	teamsPerPlayer := 64 / req.Size
	teamIdx := 0

	for _, playerName := range req.Players {
		for i := 0; i < teamsPerPlayer; i++ {
			teamID := organizedTeams[teamIdx]
			_, err := tx.Exec(
				"INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (?, ?, ?, ?)",
				leagueID, playerName, teamID, teamID,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			teamIdx++
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": leagueID, "name": req.Name, "size": req.Size})
}

func getLeague(c *gin.Context) {
	leagueID := c.Param("id")

	// Get league info
	var league League
	err := db.QueryRow("SELECT id, name, size FROM leagues WHERE id = ?", leagueID).
		Scan(&league.ID, &league.Name, &league.Size)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get players with their team info (including initial team for historical rendering)
	rows, err := db.Query(`
		SELECT p.id, p.name, p.current_team_id, p.initial_team_id, t.name, t.seed, t.region, p.status
		FROM players p
		JOIN teams t ON p.current_team_id = t.id
		WHERE p.league_id = ?
		ORDER BY t.region, t.seed`, leagueID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var players []Player
	for rows.Next() {
		var p Player
		if err := rows.Scan(&p.ID, &p.Name, &p.CurrentTeamID, &p.InitialTeamID, &p.TeamName, &p.TeamSeed, &p.TeamRegion, &p.Status); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		players = append(players, p)
	}

	c.JSON(http.StatusOK, gin.H{
		"league":  league,
		"players": players,
	})
}

func getMatchups(c *gin.Context) {
	leagueID := c.Param("league_id")

	rows, err := db.Query(`
		SELECT m.id, m.round, m.favorite_id, f.name, m.underdog_id, u.name, m.spread,
		       m.favorite_score, m.underdog_score, m.result
		FROM matchups m
		JOIN teams f ON m.favorite_id = f.id
		JOIN teams u ON m.underdog_id = u.id
		WHERE m.league_id = ?
		ORDER BY m.round, m.id`, leagueID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var matchups []Matchup
	for rows.Next() {
		var m Matchup
		if err := rows.Scan(&m.ID, &m.Round, &m.FavoriteID, &m.FavoriteName, &m.UnderdogID, &m.UnderdogName,
			&m.Spread, &m.FavoriteScore, &m.UnderdogScore, &m.Result); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		matchups = append(matchups, m)
	}

	c.JSON(http.StatusOK, gin.H{"matchups": matchups})
}

func getTeams(c *gin.Context) {
	rows, err := db.Query("SELECT id, name, seed, region FROM teams ORDER BY region, seed")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var teams []Team
	for rows.Next() {
		var t Team
		if err := rows.Scan(&t.ID, &t.Name, &t.Seed, &t.Region); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		teams = append(teams, t)
	}

	c.JSON(http.StatusOK, gin.H{"teams": teams})
}

// postAdminSpread locks in the pre-game spread (Morning Workflow).
func postAdminSpread(c *gin.Context) {
	var req AdminSpreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 1. Check if matchup already exists
	var matchupID int
	err := db.QueryRow(`
		SELECT id FROM matchups 
		WHERE league_id = ? AND favorite_id = ? AND underdog_id = ?`,
		req.LeagueID, req.FavoriteID, req.UnderdogID,
	).Scan(&matchupID)

	if err == sql.ErrNoRows {
		// Insert new pending matchup with the initial spread
		result, err := db.Exec(`
			INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread, result)
			VALUES (?, 0, ?, ?, ?, 'pending')`,
			req.LeagueID, req.FavoriteID, req.UnderdogID, req.Spread,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		mID, _ := result.LastInsertId()
		matchupID = int(mID)
	} else if err == nil {
		// Update spread on existing pending matchup
		_, err := db.Exec(`
			UPDATE matchups 
			SET spread = ?
			WHERE id = ?`,
			req.Spread, matchupID,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Locked spread: League %d | Fav(%d) vs Und(%d) | Spread: %.1f", req.LeagueID, req.FavoriteID, req.UnderdogID, req.Spread)
	c.JSON(http.StatusOK, gin.H{"message": "Spread locked in successfully", "matchup_id": matchupID})
}

// postAdminScore handles the final score and applies Cover the Spread rules (Night Workflow).
func postAdminScore(c *gin.Context) {
	var req AdminScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer tx.Rollback()

	// 1. Require the matchup to exist so we know the spread has been locked.
	var matchupID int
	var spread float64
	var result string
	err = tx.QueryRow(`
		SELECT id, spread, result FROM matchups 
		WHERE league_id = ? AND favorite_id = ? AND underdog_id = ?`,
		req.LeagueID, req.FavoriteID, req.UnderdogID,
	).Scan(&matchupID, &spread, &result)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Matchup does not exist. Please set the spread first."})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result == "final" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "This game is already recorded as final."})
		return
	}

	// 2. Update to final score
	_, err = tx.Exec(`
		UPDATE matchups 
		SET favorite_score = ?, underdog_score = ?, result = 'final'
		WHERE id = ?`,
		req.FavoriteScore, req.UnderdogScore, matchupID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3. Apply Cover the Spread logic
	margin := float64(req.FavoriteScore - req.UnderdogScore)
	covered := margin > spread

	log.Printf("Final Score | League %d | Fav(%d): %d — Und(%d): %d | Spread: %.1f | Margin: %.1f | Covered: %v",
		req.LeagueID, req.FavoriteID, req.FavoriteScore, req.UnderdogID, req.UnderdogScore, spread, margin, covered)

	if margin > 0 {
		if covered {
			log.Println(" → Favorite COVERS. Underdog players eliminated.")
			eliminatePlayers(tx, req.UnderdogID, req.LeagueID)
		} else {
			log.Println(" → Favorite WINS but NO COVER. Fav players eliminated. Und players move to Fav.")
			eliminatePlayers(tx, req.FavoriteID, req.LeagueID)
			movePlayers(tx, req.UnderdogID, req.FavoriteID, req.LeagueID)
		}
	} else {
		log.Println(" → UPSET. Favorite players eliminated.")
		eliminatePlayers(tx, req.FavoriteID, req.LeagueID)
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Final score saved and branch updated", "matchup_id": matchupID})
}

func eliminatePlayers(tx *sql.Tx, teamID int, leagueID int) {
	_, err := tx.Exec("UPDATE players SET status = 'eliminated' WHERE current_team_id = ? AND league_id = ? AND status = 'active'", teamID, leagueID)
	if err != nil {
		log.Printf("Error eliminating players on team %d: %v", teamID, err)
	}
}

func movePlayers(tx *sql.Tx, fromTeamID int, toTeamID int, leagueID int) {
	_, err := tx.Exec("UPDATE players SET current_team_id = ? WHERE current_team_id = ? AND league_id = ? AND status = 'active'", toTeamID, fromTeamID, leagueID)
	if err != nil {
		log.Printf("Error moving players from %d to %d: %v", fromTeamID, toTeamID, err)
	}
}
