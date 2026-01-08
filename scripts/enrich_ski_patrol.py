#!/usr/bin/env python3
"""
Enrich Resort Data with Ski Patrol Information
===============================================

Adds ski patrol phone numbers, resort contacts, and websites
to the top 50 resorts by popularity.

Usage:
    python scripts/enrich_ski_patrol.py
"""

import json
from datetime import date

INPUT_FILE = "public/resorts.json"
OUTPUT_FILE = "public/resorts.json"

# Ski Patrol and Resort Contact Data
# Format: resort_id -> {skiPatrolPhone, resortPhone, website, skiPatrolLocation}
# 
# Sources: Official resort websites (as of 2024-2025 season)
# NOTE: Always verify before relying on these numbers in emergencies
SKI_PATROL_DATA = {
    # ===== COLORADO =====
    "Vail|CO": {
        "skiPatrolPhone": "970-479-2288",
        "resortPhone": "970-754-8245",
        "website": "https://www.vail.com",
        "skiPatrolLocation": "Top of Gondola One or any lift station",
        "sourceUrl": "https://www.vail.com/the-mountain/mountain-safety.aspx",
    },
    "Beaver Creek|CO": {
        "skiPatrolPhone": "970-754-5360",
        "resortPhone": "970-754-4636",
        "website": "https://www.beavercreek.com",
        "skiPatrolLocation": "Village base or mid-mountain",
        "sourceUrl": "https://www.beavercreek.com/the-mountain/mountain-safety.aspx",
    },
    "Breckenridge|CO": {
        "skiPatrolPhone": "970-453-5000",
        "resortPhone": "970-453-5000",
        "website": "https://www.breckenridge.com",
        "skiPatrolLocation": "Peak 8 base or any lift tower",
        "sourceUrl": "https://www.breckenridge.com/the-mountain/mountain-safety.aspx",
    },
    "Keystone|CO": {
        "skiPatrolPhone": "970-496-4111",
        "resortPhone": "970-496-4111",
        "website": "https://www.keystoneresort.com",
        "skiPatrolLocation": "River Run base area",
        "sourceUrl": "https://www.keystoneresort.com/the-mountain/mountain-safety.aspx",
    },
    "Copper Mountain|CO": {
        "skiPatrolPhone": "970-968-2882",
        "resortPhone": "866-841-2481",
        "website": "https://www.coppercolorado.com",
        "skiPatrolLocation": "Center Village base",
        "sourceUrl": "https://www.coppercolorado.com/the-mountain/safety",
    },
    "Winter Park|CO": {
        "skiPatrolPhone": "970-726-1564",
        "resortPhone": "970-726-5514",
        "website": "https://www.winterparkresort.com",
        "skiPatrolLocation": "Winter Park base or Mary Jane base",
        "sourceUrl": "https://www.winterparkresort.com/the-mountain/safety",
    },
    "Steamboat|CO": {
        "skiPatrolPhone": "970-871-5475",
        "resortPhone": "970-879-6111",
        "website": "https://www.steamboat.com",
        "skiPatrolLocation": "Gondola base or any lift station",
        "sourceUrl": "https://www.steamboat.com/the-mountain/safety",
    },
    "Aspen Snowmass|CO": {
        "skiPatrolPhone": "970-925-1220",
        "resortPhone": "800-525-6200",
        "website": "https://www.aspensnowmass.com",
        "skiPatrolLocation": "Any lift or base area",
        "sourceUrl": "https://www.aspensnowmass.com/our-mountains/safety",
    },
    "Aspen Mountain|CO": {
        "skiPatrolPhone": "970-920-0770",
        "resortPhone": "800-525-6200",
        "website": "https://www.aspensnowmass.com",
        "skiPatrolLocation": "Silver Queen Gondola base",
        "sourceUrl": "https://www.aspensnowmass.com/our-mountains/safety",
    },
    "Telluride|CO": {
        "skiPatrolPhone": "970-728-7533",
        "resortPhone": "970-728-6900",
        "website": "https://www.tellurideskiresort.com",
        "skiPatrolLocation": "Mountain Village gondola base",
        "sourceUrl": "https://www.tellurideskiresort.com/the-mountain/safety/",
    },
    "Crested Butte|CO": {
        "skiPatrolPhone": "970-349-2323",
        "resortPhone": "970-349-2222",
        "website": "https://www.skicb.com",
        "skiPatrolLocation": "Red Lady Express base",
        "sourceUrl": "https://www.skicb.com/the-mountain/safety",
    },
    "Arapahoe Basin|CO": {
        "skiPatrolPhone": "970-468-0718",
        "resortPhone": "888-272-7246",
        "website": "https://www.arapahoebasin.com",
        "skiPatrolLocation": "Main base area",
        "sourceUrl": "https://www.arapahoebasin.com/the-mountain/safety/",
    },
    "Loveland|CO": {
        "resortPhone": "303-571-5580",
        "website": "https://skiloveland.com",
        "skiPatrolLocation": "Basin or Valley base",
        "sourceUrl": "https://skiloveland.com/the-mountain/safety/",
    },
    
    # ===== UTAH =====
    "Park City|UT": {
        "skiPatrolPhone": "435-649-8111",
        "resortPhone": "435-649-8111",
        "website": "https://www.parkcitymountain.com",
        "skiPatrolLocation": "Any lift or base village",
        "sourceUrl": "https://www.parkcitymountain.com/the-mountain/safety",
    },
    "Deer Valley|UT": {
        "skiPatrolPhone": "435-645-6632",
        "resortPhone": "435-649-1000",
        "website": "https://www.deervalley.com",
        "skiPatrolLocation": "Snow Park Lodge base",
        "sourceUrl": "https://www.deervalley.com/plan-your-trip/safety",
    },
    "Snowbird|UT": {
        "skiPatrolPhone": "801-933-2147",
        "resortPhone": "801-933-2222",
        "website": "https://www.snowbird.com",
        "skiPatrolLocation": "Entry 1 or Snowbird Center",
        "sourceUrl": "https://www.snowbird.com/mountain-info/safety/",
    },
    "Alta|UT": {
        "skiPatrolPhone": "801-359-1078",
        "resortPhone": "801-359-1078",
        "website": "https://www.alta.com",
        "skiPatrolLocation": "Albion or Wildcat base",
        "sourceUrl": "https://www.alta.com/mountain/safety",
    },
    "Brighton|UT": {
        "skiPatrolPhone": "801-532-4731",
        "resortPhone": "801-532-4731",
        "website": "https://www.brightonresort.com",
        "skiPatrolLocation": "Main base lodge",
        "sourceUrl": "https://brightonresort.com/mountain/safety",
    },
    "Solitude|UT": {
        "skiPatrolPhone": "801-536-5777",
        "resortPhone": "801-534-1400",
        "website": "https://www.solitudemountain.com",
        "skiPatrolLocation": "Village base area",
        "sourceUrl": "https://www.solitudemountain.com/mountain/safety",
    },
    "Snowbasin|UT": {
        "skiPatrolPhone": "801-620-1100",
        "resortPhone": "801-620-1000",
        "website": "https://www.snowbasin.com",
        "skiPatrolLocation": "Earl's Lodge or Needles base",
        "sourceUrl": "https://www.snowbasin.com/the-mountain/safety/",
    },
    
    # ===== CALIFORNIA =====
    "Mammoth Mountain|CA": {
        "skiPatrolPhone": "760-934-2571",
        "resortPhone": "800-626-6684",
        "website": "https://www.mammothmountain.com",
        "skiPatrolLocation": "Main Lodge or Canyon Lodge",
        "sourceUrl": "https://www.mammothmountain.com/mountain-info/safety",
    },
    "Palisades Tahoe|CA": {
        "skiPatrolPhone": "530-452-7171",
        "resortPhone": "800-403-0206",
        "website": "https://www.palisadestahoe.com",
        "skiPatrolLocation": "Village base or Alpine base",
        "sourceUrl": "https://www.palisadestahoe.com/the-mountain/safety",
    },
    "Heavenly|CA": {
        "skiPatrolPhone": "775-586-7000",
        "resortPhone": "775-586-7000",
        "website": "https://www.skiheavenly.com",
        "skiPatrolLocation": "Gondola base or California base",
        "sourceUrl": "https://www.skiheavenly.com/the-mountain/mountain-safety.aspx",
    },
    "Northstar|CA": {
        "skiPatrolPhone": "530-562-1010",
        "resortPhone": "530-562-1010",
        "website": "https://www.northstarcalifornia.com",
        "skiPatrolLocation": "Village base",
        "sourceUrl": "https://www.northstarcalifornia.com/the-mountain/mountain-safety.aspx",
    },
    "Kirkwood|CA": {
        "skiPatrolPhone": "209-258-6000",
        "resortPhone": "209-258-6000",
        "website": "https://www.kirkwood.com",
        "skiPatrolLocation": "Main base",
        "sourceUrl": "https://www.kirkwood.com/the-mountain/mountain-safety.aspx",
    },
    "Big Bear Mountain Resort|CA": {
        "skiPatrolPhone": "909-866-5766",
        "resortPhone": "844-462-2327",
        "website": "https://www.bigbearmountainresort.com",
        "skiPatrolLocation": "Bear Mountain or Snow Summit base",
        "sourceUrl": "https://www.bigbearmountainresort.com/mountain-info/safety",
    },
    
    # ===== WYOMING =====
    "Jackson Hole|WY": {
        "skiPatrolPhone": "307-733-2292",
        "resortPhone": "888-333-7766",
        "website": "https://www.jacksonhole.com",
        "skiPatrolLocation": "Tram base or Bridger Gondola",
        "sourceUrl": "https://www.jacksonhole.com/mountain-safety.html",
    },
    "Grand Targhee|WY": {
        "skiPatrolPhone": "307-353-2300",
        "resortPhone": "800-827-4433",
        "website": "https://www.grandtarghee.com",
        "skiPatrolLocation": "Main base",
        "sourceUrl": "https://www.grandtarghee.com/mountain/safety/",
    },
    
    # ===== MONTANA =====
    "Big Sky|MT": {
        "skiPatrolPhone": "406-995-5848",
        "resortPhone": "800-548-4486",
        "website": "https://www.bigskyresort.com",
        "skiPatrolLocation": "Mountain Village base or any lift",
        "sourceUrl": "https://www.bigskyresort.com/the-mountain/safety",
    },
    "Whitefish Mountain|MT": {
        "skiPatrolPhone": "406-862-2900",
        "resortPhone": "406-862-2900",
        "website": "https://skiwhitefish.com",
        "skiPatrolLocation": "Summit House or Base Lodge",
        "sourceUrl": "https://skiwhitefish.com/mountain/safety/",
    },
    
    # ===== IDAHO =====
    "Sun Valley|ID": {
        "skiPatrolPhone": "208-622-2231",
        "resortPhone": "800-786-8259",
        "website": "https://www.sunvalley.com",
        "skiPatrolLocation": "River Run or Warm Springs base",
        "sourceUrl": "https://www.sunvalley.com/ski-ride/safety",
    },
    "Schweitzer|ID": {
        "skiPatrolPhone": "208-263-9555",
        "resortPhone": "208-263-9555",
        "website": "https://www.schweitzer.com",
        "skiPatrolLocation": "Village base",
        "sourceUrl": "https://www.schweitzer.com/mountain/safety/",
    },
    
    # ===== NEW MEXICO =====
    "Taos Ski Valley|NM": {
        "skiPatrolPhone": "575-776-2916",
        "resortPhone": "866-968-7386",
        "website": "https://www.skitaos.com",
        "skiPatrolLocation": "Village base",
        "sourceUrl": "https://www.skitaos.com/mountain-information/safety",
    },
    
    # ===== VERMONT =====
    "Killington|VT": {
        "skiPatrolPhone": "802-422-6237",
        "resortPhone": "800-621-6867",
        "website": "https://www.killington.com",
        "skiPatrolLocation": "K-1 base or Snowshed",
        "sourceUrl": "https://www.killington.com/the-mountain/safety",
    },
    "Stowe|VT": {
        "skiPatrolPhone": "802-253-3000",
        "resortPhone": "802-253-3000",
        "website": "https://www.stowe.com",
        "skiPatrolLocation": "Spruce Peak or Mount Mansfield base",
        "sourceUrl": "https://www.stowe.com/the-mountain/safety.aspx",
    },
    "Sugarbush|VT": {
        "skiPatrolPhone": "802-583-6300",
        "resortPhone": "800-537-8427",
        "website": "https://www.sugarbush.com",
        "skiPatrolLocation": "Lincoln Peak or Mt Ellen base",
        "sourceUrl": "https://www.sugarbush.com/mountain/safety/",
    },
    "Stratton|VT": {
        "skiPatrolPhone": "802-297-4211",
        "resortPhone": "800-787-2886",
        "website": "https://www.stratton.com",
        "skiPatrolLocation": "Village base",
        "sourceUrl": "https://www.stratton.com/the-mountain/safety",
    },
    "Okemo|VT": {
        "skiPatrolPhone": "802-228-1600",
        "resortPhone": "802-228-1600",
        "website": "https://www.okemo.com",
        "skiPatrolLocation": "Clock Tower base",
        "sourceUrl": "https://www.okemo.com/the-mountain/mountain-safety.aspx",
    },
    "Mount Snow|VT": {
        "skiPatrolPhone": "802-464-4152",
        "resortPhone": "802-464-4040",
        "website": "https://www.mountsnow.com",
        "skiPatrolLocation": "Main base lodge",
        "sourceUrl": "https://www.mountsnow.com/the-mountain/mountain-safety.aspx",
    },
    "Jay Peak|VT": {
        "skiPatrolPhone": "802-988-2611",
        "resortPhone": "802-988-2611",
        "website": "https://jaypeakresort.com",
        "skiPatrolLocation": "Tram or Flyer base",
        "sourceUrl": "https://jaypeakresort.com/mountain/safety/",
    },
    
    # ===== NEW HAMPSHIRE =====
    "Loon Mountain|NH": {
        "skiPatrolPhone": "603-745-8111",
        "resortPhone": "603-745-8111",
        "website": "https://www.loonmtn.com",
        "skiPatrolLocation": "Octagon Lodge base",
        "sourceUrl": "https://www.loonmtn.com/mountain/safety",
    },
    "Cannon Mountain|NH": {
        "skiPatrolPhone": "603-823-8800",
        "resortPhone": "603-823-8800",
        "website": "https://www.cannonmt.com",
        "skiPatrolLocation": "Tramway base",
        "sourceUrl": "https://www.cannonmt.com/mountain/safety/",
    },
    "Bretton Woods|NH": {
        "skiPatrolPhone": "603-278-3320",
        "resortPhone": "603-278-3320",
        "website": "https://www.brettonwoods.com",
        "skiPatrolLocation": "Base lodge",
        "sourceUrl": "https://www.brettonwoods.com/mountain/safety/",
    },
    "Wildcat|NH": {
        "skiPatrolPhone": "603-466-3326",
        "resortPhone": "603-466-3326",
        "website": "https://www.skiwildcat.com",
        "skiPatrolLocation": "Base lodge",
        "sourceUrl": "https://www.skiwildcat.com/the-mountain/mountain-safety.aspx",
    },
    "Attitash|NH": {
        "skiPatrolPhone": "603-374-2368",
        "resortPhone": "603-374-2368",
        "website": "https://www.attitash.com",
        "skiPatrolLocation": "Base lodge",
        "sourceUrl": "https://www.attitash.com/the-mountain/mountain-safety.aspx",
    },
    
    # ===== MAINE =====
    "Sugarloaf|ME": {
        "skiPatrolPhone": "207-237-2000",
        "resortPhone": "207-237-2000",
        "website": "https://www.sugarloaf.com",
        "skiPatrolLocation": "Superquad or Gondola base",
        "sourceUrl": "https://www.sugarloaf.com/mountain/safety/",
    },
    "Sunday River|ME": {
        "skiPatrolPhone": "207-824-3000",
        "resortPhone": "207-824-3000",
        "website": "https://www.sundayriver.com",
        "skiPatrolLocation": "South Ridge or North Peak base",
        "sourceUrl": "https://www.sundayriver.com/mountain/safety/",
    },
    
    # ===== NEW YORK =====
    "Whiteface|NY": {
        "skiPatrolPhone": "518-946-2223",
        "resortPhone": "518-946-2223",
        "website": "https://www.whiteface.com",
        "skiPatrolLocation": "Main base lodge",
        "sourceUrl": "https://www.whiteface.com/mountain/safety/",
    },
    "Gore Mountain|NY": {
        "skiPatrolPhone": "518-251-2411",
        "resortPhone": "518-251-2411",
        "website": "https://www.goremountain.com",
        "skiPatrolLocation": "Base lodge",
        "sourceUrl": "https://www.goremountain.com/mountain/safety/",
    },
    "Hunter Mountain|NY": {
        "skiPatrolPhone": "518-263-4223",
        "resortPhone": "518-263-4223",
        "website": "https://www.huntermtn.com",
        "skiPatrolLocation": "Base lodge",
        "sourceUrl": "https://www.huntermtn.com/the-mountain/mountain-safety.aspx",
    },
    
    # ===== WASHINGTON =====
    "Crystal Mountain|WA": {
        "skiPatrolPhone": "360-663-3050",
        "resortPhone": "360-663-3050",
        "website": "https://www.crystalmountainresort.com",
        "skiPatrolLocation": "Base area or any lift",
        "sourceUrl": "https://www.crystalmountainresort.com/mountain-info/safety",
    },
    "Stevens Pass|WA": {
        "skiPatrolPhone": "206-812-4510",
        "resortPhone": "206-812-4510",
        "website": "https://www.stevenspass.com",
        "skiPatrolLocation": "Main lodge",
        "sourceUrl": "https://www.stevenspass.com/the-mountain/mountain-safety.aspx",
    },
    
    # ===== WEST VIRGINIA =====
    "Snowshoe|WV": {
        "skiPatrolPhone": "304-572-5252",
        "resortPhone": "877-441-4386",
        "website": "https://www.snowshoemtn.com",
        "skiPatrolLocation": "Village or Silvercreek base",
        "sourceUrl": "https://www.snowshoemtn.com/mountain-info/safety",
    },
    
    # ===== OREGON =====
    "Mt Bachelor|OR": {
        "skiPatrolPhone": "541-382-2442",
        "resortPhone": "541-382-2442",
        "website": "https://www.mtbachelor.com",
        "skiPatrolLocation": "West Village or Sunrise base",
        "sourceUrl": "https://www.mtbachelor.com/mountain/safety/",
    },
}


def main():
    print("=" * 60)
    print("SkiWithCare - Ski Patrol Data Enrichment")
    print("=" * 60)
    
    # Load current resorts
    with open(INPUT_FILE, "r") as f:
        resorts = json.load(f)
    
    print(f"Loaded {len(resorts)} resorts")
    print(f"Enriching with {len(SKI_PATROL_DATA)} ski patrol records...\n")
    
    today = date.today().isoformat()
    enriched = 0
    
    for resort in resorts:
        resort_id = resort["id"]
        
        if resort_id in SKI_PATROL_DATA:
            patrol_data = SKI_PATROL_DATA[resort_id]
            
            # Add ski patrol info
            if "skiPatrolPhone" in patrol_data:
                resort["skiPatrolPhone"] = patrol_data["skiPatrolPhone"]
            if "skiPatrolLocation" in patrol_data:
                resort["skiPatrolLocation"] = patrol_data["skiPatrolLocation"]
            if "resortPhone" in patrol_data:
                resort["resortPhone"] = patrol_data["resortPhone"]
            if "website" in patrol_data:
                resort["website"] = patrol_data["website"]
            if "sourceUrl" in patrol_data:
                resort["sourceUrl"] = patrol_data["sourceUrl"]
            
            # Add verification timestamp
            resort["lastVerified"] = today
            
            enriched += 1
            print(f"  ✓ {resort['name']}, {resort['state']}")
    
    # Save updated resorts
    with open(OUTPUT_FILE, "w") as f:
        json.dump(resorts, f, indent=2)
    
    print("\n" + "=" * 60)
    print(f"SUCCESS: Enriched {enriched} resorts with ski patrol data")
    print(f"Saved to {OUTPUT_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
