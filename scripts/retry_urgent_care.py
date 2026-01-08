#!/usr/bin/env python3
"""
Retry fetching urgent care for states that timed out or returned 0 results.
Uses smaller area queries and longer timeouts.
"""

import json
import time
import math
from pathlib import Path
import requests

# States missing from current data (major ski states)
MISSING_STATES = [
    "CA", "UT", "MT", "ID", "NM", "NH", "ME", "WI", "OH", "NC", 
    "WV", "MA", "NJ", "CT", "MD", "VA", "KY", "TN", "NE", "SD",
    "KS", "OK", "IN"
]

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# State bounding boxes
STATE_BOUNDS = {
    "CA": (32.5, -124.5, 42.0, -114.1),
    "CT": (40.9, -73.7, 42.1, -71.8),
    "ID": (42.0, -117.2, 49.0, -111.0),
    "IN": (37.8, -88.1, 41.8, -84.8),
    "KS": (37.0, -102.1, 40.0, -94.6),
    "KY": (36.5, -89.6, 39.1, -82.0),
    "ME": (43.0, -71.1, 47.5, -66.9),
    "MD": (37.9, -79.5, 39.7, -75.0),
    "MA": (41.2, -73.5, 42.9, -69.9),
    "MT": (44.4, -116.1, 49.0, -104.0),
    "NE": (40.0, -104.1, 43.0, -95.3),
    "NH": (42.7, -72.6, 45.3, -70.6),
    "NJ": (38.9, -75.6, 41.4, -73.9),
    "NM": (31.3, -109.1, 37.0, -103.0),
    "NC": (33.8, -84.3, 36.6, -75.5),
    "OH": (38.4, -84.8, 42.0, -80.5),
    "OK": (33.6, -103.0, 37.0, -94.4),
    "SD": (42.5, -104.1, 45.9, -96.4),
    "TN": (35.0, -90.3, 36.7, -81.6),
    "UT": (37.0, -114.1, 42.0, -109.0),
    "VA": (36.5, -83.7, 39.5, -75.2),
    "WV": (37.2, -82.6, 40.6, -77.7),
    "WI": (42.5, -92.9, 47.1, -86.8),
}


def split_bounds(bounds: tuple, divisions: int = 2) -> list:
    """Split a bounding box into smaller quadrants."""
    south, west, north, east = bounds
    lat_step = (north - south) / divisions
    lon_step = (east - west) / divisions
    
    quadrants = []
    for i in range(divisions):
        for j in range(divisions):
            q_south = south + i * lat_step
            q_north = south + (i + 1) * lat_step
            q_west = west + j * lon_step
            q_east = west + (j + 1) * lon_step
            quadrants.append((q_south, q_west, q_north, q_east))
    
    return quadrants


def query_urgent_care(bounds: tuple, timeout: int = 120) -> list:
    """Query Overpass API for urgent care facilities in bounds."""
    south, west, north, east = bounds
    
    query = f"""
    [out:json][timeout:{timeout}];
    (
      node["healthcare"="urgent_care"]({south},{west},{north},{east});
      way["healthcare"="urgent_care"]({south},{west},{north},{east});
      node["amenity"="clinic"]["name"~"Urgent|Walk-In|Walk In|CareNow|MedExpress|FastMed|GoHealth|Concentra|MinuteClinic|CVS MinuteClinic",i]({south},{west},{north},{east});
      way["amenity"="clinic"]["name"~"Urgent|Walk-In|Walk In|CareNow|MedExpress|FastMed|GoHealth|Concentra|MinuteClinic|CVS MinuteClinic",i]({south},{west},{north},{east});
    );
    out center;
    """
    
    try:
        response = requests.post(OVERPASS_URL, data={"data": query}, timeout=timeout + 30)
        
        if response.status_code == 429:
            print(f"    ⏳ Rate limited, waiting 60s...")
            time.sleep(60)
            return query_urgent_care(bounds, timeout)
        
        if response.status_code != 200:
            print(f"    ❌ HTTP {response.status_code}")
            return []
        
        data = response.json()
        return data.get("elements", [])
        
    except requests.exceptions.Timeout:
        print(f"    ⏰ Timeout")
        return []
    except Exception as e:
        print(f"    ❌ Error: {e}")
        return []


def extract_facility(element: dict, state: str) -> dict | None:
    """Extract facility data from OSM element."""
    tags = element.get("tags", {})
    name = tags.get("name")
    
    if not name:
        return None
    
    lat = element.get("lat") or element.get("center", {}).get("lat")
    lon = element.get("lon") or element.get("center", {}).get("lon")
    
    if not lat or not lon:
        return None
    
    addr_parts = []
    if tags.get("addr:housenumber"):
        addr_parts.append(tags["addr:housenumber"])
    if tags.get("addr:street"):
        addr_parts.append(tags["addr:street"])
    
    return {
        "id": f"osm-{element['id']}",
        "name": name,
        "type": "urgent_care",
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "address": " ".join(addr_parts) if addr_parts else "",
        "city": tags.get("addr:city", ""),
        "state": state,
        "zip": tags.get("addr:postcode", ""),
        "phone": tags.get("phone", tags.get("contact:phone", "")),
        "website": tags.get("website", tags.get("contact:website", "")),
        "sourceUrl": f"https://www.openstreetmap.org/{element['type']}/{element['id']}",
        "lastVerified": "2026-01-08",
    }


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in miles."""
    R = 3959
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def main():
    print("🏥 Retrying Urgent Care Fetch for Missing States")
    print("=" * 60)
    
    # Load existing data
    output_path = Path(__file__).parent.parent / "public" / "urgent_care.json"
    existing = []
    existing_ids = set()
    
    if output_path.exists():
        with open(output_path) as f:
            existing = json.load(f)
            existing_ids = {f["id"] for f in existing}
        print(f"📦 Loaded {len(existing)} existing facilities")
    
    # Load resorts for distance calc
    resorts_path = Path(__file__).parent.parent / "public" / "resorts.json"
    with open(resorts_path) as f:
        resorts = json.load(f)
    
    new_facilities = []
    
    for state in MISSING_STATES:
        if state not in STATE_BOUNDS:
            print(f"⚠️  No bounds for {state}, skipping")
            continue
        
        print(f"\n🔍 {state}:")
        bounds = STATE_BOUNDS[state]
        
        # Try full state first
        print(f"   Trying full state query...")
        elements = query_urgent_care(bounds)
        
        # If timeout/empty, split into quadrants
        if not elements:
            print(f"   Splitting into quadrants...")
            quadrants = split_bounds(bounds, 2)
            elements = []
            for i, quad in enumerate(quadrants):
                print(f"   Quadrant {i+1}/4...")
                q_elements = query_urgent_care(quad)
                elements.extend(q_elements)
                time.sleep(2)
        
        # Extract facilities
        state_facilities = []
        for el in elements:
            facility = extract_facility(el, state)
            if facility and facility["id"] not in existing_ids:
                # Find nearest resort
                min_dist = float('inf')
                nearest = None
                for resort in resorts:
                    dist = haversine(facility["lat"], facility["lon"], resort["lat"], resort["lon"])
                    if dist < min_dist:
                        min_dist = dist
                        nearest = resort["name"]
                
                facility["nearestResort"] = nearest
                facility["nearestResortDist"] = round(min_dist, 1)
                
                # Only keep if within 100 miles of a resort
                if min_dist <= 100:
                    state_facilities.append(facility)
                    existing_ids.add(facility["id"])
        
        print(f"   ✅ Found {len(state_facilities)} new facilities near ski resorts")
        new_facilities.extend(state_facilities)
        
        time.sleep(3)  # Rate limit between states
    
    # Merge and save
    all_facilities = existing + new_facilities
    all_facilities.sort(key=lambda f: f.get("nearestResortDist", 999))
    
    with open(output_path, "w") as f:
        json.dump(all_facilities, f, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"✅ Total: {len(all_facilities)} facilities ({len(new_facilities)} new)")
    
    # Summary
    states = {}
    for f in all_facilities:
        states[f["state"]] = states.get(f["state"], 0) + 1
    
    print("\n📊 By State:")
    for state, count in sorted(states.items(), key=lambda x: -x[1]):
        print(f"   {state}: {count}")


if __name__ == "__main__":
    main()
