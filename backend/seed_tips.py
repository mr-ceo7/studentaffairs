import sqlite3
import os
from datetime import datetime

db_path = os.path.join(os.path.dirname(__file__), 'winvirahisi.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Clear existing tips
cursor.execute("DELETE FROM tips")

# Mock tips data
tips = [
    # --- FREE TIPS ---
    # Pending/Active
    (101, "Real Madrid", "Barcelona", "La Liga", "2026-06-11 20:00:00", "Real Madrid Win", "1.95", "Bet365", "[]", 4, "Real Madrid is in great home form.", "free", 0, "pending"),
    (104, "Liverpool", "Chelsea", "Premier League", "2026-06-12 16:00:00", "Liverpool Win", "1.80", "1xBet", "[]", 3, "Liverpool has a strong record against Chelsea at Anfield.", "free", 0, "pending"),
    # Settled
    (102, "Man City", "Arsenal", "Premier League", "2026-06-10 18:30:00", "Over 2.5 Goals", "1.70", "Bet365", "[]", 4, "High scoring history between these two sides.", "free", 0, "won"),
    (103, "Juventus", "AC Milan", "Serie A", "2026-06-10 19:45:00", "AC Milan Win", "2.10", "Betway", "[]", 3, "Milan's counter-attacking setup matches Juventus well.", "free", 0, "lost"),

    # --- GG PREMIUM TIPS ---
    # Pending/Active
    (201, "Bayern Munich", "Dortmund", "Bundesliga", "2026-06-11 15:30:00", "Both Teams to Score", "1.65", "Bet365", "[]", 5, "Der Klassiker always features goals at both ends.", "gg", 1, "pending"),
    (204, "Ajax", "Feyenoord", "Eredivisie", "2026-06-12 14:30:00", "Both Teams to Score", "1.72", "Betway", "[]", 4, "De Klassieker match usually promises defensive gaps on both sides.", "gg", 1, "pending"),
    # Settled
    (202, "PSG", "Marseille", "Ligue 1", "2026-06-10 21:00:00", "Both Teams to Score", "1.85", "Bet365", "[]", 4, "Le Classique has seen GG in 80% of recent matchups.", "gg", 1, "won"),
    (203, "Porto", "Benfica", "Primeira Liga", "2026-06-10 20:15:00", "Both Teams to Score - No", "2.05", "1xBet", "[]", 3, "Tense match with both teams playing defensively.", "gg", 1, "lost"),

    # --- OVER 2.5 PREMIUM TIPS ---
    # Pending/Active
    (301, "Inter Milan", "Napoli", "Serie A", "2026-06-11 21:45:00", "Over 2.5 Goals", "1.90", "Bet365", "[]", 4, "Napoli's aggressive away style will open up the game.", "over25", 1, "pending"),
    (304, "Boca Juniors", "River Plate", "Liga Profesional", "2026-06-12 23:00:00", "Over 2.5 Goals", "2.25", "Betway", "[]", 3, "Superclasico with high intensity and attacking options.", "over25", 1, "pending"),
    # Settled
    (302, "Atletico Madrid", "Sevilla", "La Liga", "2026-06-10 22:00:00", "Over 2.5 Goals", "2.15", "1xBet", "[]", 4, "Sevilla's defense has been leaky on the road.", "over25", 1, "won"),
    (303, "Celtic", "Rangers", "Scottish Premiership", "2026-06-10 13:00:00", "Over 2.5 Goals", "1.80", "Bet365", "[]", 5, "Old Firm derby with high attacking intensity.", "over25", 1, "lost"),
]

for tip in tips:
    cursor.execute("""
        INSERT INTO tips (
            fixture_id, home_team, away_team, league, match_date,
            prediction, odds, bookmaker, bookmaker_odds, confidence,
            reasoning, category, is_premium, result, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    """, tip)

conn.commit()
conn.close()

print("Successfully seeded database with active & settled tips!")
