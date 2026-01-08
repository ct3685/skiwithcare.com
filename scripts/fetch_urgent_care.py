#!/usr/bin/env python3
"""
Fetch urgent care facilities from OpenStreetMap Overpass API.
Queries for urgent care centers in states with ski resorts.
"""

import json
import time
import os
from pathlib import Path

import requests

# States with ski resorts (from our resorts.json)
SKI_STATES = [
    "AK", "AZ", "CA", "CO", "CT", "ID", "IL", "IN", "IA", "KS", "KY",
    "ME", "MD", "MA", "MI", "MN", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SD", "TN",
    "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

# Priority states (major ski destinations) - query first
PRIORITY_STATES = ["CO", "UT", "CA", "VT", "MT", "WY", "ID", "NM", "NH", "ME", "WA", "OR", "NY"]

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# State bounding boxes (rough approximations)
STATE_BOUNDS = {
    "AK": (51.0, -180.0, 71.5, -130.0),
    "AZ": (31.3, -114.8, 37.0, -109.0),
    "CA": (32.5, -124.5, 42.0, -114.1),
    "CO": (37.0, -109.1, 41.0, -102.0),
    "CT": (40.9, -73.7, 42.1, -71.8),
    "ID": (42.0, -117.2, 49.0, -111.0),
    "IL": (36.9, -91.5, 42.5, -87.0),
    "IN": (37.8, -88.1, 41.8, -84.8),
    "IA": (40.4, -96.6, 43.5, -90.1),
    "KS": (37.0, -102.1, 40.0, -94.6),
    "KY": (36.5, -89.6, 39.1, -82.0),
    "ME": (43.0, -71.1, 47.5, -66.9),
    "MD": (37.9, -79.5, 39.7, -75.0),
    "MA": (41.2, -73.5, 42.9, -69.9),
    "MI": (41.7, -90.4, 48.3, -82.4),
    "MN": (43.5, -97.2, 49.4, -89.5),
    "MO": (36.0, -95.8, 40.6, -89.1),
    "MT": (44.4, -116.1, 49.0, -104.0),
    "NE": (40.0, -104.1, 43.0, -95.3),
    "NV": (35.0, -120.0, 42.0, -114.0),
    "NH": (42.7, -72.6, 45.3, -70.6),
    "NJ": (38.9, -75.6, 41.4, -73.9),
    "NM": (31.3, -109.1, 37.0, -103.0),
    "NY": (40.5, -79.8, 45.0, -71.9),
    "NC": (33.8, -84.3, 36.6, -75.5),
    "ND": (45.9, -104.0, 49.0, -96.6),
    "OH": (38.4, -84.8, 42.0, -80.5),
    "OK": (33.6, -103.0, 37.0, -94.4),
    "OR": (42.0, -124.6, 46.3, -116.5),
    "PA": (39.7, -80.5, 42.3, -74.7),
    "RI": (41.1, -71.9, 42.0, -71.1),
    "SD": (42.5, -104.1, 45.9, -96.4),
    "TN": (35.0, -90.3, 36.7, -81.6),
    "UT": (37.0, -114.1, 42.0, -109.0),
    "VT": (42.7, -73.4, 45.0, -71.5),
    "VA": (36.5, -83.7, 39.5, -75.2),
    "WA": (45.5, -124.8, 49.0, -116.9),
    "WV": (37.2, -82.6, 40.6, -77.7),
    "WI": (42.5, -92.9, 47.1, -86.8),
    "WY": (41.0, -111.1, 45.0, -104.1),
}


def query_urgent_care_for_state(state: str) -> list:
    """Query Overpass API for urgent care facilities in a state."""
    
    if state not in STATE_BOUNDS:
        print(f"  ⚠️  No bounds for {state}, skipping")
        return []
    
    south, west, north, east = STATE_BOUNDS[state]
    
    # Query for various urgent care tagging schemes in OSM
    query = f"""
    [out:json][timeout:60];
    (
      // Urgent care specific tags
      node["healthcare"="urgent_care"]({south},{west},{north},{east});
      way["healthcare"="urgent_care"]({south},{west},{north},{east});
      node["amenity"="clinic"]["healthcare:speciality"~"urgent|emergency"]({south},{west},{north},{east});
      way["amenity"="clinic"]["healthcare:speciality"~"urgent|emergency"]({south},{west},{north},{east});
      // Walk-in clinics
      node["amenity"="clinic"]["name"~"Urgent|Walk-In|Walk In|CareNow|MedExpress|FastMed|GoHealth|Concentra",i]({south},{west},{north},{east});
      way["amenity"="clinic"]["name"~"Urgent|Walk-In|Walk In|CareNow|MedExpress|FastMed|GoHealth|Concentra",i]({south},{west},{north},{east});
    );
    out center;
    """
    
    try:
        response = requests.post(OVERPASS_URL, data={"data": query}, timeout=90)
        
        if response.status_code == 429:
            print(f"  ⏳ Rate limited, waiting 30s...")
            time.sleep(30)
            return query_urgent_care_for_state(state)
        
        if response.status_code != 200:
            print(f"  ❌ HTTP {response.status_code} for {state}")
            return []
        
        data = response.json()
        return data.get("elements", [])
        
    except requests.exceptions.Timeout:
        print(f"  ⏰ Timeout for {state}")
        return []
    except Exception as e:
        print(f"  ❌ Error for {state}: {e}")
        return []


def extract_facility_data(element: dict, state: str) -> dict | None:
    """Extract facility data from an OSM element."""
    
    tags = element.get("tags", {})
    name = tags.get("name")
    
    if not name:
        return None
    
    # Get coordinates (center for ways/relations)
    lat = element.get("lat") or element.get("center", {}).get("lat")
    lon = element.get("lon") or element.get("center", {}).get("lon")
    
    if not lat or not lon:
        return None
    
    # Build address
    addr_parts = []
    if tags.get("addr:housenumber"):
        addr_parts.append(tags["addr:housenumber"])
    if tags.get("addr:street"):
        addr_parts.append(tags["addr:street"])
    address = " ".join(addr_parts) if addr_parts else ""
    
    facility = {
        "id": f"osm-{element['id']}",
        "name": name,
        "type": "urgent_care",
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "address": address,
        "city": tags.get("addr:city", ""),
        "state": state,
        "zip": tags.get("addr:postcode", ""),
        "phone": tags.get("phone", tags.get("contact:phone", "")),
        "website": tags.get("website", tags.get("contact:website", "")),
        "sourceUrl": f"https://www.openstreetmap.org/{element['type']}/{element['id']}",
        "lastVerified": "2026-01-06",
    }
    
    # Check for 24-hour operation
    opening_hours = tags.get("opening_hours", "")
    if "24/7" in opening_hours:
        facility["is24Hour"] = True
    
    return facility


def load_resorts() -> list:
    """Load resorts for distance calculation."""
    resorts_path = Path(__file__).parent.parent / "public" / "resorts.json"
    with open(resorts_path) as f:
        return json.load(f)


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in miles."""
    import math
    R = 3959  # Earth's radius in miles
    
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def find_nearest_resort(facility: dict, resorts: list) -> tuple[str, float]:
    """Find the nearest resort to a facility."""
    min_dist = float('inf')
    nearest = None
    
    for resort in resorts:
        dist = haversine(facility["lat"], facility["lon"], resort["lat"], resort["lon"])
        if dist < min_dist:
            min_dist = dist
            nearest = resort["name"]
    
    return nearest, round(min_dist, 1)


def main():
    print("🏥 Fetching Urgent Care Facilities from OpenStreetMap")
    print("=" * 60)
    
    all_facilities = []
    cache_path = Path(__file__).parent.parent / "urgent_care_cache.json"
    
    # Load cache if exists
    cached_states = set()
    if cache_path.exists():
        with open(cache_path) as f:
            cached = json.load(f)
            all_facilities = cached.get("facilities", [])
            cached_states = set(cached.get("states", []))
            print(f"📦 Loaded {len(all_facilities)} cached facilities from {len(cached_states)} states")
    
    # Process states (priority first)
    states_to_process = PRIORITY_STATES + [s for s in SKI_STATES if s not in PRIORITY_STATES]
    
    for state in states_to_process:
        if state in cached_states:
            print(f"⏭️  {state}: Already cached")
            continue
            
        print(f"🔍 Querying {state}...")
        elements = query_urgent_care_for_state(state)
        
        state_facilities = []
        for element in elements:
            facility = extract_facility_data(element, state)
            if facility:
                state_facilities.append(facility)
        
        print(f"   Found {len(state_facilities)} urgent care facilities")
        all_facilities.extend(state_facilities)
        cached_states.add(state)
        
        # Save cache after each state
        with open(cache_path, "w") as f:
            json.dump({
                "facilities": all_facilities,
                "states": list(cached_states)
            }, f, indent=2)
        
        # Rate limit
        time.sleep(2)
    
    print(f"\n📊 Total: {len(all_facilities)} urgent care facilities")
    
    # Load resorts and calculate distances
    print("\n🏔️  Calculating nearest resort distances...")
    resorts = load_resorts()
    
    for facility in all_facilities:
        nearest, dist = find_nearest_resort(facility, resorts)
        facility["nearestResort"] = nearest
        facility["nearestResortDist"] = dist
    
    # Filter to facilities within 100 miles of a resort
    nearby_facilities = [f for f in all_facilities if f.get("nearestResortDist", 999) <= 100]
    print(f"📍 {len(nearby_facilities)} facilities within 100 miles of a ski resort")
    
    # Sort by distance to nearest resort
    nearby_facilities.sort(key=lambda f: f.get("nearestResortDist", 999))
    
    # Save output
    output_path = Path(__file__).parent.parent / "public" / "urgent_care.json"
    with open(output_path, "w") as f:
        json.dump(nearby_facilities, f, indent=2)
    
    print(f"\n✅ Saved to {output_path}")
    
    # Summary by state
    print("\n📊 By State:")
    state_counts = {}
    for f in nearby_facilities:
        state = f["state"]
        state_counts[state] = state_counts.get(state, 0) + 1
    
    for state, count in sorted(state_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"   {state}: {count}")


if __name__ == "__main__":
    main()
