import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time

def scrape_forex_factory():
    url = "https://www.forexfactory.com/calendar"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Error fetching data: {response.status_code}")
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        calendar_table = soup.find("table", class_="calendar__table")
        
        if not calendar_table:
            print("Could not find calendar table")
            return []

        events = []
        rows = calendar_table.find_all("tr", class_="calendar__row")
        
        current_date_str = ""
        
        # Note: Forex Factory uses complex date structures. This is a simplified logic.
        # In a real production app, we would handle timezones and year wraps carefully.
        
        for row in rows:
            # Check for date
            date_cell = row.find("td", class_="calendar__date")
            if date_cell and date_cell.text.strip():
                current_date_str = date_cell.text.strip()

            currency = row.find("td", class_="calendar__currency").text.strip()
            # We only care about USD for the requested assets
            if currency != "USD":
                continue

            impact_cell = row.find("td", class_="calendar__impact")
            impact_span = impact_cell.find("span") if impact_cell else None
            impact = "Low"
            if impact_span:
                if "high" in impact_span.get("class", []): impact = "High"
                elif "medium" in impact_span.get("class", []): impact = "Medium"
            
            # Filter for High Impact as requested
            if impact != "High":
                continue

            event_name = row.find("td", class_="calendar__event").text.strip()
            time_str = row.find("td", class_="calendar__time").text.strip()
            
            actual = row.find("td", class_="calendar__actual").text.strip()
            forecast = row.find("td", class_="calendar__forecast").text.strip()
            previous = row.find("td", class_="calendar__previous").text.strip()

            # Determine category based on common news
            category = "Forex"
            lower_event = event_name.lower()
            if "nfp" in lower_event or "employment" in lower_event or "cpi" in lower_event or "fed" in lower_event or "fomc" in lower_event:
                category = "Nasdaq/US30/XAUUSD"

            events.append({
                "title": event_name,
                "currency": currency,
                "impact": impact,
                "date_time": f"{current_date_str} {time_str}",
                "actual": actual,
                "forecast": forecast,
                "previous": previous,
                "source": "ForexFactory",
                "category": category
            })
            
        return events

    except Exception as e:
        print(f"Scraping error: {e}")
        return []

if __name__ == "__main__":
    data = scrape_forex_factory()
    for d in data:
        print(d)
