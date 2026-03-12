-- Seed Data: 64 NCAA Tournament Teams (placeholder names) + 1 sample league

-- East Region (seeds 1-16)
INSERT INTO teams (name, seed, region) VALUES ('East 1 Seed', 1, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 2 Seed', 2, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 3 Seed', 3, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 4 Seed', 4, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 5 Seed', 5, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 6 Seed', 6, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 7 Seed', 7, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 8 Seed', 8, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 9 Seed', 9, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 10 Seed', 10, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 11 Seed', 11, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 12 Seed', 12, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 13 Seed', 13, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 14 Seed', 14, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 15 Seed', 15, 'East');
INSERT INTO teams (name, seed, region) VALUES ('East 16 Seed', 16, 'East');

-- West Region (seeds 1-16)
INSERT INTO teams (name, seed, region) VALUES ('West 1 Seed', 1, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 2 Seed', 2, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 3 Seed', 3, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 4 Seed', 4, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 5 Seed', 5, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 6 Seed', 6, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 7 Seed', 7, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 8 Seed', 8, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 9 Seed', 9, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 10 Seed', 10, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 11 Seed', 11, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 12 Seed', 12, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 13 Seed', 13, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 14 Seed', 14, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 15 Seed', 15, 'West');
INSERT INTO teams (name, seed, region) VALUES ('West 16 Seed', 16, 'West');

-- South Region (seeds 1-16)
INSERT INTO teams (name, seed, region) VALUES ('South 1 Seed', 1, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 2 Seed', 2, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 3 Seed', 3, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 4 Seed', 4, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 5 Seed', 5, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 6 Seed', 6, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 7 Seed', 7, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 8 Seed', 8, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 9 Seed', 9, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 10 Seed', 10, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 11 Seed', 11, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 12 Seed', 12, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 13 Seed', 13, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 14 Seed', 14, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 15 Seed', 15, 'South');
INSERT INTO teams (name, seed, region) VALUES ('South 16 Seed', 16, 'South');

-- Midwest Region (seeds 1-16)
INSERT INTO teams (name, seed, region) VALUES ('Midwest 1 Seed', 1, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 2 Seed', 2, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 3 Seed', 3, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 4 Seed', 4, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 5 Seed', 5, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 6 Seed', 6, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 7 Seed', 7, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 8 Seed', 8, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 9 Seed', 9, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 10 Seed', 10, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 11 Seed', 11, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 12 Seed', 12, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 13 Seed', 13, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 14 Seed', 14, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 15 Seed', 15, 'Midwest');
INSERT INTO teams (name, seed, region) VALUES ('Midwest 16 Seed', 16, 'Midwest');

-- Sample League: "Dave's Pool" with 64 players
INSERT INTO leagues (name, size) VALUES ('Dave''s Pool', 64);

-- Assign each player to a team (player 1 → team 1, player 2 → team 2, etc.)
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 1', 1, 1);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 2', 2, 2);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 3', 3, 3);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 4', 4, 4);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 5', 5, 5);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 6', 6, 6);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 7', 7, 7);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 8', 8, 8);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 9', 9, 9);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 10', 10, 10);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 11', 11, 11);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 12', 12, 12);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 13', 13, 13);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 14', 14, 14);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 15', 15, 15);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 16', 16, 16);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 17', 17, 17);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 18', 18, 18);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 19', 19, 19);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 20', 20, 20);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 21', 21, 21);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 22', 22, 22);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 23', 23, 23);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 24', 24, 24);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 25', 25, 25);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 26', 26, 26);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 27', 27, 27);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 28', 28, 28);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 29', 29, 29);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 30', 30, 30);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 31', 31, 31);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 32', 32, 32);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 33', 33, 33);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 34', 34, 34);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 35', 35, 35);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 36', 36, 36);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 37', 37, 37);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 38', 38, 38);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 39', 39, 39);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 40', 40, 40);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 41', 41, 41);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 42', 42, 42);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 43', 43, 43);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 44', 44, 44);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 45', 45, 45);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 46', 46, 46);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 47', 47, 47);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 48', 48, 48);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 49', 49, 49);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 50', 50, 50);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 51', 51, 51);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 52', 52, 52);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 53', 53, 53);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 54', 54, 54);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 55', 55, 55);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 56', 56, 56);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 57', 57, 57);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 58', 58, 58);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 59', 59, 59);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 60', 60, 60);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 61', 61, 61);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 62', 62, 62);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 63', 63, 63);
INSERT INTO players (league_id, name, current_team_id, initial_team_id) VALUES (1, 'Player 64', 64, 64);

-- Sample first-round matchups (East region, round 1)
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 1, 16, 22.5);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 2, 15, 15.5);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 3, 14, 12.0);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 4, 13, 9.5);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 5, 12, 5.5);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 6, 11, 3.5);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 7, 10, 2.0);
INSERT INTO matchups (league_id, round, favorite_id, underdog_id, spread) VALUES (1, 1, 8, 9, 1.0);
