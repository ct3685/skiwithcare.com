#!/usr/bin/env python3
"""
SkiWithCare Data Generator
==========================

Generates JSON data files for the SkiWithCare web application:
- clinics.json: All dialysis clinics near resorts (all providers)

Data Sources:
- CMS Provider Data Catalog (dialysis facilities)
- US Census Bureau Batch Geocoder (facility geocoding)

Usage:
    python scripts/generate_data.py

Output:
    public/clinics.json
"""

import csv
import json
import math
import os
import sys
import time
from io import StringIO
from typing import Dict, List

import requests

# Add scripts directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import classify_provider

# === CONFIGURATION ===

OUTPUT_DIR = "public"
RESORTS_JSON = f"{OUTPUT_DIR}/resorts.json"
CLINICS_JSON = f"{OUTPUT_DIR}/clinics.json"
CACHE_FILE = "facility_geocoded_cache.json"

# CMS Dialysis Facility Dataset
CMS_METADATA_URL = "https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items/23ew-n7w9"
CMS_CSV_FALLBACK = "https://data.cms.gov/provider-data/sites/default/files/resources/c04d84bc5c641284494bee4f20f17f9c_1759341903/DFC_FACILITY.csv"

# Census Batch Geocoder (handles up to 10,000 addresses per request)
CENSUS_BATCH_URL = "https://geocoding.geo.census.gov/geocoder/locations/addressbatch"

# Distance threshold for clinic inclusion (miles)
MAX_CLINIC_DISTANCE = 200
BATCH_SIZE = 5000  # Census allows 10k, but smaller batches = more reliable


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in miles."""
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl/2)**2
    return 2 * r * math.asin(math.sqrt(a))


def load_json(path: str, default=None) -> Dict:
    """Load JSON from file."""
    try:
        with open(path, "r") as f:
            return json.load(f)
    except:
        return default if default is not None else {}


def save_json(path: str, data) -> None:
    """Save JSON to file."""
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def spinner(msg: str, i: int) -> None:
    """Simple spinner for long operations."""
    chars = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    sys.stdout.write(f"\r   {chars[i % len(chars)]} {msg}")
    sys.stdout.flush()


def progress_bar(current: int, total: int, width: int = 40, prefix: str = "", suffix: str = "") -> None:
    """Display a progress bar."""
    pct = current / total if total > 0 else 1
    filled = int(width * pct)
    bar = "█" * filled + "░" * (width - filled)
    sys.stdout.write(f"\r{prefix} [{bar}] {current}/{total} ({pct*100:.0f}%) {suffix}  ")
    sys.stdout.flush()


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
        print("   [WARNING] Could not fetch metadata, using fallback CSV URL")
        return CMS_CSV_FALLBACK


def batch_geocode(addresses: List[tuple]) -> Dict:
    """
    Geocode addresses using Census Bureau batch API.
    addresses: list of (id, street, city, state, zip)
    Returns: dict of id -> {"lat": ..., "lon": ...} or {"failed": True}
    """
    results = {}
    
    # Create CSV content
    csv_content = StringIO()
    writer = csv.writer(csv_content)
    for addr in addresses:
        writer.writerow(addr)
    
    # Submit to Census
    files = {
        'addressFile': ('addresses.csv', csv_content.getvalue(), 'text/csv')
    }
    data = {
        'benchmark': 'Public_AR_Current',
        'vintage': 'Current_Current'
    }
    
    try:
        response = requests.post(
            CENSUS_BATCH_URL,
            files=files,
            data=data,
            timeout=300  # 5 min timeout for large batches
        )
        response.raise_for_status()
        
        # Parse CSV response
        # Format: id, input_address, match_status, match_type, matched_address, "lon,lat", tiger_id, side
        reader = csv.reader(StringIO(response.text))
        for row in reader:
            if len(row) >= 1:
                fid = row[0]
                match_status = row[2] if len(row) > 2 else ""
                
                if match_status in ("Match", "Exact"):
                    # Coordinates are in column 5 as "lon,lat" string
                    try:
                        coords_str = row[5] if len(row) > 5 else ""
                        if "," in coords_str:
                            lon_str, lat_str = coords_str.split(",")
                            lon = float(lon_str.strip())
                            lat = float(lat_str.strip())
                            results[fid] = {"lat": lat, "lon": lon}
                        else:
                            results[fid] = {"failed": True}
                    except (ValueError, IndexError):
                        results[fid] = {"failed": True}
                else:
                    results[fid] = {"failed": True}
                    
    except Exception as e:
        print(f"\n   ❌ Batch geocode error: {e}")
        # Mark all as failed
        for addr in addresses:
            results[addr[0]] = {"failed": True}
    
    return results


def main():
    """Main execution flow."""
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║   💉 SkiWithCare - Dialysis Clinic Fetcher (BATCH MODE)  ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load resorts
    resorts = load_json(RESORTS_JSON, [])
    if not resorts:
        print("❌ ERROR: No resorts. Run build_resorts.py first.")
        return
    print(f"✓ Loaded {len(resorts)} resorts")
    
    # Load cache
    cache = load_json(CACHE_FILE, {})
    print(f"✓ Loaded {len(cache):,} cached geocodes")
    
    # Download dialysis data
    print()
    print("━" * 60)
    print("📥 Step 1/3: Downloading dialysis facility data from CMS...")
    print("━" * 60)
    
    for i in range(10):
        spinner("Fetching metadata...", i)
        time.sleep(0.1)
    
    csv_url = get_cms_csv_url()
    
    for i in range(20):
        spinner("Downloading facility data...", i)
        time.sleep(0.1)
    
    try:
        resp = requests.get(csv_url, timeout=120)
        resp.raise_for_status()
        print(f"\r   ✓ Downloaded {len(resp.content) // 1024:,} KB              ")
    except requests.RequestException as e:
        print(f"\r   ❌ ERROR: {e}")
        return
    
    # Parse CSV
    reader = csv.DictReader(StringIO(resp.text))
    rows = list(reader)
    print(f"   ✓ {len(rows):,} total dialysis facilities")
    
    # Find addresses needing geocode
    need_geocode = []
    for row in rows:
        ccn = str(row.get("CMS Certification Number (CCN)", ""))
        if ccn and ccn not in cache:
            need_geocode.append((
                ccn,
                row.get("Address Line 1", ""),
                row.get("City/Town", ""),
                row.get("State", ""),
                str(row.get("ZIP Code", ""))
            ))
    
    cached_count = len(rows) - len(need_geocode)
    
    print()
    print("━" * 60)
    print("📍 Step 2/3: Batch geocoding addresses...")
    print("━" * 60)
    print(f"   Already cached: {cached_count:,}")
    print(f"   Need geocoding: {len(need_geocode):,}")
    
    if need_geocode:
        print()
        start_time = time.time()
        total_batches = (len(need_geocode) + BATCH_SIZE - 1) // BATCH_SIZE
        new_geocodes = 0
        new_failed = 0
        
        for batch_num in range(total_batches):
            start_idx = batch_num * BATCH_SIZE
            end_idx = min(start_idx + BATCH_SIZE, len(need_geocode))
            batch = need_geocode[start_idx:end_idx]
            
            progress_bar(
                batch_num + 1, 
                total_batches, 
                prefix="   ",
                suffix=f"Batch {batch_num + 1}/{total_batches} ({len(batch)} addresses)"
            )
            
            results = batch_geocode(batch)
            
            for fid, coords in results.items():
                cache[fid] = coords
                if coords.get("lat"):
                    new_geocodes += 1
                else:
                    new_failed += 1
            
            # Save cache after each batch
            save_json(CACHE_FILE, cache)
        
        elapsed = time.time() - start_time
        print()
        print()
        print(f"   ✓ Geocoded: {new_geocodes:,}")
        print(f"   ✗ Failed: {new_failed:,}")
        print(f"   ⏱ Time: {elapsed:.1f}s")
    else:
        print()
        print("   ✓ All facilities already geocoded!")
    
    # Build output
    print()
    print("━" * 60)
    print(f"🏔 Step 3/3: Finding clinics within {MAX_CLINIC_DISTANCE} mi of resorts...")
    print("━" * 60)
    
    clinics = []
    processed = 0
    
    for row in rows:
        ccn = str(row.get("CMS Certification Number (CCN)", ""))
        c = cache.get(ccn, {})
        
        lat, lon = c.get("lat"), c.get("lon")
        if not lat or not lon:
            continue
        
        # Find nearest resort
        min_dist = float("inf")
        nearest = None
        for r in resorts:
            d = haversine_miles(lat, lon, r["lat"], r["lon"])
            if d < min_dist:
                min_dist = d
                nearest = r["name"]
        
        if min_dist > MAX_CLINIC_DISTANCE:
            continue
        
        # Classify provider
        chain = str(row.get("Chain Organization", ""))
        provider = classify_provider(chain)
        
        clinics.append({
            "ccn": ccn,
            "facility": row.get("Facility Name", ""),
            "provider": provider,
            "address": row.get("Address Line 1", ""),
            "city": row.get("City/Town", ""),
            "state": row.get("State", ""),
            "zip": str(row.get("ZIP Code", "")),
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "nearestResort": nearest,
            "nearestResortDist": round(min_dist, 2)
        })
        
        processed += 1
        if processed % 50 == 0:
            spinner(f"Processing... {processed} matched", processed // 10)
    
    clinics.sort(key=lambda c: (c["state"], c["city"], c["facility"]))
    save_json(CLINICS_JSON, clinics)
    
    # Summary
    provider_counts = {}
    for c in clinics:
        p = c["provider"]
        provider_counts[p] = provider_counts.get(p, 0) + 1
    
    states = len(set(c["state"] for c in clinics))
    
    print(f"\r   ✓ Found {len(clinics):,} clinics near ski resorts         ")
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║                      ✨ COMPLETE ✨                       ║")
    print("╠══════════════════════════════════════════════════════════╣")
    print(f"║  💉 Clinics:         {len(clinics):>5,}                            ║")
    print(f"║  📍 States:          {states:>5}                            ║")
    print(f"║  💾 Cache entries:   {len(cache):>5,}                            ║")
    print("╠══════════════════════════════════════════════════════════╣")
    
    for provider, count in sorted(provider_counts.items(), key=lambda x: -x[1]):
        print(f"║     {provider:<14} {count:>5,}                            ║")
    
    print("╚══════════════════════════════════════════════════════════╝")
    print()


if __name__ == "__main__":
    main()
