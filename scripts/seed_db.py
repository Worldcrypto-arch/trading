import sqlite3
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('impactnews.db')
cursor = conn.cursor()

# Create table if not exists (usually handled by SQLAlchemy, but just in case)
cursor.execute('''
CREATE TABLE IF NOT EXISTS news_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    currency TEXT,
    impact TEXT,
    date_time DATETIME,
    actual TEXT,
    forecast TEXT,
    previous TEXT,
    source TEXT,
    category TEXT,
    sentiment TEXT,
    analysis TEXT
)
''')

# Sample high impact data
sample_events = [
    ('Core CPI m/m', 'USD', 'High', datetime.now().isoformat(), None, '0.3%', '0.4%', 'ForexFactory', 'Nasdaq/US30/XAUUSD', 'Neutral', 'Volatilidad extrema esperada en la apertura de NY.'),
    ('Unemployment Claims', 'USD', 'High', datetime.now().isoformat(), '215K', '220K', '212K', 'ForexFactory', 'Forex', 'Positive', 'Dato mejor de lo esperado. Probable presión alcista en USD.'),
    ('FOMC Meeting Minutes', 'USD', 'High', datetime.now().isoformat(), None, None, None, 'Investing', 'Nasdaq/US30/XAUUSD', 'Volatile', 'El mercado está descontando una postura hawkish. Cuidado con el Nasdaq.')
]

cursor.executemany('''
INSERT INTO news_events (title, currency, impact, date_time, actual, forecast, previous, source, category, sentiment, analysis)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', sample_events)

conn.commit()
conn.close()
print("Base de datos inicializada con datos PRO.")
