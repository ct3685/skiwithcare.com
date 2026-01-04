#!/usr/bin/env python3
"""
Epic Pass US Resorts + DaVita Dialysis Clinics Data Generator
=============================================================

This script:
1. Geocodes all Epic Pass US ski resorts via OpenStreetMap Nominatim
2. Fetches all dialysis facilities from CMS Provider Data Catalog
3. Filters to DaVita-affiliated clinics
4. Geocodes DaVita facilities via US Census Geocoder (with caching)
5. Outputs clean JSON files for the web dashboard

No API keys required - uses only public data sources:
- OpenStreetMap Nominatim (for resort geocoding)
- CMS Provider Data Catalog (dialysis facility data)
- US Census Bureau Geocoder (for facility geocoding)

Usage:
    python epic_davita.py

Output:
    resorts.json - All Epic Pass US resorts (name, state, lat, lon)
    clinics.json - All DaVita clinics within 200mi of any resort
    davita_geocoded_cache.json - Cached geocoded facilities for faster reruns
"""

import json
import math
import os
import time
from typing import Optional, Tuple, List, Dict
from io import StringIO

import requests
import pandas as pd

# === CONFIGURATION ===

# CMS Dialysis Facility Dataset
CMS_METADATA_URL = "https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/23ew-n7w9"
CMS_CSV_FALLBACK = "https://data.cms.gov/provider-data/sites/default/files/resources/c04d84bc5c641284494bee4f20f17f9c_1759341903/DFC_FACILITY.csv"

# Output files
OUTPUT_DIR = "public"
RESORTS_JSON = f"{OUTPUT_DIR}/resorts.json"
CLINICS_JSON = f"{OUTPUT_DIR}/clinics.json"
GEOCODE_CACHE_FILE = "davita_geocoded_cache.json"
RESORT_CACHE_FILE = "resort_geocoded_cache.json"

# Distance threshold for clinic inclusion (miles)
MAX_CLINIC_DISTANCE = 200

# API Rate limiting (seconds)
NOMINATIM_DELAY = 1.1  # Nominatim requires ~1 request/second
CENSUS_DELAY = 0.3     # Census API is faster

# Epic Pass US Resorts (Owned/Operated + US Partner)
# Source: https://www.epicpass.com/
RESORTS = [
    # === ROCKIES ===
    ("Vail", "CO"),
    ("Beaver Creek", "CO"),
    ("Breckenridge", "CO"),
    ("Park City", "UT"),
    ("Keystone", "CO"),
    ("Crested Butte", "CO"),

    # === WEST ===
    ("Heavenly", "CA/NV"),
    ("Northstar", "CA"),
    ("Kirkwood", "CA"),
    ("Stevens Pass", "WA"),

    # === NORTHEAST ===
    ("Stowe", "VT"),
    ("Okemo", "VT"),
    ("Mount Snow", "VT"),
    ("Hunter", "NY"),
    ("Attitash", "NH"),
    ("Wildcat", "NH"),
    ("Mount Sunapee", "NH"),
    ("Crotched", "NH"),

    # === MID-ATLANTIC ===
    ("Liberty Mountain", "PA"),
    ("Roundtop", "PA"),
    ("Whitetail", "PA"),
    ("Jack Frost", "PA"),
    ("Big Boulder", "PA"),
    ("Seven Springs", "PA"),
    ("Hidden Valley Resort", "PA"),
    ("Laurel Mountain", "PA"),

    # === MIDWEST ===
    ("Wilmot Mountain", "WI"),
    ("Afton Alps", "MN"),
    ("Mt Brighton", "MI"),
    ("Alpine Valley", "OH"),
    ("Boston Mills", "OH"),
    ("Brandywine", "OH"),
    ("Mad River Mountain", "OH"),
    ("Hidden Valley", "MO"),
    ("Snow Creek", "MO"),
    ("Paoli Peaks", "IN"),

    # === US PARTNER RESORT ===
    ("Telluride Ski Resort", "CO"),
]


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in miles."""
    r = 3958.7613  # Earth's radius in miles
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def geocode_resort_nominatim(name: str, state: str) -> Tuple[Optional[float], Optional[float], str]:
    """Geocode a resort using OpenStreetMap Nominatim."""
    query = f"{name}, {state}, USA"
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "epic-davita-overlay/1.0 (personal research project)"}
    params = {"q": query, "format": "json", "limit": 1}
    
    try:
        resp = requests.get(url, params=params, headers=headers, timeout=60)
        resp.raise_for_status()
        results = resp.json()
        
        if not results:
            return None, None, query
        
        return float(results[0]["lat"]), float(results[0]["lon"]), query
        
    except requests.RequestException as e:
        print(f"  [ERROR] Geocoding failed for '{query}': {e}")
        return None, None, query


def geocode_facility_census(address: str, city: str, state: str, zipcode: str) -> Tuple[Optional[float], Optional[float]]:
    """Geocode a facility using US Census Bureau Geocoder."""
    # Build one-line address
    full_address = f"{address}, {city}, {state} {zipcode}"
    
    url = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress"
    params = {
        "address": full_address,
        "benchmark": "Public_AR_Current",
        "format": "json"
    }
    
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        matches = data.get("result", {}).get("addressMatches", [])
        if matches:
            coords = matches[0].get("coordinates", {})
            # Census returns x=lon, y=lat
            lon = coords.get("x")
            lat = coords.get("y")
            if lat and lon:
                return float(lat), float(lon)
        
        return None, None
        
    except requests.RequestException:
        return None, None


def get_cms_csv_url() -> str:
    """Fetch the current CSV download URL from CMS metadata."""
    try:
        resp = requests.get(CMS_METADATA_URL, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        
        distributions = data.get("distribution", [])
        for dist in distributions:
            if dist.get("mediaType") == "text/csv":
                return dist.get("downloadURL", CMS_CSV_FALLBACK)
        
        return CMS_CSV_FALLBACK
    except requests.RequestException:
        print("  [WARNING] Could not fetch metadata, using fallback CSV URL")
        return CMS_CSV_FALLBACK


def load_geocode_cache() -> Dict:
    """Load geocoded facilities from cache file."""
    if os.path.exists(GEOCODE_CACHE_FILE):
        try:
            with open(GEOCODE_CACHE_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def save_geocode_cache(cache: Dict) -> None:
    """Save geocoded facilities to cache file."""
    with open(GEOCODE_CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)


def load_resort_cache() -> Dict:
    """Load geocoded resorts from cache file."""
    if os.path.exists(RESORT_CACHE_FILE):
        try:
            with open(RESORT_CACHE_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def save_resort_cache(cache: Dict) -> None:
    """Save geocoded resorts to cache file."""
    with open(RESORT_CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)


def generate_resorts_json(df_resorts: pd.DataFrame) -> None:
    """
    Generate resorts.json with all Epic Pass US resorts.
    
    Args:
        df_resorts: DataFrame with resort data (name, state, lat, lon)
    """
    print(f"\n[OUTPUT] Generating {RESORTS_JSON}...")
    
    valid_resorts = df_resorts.dropna(subset=["lat", "lon"]).copy()
    
    # Create clean list of resort objects
    resorts = []
    for _, row in valid_resorts.sort_values("resort").iterrows():
        resorts.append({
            "name": row["resort"],
            "state": row["state"],
            "lat": round(float(row["lat"]), 6),
            "lon": round(float(row["lon"]), 6)
        })
    
    with open(RESORTS_JSON, 'w') as f:
        json.dump(resorts, f, indent=2)
    
    print(f"  Resorts: {len(resorts)}")
    print(f"  Saved to: {RESORTS_JSON}")


def generate_clinics_json(df_resorts: pd.DataFrame, df_clinics: pd.DataFrame) -> None:
    """
    Generate clinics.json with all DaVita clinics within MAX_CLINIC_DISTANCE miles of any resort.
    
    Args:
        df_resorts: DataFrame with resort data (must have lat, lon columns)
        df_clinics: DataFrame with clinic data (must have lat, lon columns)
    """
    print(f"\n[OUTPUT] Generating {CLINICS_JSON} (clinics within {MAX_CLINIC_DISTANCE} mi of any resort)...")
    
    valid_resorts = df_resorts.dropna(subset=["lat", "lon"])
    valid_clinics = df_clinics.dropna(subset=["lat", "lon"])
    
    # For each clinic, find minimum distance to any resort
    clinics = []
    
    for _, clinic in valid_clinics.iterrows():
        clinic_lat = float(clinic["lat"])
        clinic_lon = float(clinic["lon"])
        
        # Calculate distance to all resorts
        min_dist = float('inf')
        nearest_resort = None
        
        for _, resort in valid_resorts.iterrows():
            dist = haversine_miles(
                clinic_lat, clinic_lon,
                float(resort["lat"]), float(resort["lon"])
            )
            if dist < min_dist:
                min_dist = dist
                nearest_resort = resort["resort"]
        
        # Only include if within threshold
        if min_dist <= MAX_CLINIC_DISTANCE:
            clinics.append({
                "ccn": str(clinic.get("CMS Certification Number (CCN)", "")),
                "facility": clinic.get("Facility Name", ""),
                "address": clinic.get("Address Line 1", ""),
                "city": clinic.get("City/Town", ""),
                "state": clinic.get("State", ""),
                "zip": str(clinic.get("ZIP Code", "")),
                "lat": round(clinic_lat, 6),
                "lon": round(clinic_lon, 6),
                "nearestResort": nearest_resort,
                "nearestResortDist": round(min_dist, 2)
            })
    
    # Sort by state, city, facility
    clinics.sort(key=lambda c: (c["state"], c["city"], c["facility"]))
    
    with open(CLINICS_JSON, 'w') as f:
        json.dump(clinics, f, indent=2)
    
    print(f"  Clinics within {MAX_CLINIC_DISTANCE} mi: {len(clinics):,} (of {len(valid_clinics):,} total)")
    print(f"  Saved to: {CLINICS_JSON}")


def main():
    """Main execution flow."""
    print("=" * 70)
    print("Epic Pass US Resorts - Nearest DaVita Clinics Finder")
    print("Cams's Implementation")
    print("=" * 70)
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # =========================================================================
    # STEP 1: Geocode resorts (with caching)
    # =========================================================================
    print("\n[1/4] Geocoding resorts via OpenStreetMap Nominatim...")
    
    resort_cache = load_resort_cache()
    print(f"  Loaded {len(resort_cache)} cached resort geocodes")
    
    resort_data = []
    new_geocodes = 0
    cached_count = 0
    
    for idx, (name, state) in enumerate(RESORTS, start=1):
        cache_key = f"{name}|{state}"
        
        if cache_key in resort_cache:
            # Use cached coordinates
            cached = resort_cache[cache_key]
            resort_data.append({
                "resort": name,
                "state": state,
                "query": cached.get("query", ""),
                "lat": cached.get("lat"),
                "lon": cached.get("lon")
            })
            cached_count += 1
        else:
            # Geocode and cache
            print(f"  [{idx:02d}/{len(RESORTS)}] {name}, {state}...", end=" ", flush=True)
            lat, lon, query = geocode_resort_nominatim(name, state)
            
            if lat is not None:
                print(f"OK ({lat:.4f}, {lon:.4f})")
            else:
                print("FAILED")
            
            resort_data.append({
                "resort": name,
                "state": state,
                "query": query,
                "lat": lat,
                "lon": lon
            })
            
            # Cache the result
            resort_cache[cache_key] = {"lat": lat, "lon": lon, "query": query}
            new_geocodes += 1
            time.sleep(NOMINATIM_DELAY)
    
    # Save resort cache
    save_resort_cache(resort_cache)
    print(f"  Summary: {cached_count} cached, {new_geocodes} newly geocoded")
    
    df_resorts = pd.DataFrame(resort_data)
    
    # Report geocoding failures
    failed = df_resorts[df_resorts["lat"].isna()]
    if not failed.empty:
        print("\n  [WARNING] Resorts that failed to geocode:")
        for _, row in failed.iterrows():
            print(f"    - {row['resort']}, {row['state']}")
    
    # =========================================================================
    # STEP 2: Download CMS dialysis facility data
    # =========================================================================
    print("\n[2/4] Downloading CMS dialysis facility data...")
    
    csv_url = get_cms_csv_url()
    print(f"  URL: {csv_url[:70]}...")
    
    try:
        resp = requests.get(csv_url, timeout=120)
        resp.raise_for_status()
        df_facilities = pd.read_csv(StringIO(resp.text))
        print(f"  Total facilities: {len(df_facilities):,}")
    except requests.RequestException as e:
        print(f"  [ERROR] Download failed: {e}")
        return
    
    # Filter to DaVita
    df_davita = df_facilities[
        df_facilities["Chain Organization"].astype(str).str.upper().str.contains("DAVITA", na=False)
    ].copy()
    print(f"  DaVita facilities: {len(df_davita):,}")
    
    if df_davita.empty:
        print("  [ERROR] No DaVita facilities found!")
        return
    
    # =========================================================================
    # STEP 3: Geocode DaVita facilities (with caching)
    # =========================================================================
    print("\n[3/4] Geocoding DaVita facilities via US Census Geocoder...")
    
    cache = load_geocode_cache()
    print(f"  Loaded {len(cache):,} cached geocodes")
    
    geocoded_count = 0
    failed_count = 0
    skipped_count = 0
    
    lats = []
    lons = []
    
    total = len(df_davita)
    for idx, (_, row) in enumerate(df_davita.iterrows(), start=1):
        # Create cache key from CCN (unique identifier)
        ccn = str(row.get("CMS Certification Number (CCN)", ""))
        
        if ccn in cache:
            # Use cached coordinates
            lats.append(cache[ccn].get("lat"))
            lons.append(cache[ccn].get("lon"))
            skipped_count += 1
        else:
            # Geocode the facility
            address = str(row.get("Address Line 1", ""))
            city = str(row.get("City/Town", ""))
            state = str(row.get("State", ""))
            zipcode = str(row.get("ZIP Code", ""))
            
            lat, lon = geocode_facility_census(address, city, state, zipcode)
            
            # Cache the result
            cache[ccn] = {"lat": lat, "lon": lon}
            lats.append(lat)
            lons.append(lon)
            
            if lat is not None:
                geocoded_count += 1
            else:
                failed_count += 1
            
            # Progress update every 100 facilities
            if idx % 100 == 0 or idx == total:
                print(f"  Progress: {idx:,}/{total:,} ({geocoded_count:,} new, {skipped_count:,} cached, {failed_count:,} failed)")
                # Save cache periodically
                save_geocode_cache(cache)
            
            time.sleep(CENSUS_DELAY)
    
    # Final cache save
    save_geocode_cache(cache)
    
    df_davita["lat"] = lats
    df_davita["lon"] = lons
    
    # Remove facilities without coordinates
    df_davita_valid = df_davita.dropna(subset=["lat", "lon"]).copy()
    print(f"  Facilities with valid coordinates: {len(df_davita_valid):,}")
    
    if df_davita_valid.empty:
        print("  [ERROR] No geocoded facilities available!")
        return
    
    # =========================================================================
    # STEP 4: Generate output JSON files
    # =========================================================================
    print("\n[4/4] Generating output files...")
    
    # Generate resorts.json (clean, normalized resort list)
    generate_resorts_json(df_resorts)
    
    # Generate clinics.json (all clinics within 200mi of any resort)
    generate_clinics_json(df_resorts, df_davita_valid)
    
    valid_resorts = df_resorts.dropna(subset=["lat", "lon"])
    
    print("\n" + "=" * 70)
    print(f"SUCCESS! Outputs written:")
    print(f"  - {RESORTS_JSON} ({len(valid_resorts)} Epic Pass US resorts)")
    print(f"  - {CLINICS_JSON} (DaVita clinics within {MAX_CLINIC_DISTANCE} mi of resorts)")
    print(f"  - {RESORT_CACHE_FILE} (resort geocode cache)")
    print(f"  - {GEOCODE_CACHE_FILE} (clinic geocode cache)")
    print("=" * 70)


if __name__ == "__main__":
    main()
