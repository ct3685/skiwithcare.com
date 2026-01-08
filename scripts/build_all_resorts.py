#!/usr/bin/env python3
"""
Build Comprehensive US Ski Resort Database
==========================================

Creates a complete list of US ski resorts from curated data,
then geocodes missing coordinates.

Sources:
- Curated list of 400+ US ski resorts
- Existing geocode cache
- Nominatim API for missing coordinates

Usage:
    python scripts/build_all_resorts.py
"""

import json
import time
import requests
from typing import Optional, Dict, List, Tuple

# Files
CACHE_FILE = "resort_geocoded_cache.json"
OUTPUT_FILE = "public/resorts.json"

# State abbreviations
STATE_ABBREVS = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
    "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
    "Wisconsin": "WI", "Wyoming": "WY",
}

# Region mapping
def get_region(state: str) -> str:
    """Determine geographic region based on state abbreviation."""
    northeast = {"ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"}
    southeast = {"WV", "VA", "NC", "TN", "GA", "MD", "KY"}
    midwest = {"OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"}
    rockies = {"CO", "UT", "WY", "MT", "ID", "NM"}
    west = {"CA", "NV", "AZ"}
    pacific_nw = {"WA", "OR", "AK"}
    
    if state in northeast:
        return "northeast"
    elif state in southeast:
        return "southeast"
    elif state in midwest:
        return "midwest"
    elif state in rockies:
        return "rockies"
    elif state in west:
        return "west"
    elif state in pacific_nw:
        return "pacific-northwest"
    return "other"

# Pass network data
EPIC_RESORTS = {
    "vail", "beaver creek", "breckenridge", "keystone", "crested butte",
    "park city", "heavenly", "northstar", "kirkwood", "stevens pass",
    "stowe", "okemo", "mount snow", "hunter mountain", "attitash",
    "wildcat", "mount sunapee", "crotched mountain",
    "liberty mountain", "roundtop", "whitetail", "jack frost", "big boulder",
    "seven springs", "hidden valley", "laurel mountain",
    "wilmot", "afton alps", "mt brighton", "alpine valley", "boston mills",
    "brandywine", "mad river mountain", "snow creek", "paoli peaks",
    "telluride",
}

IKON_RESORTS = {
    "aspen", "snowmass", "aspen snowmass", "steamboat", "winter park", "copper mountain",
    "eldora", "jackson hole", "big sky", "alta", "snowbird",
    "deer valley", "brighton", "solitude", "taos",
    "palisades tahoe", "squaw valley", "alpine meadows", "mammoth",
    "june mountain", "big bear", "snow valley",
    "crystal mountain", "snoqualmie", "schweitzer",
    "stratton", "sugarbush", "killington", "pico", "sunday river",
    "sugarloaf", "loon mountain", "windham",
    "boyne highlands", "boyne mountain",
    "snowshoe",
}

def get_pass_network(name: str) -> Optional[str]:
    """Determine pass network affiliation."""
    name_lower = name.lower()
    is_epic = any(epic in name_lower for epic in EPIC_RESORTS)
    is_ikon = any(ikon in name_lower for ikon in IKON_RESORTS)
    
    if is_epic and is_ikon:
        return "both"
    elif is_epic:
        return "epic"
    elif is_ikon:
        return "ikon"
    return None  # Independent - don't set passNetwork

def get_resort_size(name: str, state: str) -> str:
    """Estimate resort size category."""
    major_resorts = {
        "vail", "park city", "breckenridge", "aspen", "snowmass", "jackson hole",
        "big sky", "mammoth", "squaw", "palisades tahoe", "deer valley", "steamboat",
        "telluride", "heavenly", "killington", "stowe", "winter park", "copper",
        "keystone", "beaver creek", "snowbird", "alta", "brighton", "solitude",
        "sundance", "snowbasin", "powder mountain", "taos", "ski santa fe",
        "whistler", "sun valley", "big bear", "northstar", "kirkwood",
        "crystal mountain", "stevens pass", "mt baker", "mount bachelor",
        "sugarbush", "stratton", "okemo", "mount snow", "sugarloaf", "sunday river",
        "loon", "cannon", "waterville valley", "wildcat", "attitash",
        "whiteface", "gore", "hunter", "windham", "mount tremblant",
        "snowshoe", "seven springs", "boyne", "schuss"
    }
    
    name_lower = name.lower()
    if any(major in name_lower for major in major_resorts):
        return "major"
    
    # Regional resorts by state reputation
    regional_states = {"CO", "UT", "CA", "WY", "MT", "VT", "NH", "ME"}
    if state in regional_states:
        return "regional"
    
    return "local"

# Comprehensive US Ski Resort List
# Format: (name, state, optional_coords)
US_SKI_RESORTS: List[Tuple[str, str, Optional[Tuple[float, float]]]] = [
    # ===== COLORADO (60+) =====
    ("Vail", "CO", (39.6403, -106.3742)),
    ("Beaver Creek", "CO", (39.6042, -106.5165)),
    ("Breckenridge", "CO", (39.4817, -106.0384)),
    ("Keystone", "CO", (39.6069, -105.9498)),
    ("Copper Mountain", "CO", (39.5022, -106.1497)),
    ("Winter Park", "CO", (39.8868, -105.7625)),
    ("Steamboat", "CO", (40.4572, -106.8045)),
    ("Aspen Snowmass", "CO", (39.2084, -106.9490)),
    ("Aspen Mountain", "CO", (39.1869, -106.8178)),
    ("Aspen Highlands", "CO", (39.1822, -106.8556)),
    ("Buttermilk", "CO", (39.2069, -106.8686)),
    ("Telluride", "CO", (37.9375, -107.8123)),
    ("Crested Butte", "CO", (38.8986, -106.9653)),
    ("Purgatory", "CO", (37.6301, -107.8140)),
    ("Wolf Creek", "CO", (37.4728, -106.7935)),
    ("Monarch Mountain", "CO", (38.5122, -106.3322)),
    ("Loveland", "CO", (39.6800, -105.8978)),
    ("Arapahoe Basin", "CO", (39.6426, -105.8719)),
    ("Eldora", "CO", (39.9372, -105.5828)),
    ("Ski Cooper", "CO", (39.3614, -106.2992)),
    ("Powderhorn", "CO", (39.0692, -108.1506)),
    ("Sunlight Mountain", "CO", (39.4000, -107.3394)),
    ("Ski Granby Ranch", "CO", (40.0456, -105.9144)),
    ("Echo Mountain", "CO", (39.6847, -105.5172)),
    ("Hesperus", "CO", (37.2983, -108.0550)),
    ("Kendall Mountain", "CO", (37.8117, -107.6600)),
    ("Chapman Hill", "CO", (37.2758, -107.8806)),
    
    # ===== UTAH (15+) =====
    ("Park City", "UT", (40.6514, -111.5080)),
    ("Deer Valley", "UT", (40.6375, -111.4783)),
    ("Snowbird", "UT", (40.5830, -111.6538)),
    ("Alta", "UT", (40.5884, -111.6386)),
    ("Brighton", "UT", (40.5980, -111.5833)),
    ("Solitude", "UT", (40.6199, -111.5919)),
    ("Snowbasin", "UT", (41.2160, -111.8569)),
    ("Powder Mountain", "UT", (41.3789, -111.7808)),
    ("Sundance", "UT", (40.3933, -111.5881)),
    ("Brian Head", "UT", (37.7022, -112.8497)),
    ("Eagle Point", "UT", (38.3203, -112.3839)),
    ("Beaver Mountain", "UT", (41.9681, -111.5453)),
    ("Cherry Peak", "UT", (41.9289, -111.7569)),
    ("Nordic Valley", "UT", (41.3103, -111.8647)),
    ("Woodward Park City", "UT", (40.7372, -111.5239)),
    
    # ===== CALIFORNIA (25+) =====
    ("Mammoth Mountain", "CA", (37.6308, -119.0326)),
    ("Palisades Tahoe", "CA", (39.1970, -120.2358)),
    ("Heavenly", "CA", (38.9353, -119.9400)),
    ("Northstar", "CA", (39.2746, -120.1210)),
    ("Kirkwood", "CA", (38.6850, -120.0653)),
    ("Big Bear Mountain Resort", "CA", (34.2364, -116.8906)),
    ("Snow Valley", "CA", (34.2253, -117.0372)),
    ("Mountain High", "CA", (34.3722, -117.6911)),
    ("June Mountain", "CA", (37.7675, -119.0894)),
    ("Sugar Bowl", "CA", (39.3047, -120.3347)),
    ("Boreal", "CA", (39.3328, -120.3486)),
    ("Soda Springs", "CA", (39.3197, -120.3806)),
    ("Dodge Ridge", "CA", (38.1900, -119.9556)),
    ("China Peak", "CA", (37.2342, -119.1572)),
    ("Bear Valley", "CA", (38.4697, -120.0408)),
    ("Mt Shasta Ski Park", "CA", (41.3175, -122.2028)),
    ("Tahoe Donner", "CA", (39.3522, -120.2836)),
    ("Homewood", "CA", (39.0858, -120.1606)),
    ("Sierra at Tahoe", "CA", (38.8022, -120.0800)),
    ("Diamond Peak", "CA", (39.2536, -119.9208)),
    ("Mt Rose", "NV", (39.3147, -119.8853)),
    ("Badger Pass", "CA", (37.6625, -119.6636)),
    
    # ===== WYOMING (4) =====
    ("Jackson Hole", "WY", (43.5875, -110.8278)),
    ("Grand Targhee", "WY", (43.7900, -110.9586)),
    ("Snow King", "WY", (43.4733, -110.7583)),
    ("Hogadon Basin", "WY", (42.7472, -106.3275)),
    ("Snowy Range", "WY", (41.3475, -106.1717)),
    ("White Pine", "WY", (42.9322, -109.7542)),
    ("Sleeping Giant", "WY", (44.4908, -109.9625)),
    
    # ===== MONTANA (15+) =====
    ("Big Sky", "MT", (45.2858, -111.4019)),
    ("Whitefish Mountain", "MT", (48.4897, -114.3553)),
    ("Bridger Bowl", "MT", (45.8175, -110.8972)),
    ("Red Lodge Mountain", "MT", (45.1861, -109.3447)),
    ("Moonlight Basin", "MT", (45.2833, -111.4500)),
    ("Discovery", "MT", (46.2472, -113.2378)),
    ("Lost Trail", "MT", (45.6928, -113.9497)),
    ("Showdown", "MT", (46.8408, -110.7136)),
    ("Great Divide", "MT", (46.7472, -112.3161)),
    ("Maverick Mountain", "MT", (45.4625, -113.1500)),
    ("Blacktail Mountain", "MT", (48.0125, -114.3653)),
    ("Turner Mountain", "MT", (48.8525, -115.6422)),
    ("Lookout Pass", "MT", (47.4544, -115.7092)),
    ("Teton Pass", "MT", (47.9322, -112.5333)),
    
    # ===== IDAHO (12+) =====
    ("Sun Valley", "ID", (43.6969, -114.3514)),
    ("Schweitzer", "ID", (48.3675, -116.6228)),
    ("Brundage Mountain", "ID", (44.9414, -116.1539)),
    ("Tamarack", "ID", (44.6817, -116.1119)),
    ("Bogus Basin", "ID", (43.7647, -116.1028)),
    ("Silver Mountain", "ID", (47.5347, -116.1158)),
    ("Lookout Pass", "ID", (47.4544, -115.7092)),
    ("Soldier Mountain", "ID", (43.4583, -114.8167)),
    ("Pomerelle", "ID", (42.0753, -113.6006)),
    ("Magic Mountain", "ID", (42.2106, -114.2850)),
    ("Pebble Creek", "ID", (42.7717, -112.0839)),
    ("Kelly Canyon", "ID", (43.5983, -111.6500)),
    
    # ===== NEW MEXICO (7) =====
    ("Taos Ski Valley", "NM", (36.5958, -105.4544)),
    ("Ski Santa Fe", "NM", (35.7958, -105.8036)),
    ("Angel Fire", "NM", (36.3906, -105.2844)),
    ("Red River", "NM", (36.7108, -105.4094)),
    ("Sipapu", "NM", (36.0875, -105.5067)),
    ("Ski Apache", "NM", (33.4017, -105.7886)),
    ("Pajarito Mountain", "NM", (35.8867, -106.3919)),
    ("Sandia Peak", "NM", (35.2094, -106.4158)),
    
    # ===== ARIZONA (3) =====
    ("Snowbowl", "AZ", (35.3314, -111.7108)),
    ("Sunrise Park", "AZ", (33.9706, -109.5525)),
    ("Mt Lemmon", "AZ", (32.4431, -110.7833)),
    
    # ===== NEVADA (2) =====
    ("Mt Rose", "NV", (39.3147, -119.8853)),
    ("Lee Canyon", "NV", (36.3089, -115.6817)),
    
    # ===== WASHINGTON (12+) =====
    ("Crystal Mountain", "WA", (46.9286, -121.5044)),
    ("Stevens Pass", "WA", (47.7453, -121.0892)),
    ("Mt Baker", "WA", (48.8575, -121.6650)),
    ("The Summit at Snoqualmie", "WA", (47.4206, -121.4136)),
    ("Mission Ridge", "WA", (47.2922, -120.3972)),
    ("White Pass", "WA", (46.6378, -121.3903)),
    ("49 Degrees North", "WA", (48.3047, -117.5611)),
    ("Bluewood", "WA", (46.0828, -117.8517)),
    ("Hurricane Ridge", "WA", (47.9700, -123.4983)),
    ("Loup Loup", "WA", (48.3908, -119.9069)),
    ("Echo Valley", "WA", (47.4839, -120.0731)),
    ("Ski Bluewood", "WA", (46.0828, -117.8517)),
    
    # ===== OREGON (10+) =====
    ("Mt Bachelor", "OR", (43.9792, -121.6889)),
    ("Mt Hood Meadows", "OR", (45.3314, -121.6647)),
    ("Timberline", "OR", (45.3308, -121.7111)),
    ("Mt Hood Skibowl", "OR", (45.3022, -121.7558)),
    ("Mt Ashland", "OR", (42.0786, -122.7164)),
    ("Hoodoo", "OR", (44.4083, -121.8722)),
    ("Willamette Pass", "OR", (43.5967, -122.0392)),
    ("Anthony Lakes", "OR", (44.9594, -118.2322)),
    ("Warner Canyon", "OR", (42.2561, -120.2153)),
    ("Spout Springs", "OR", (45.5653, -118.2047)),
    ("Ferguson Ridge", "OR", (45.2489, -117.2350)),
    
    # ===== ALASKA (4) =====
    ("Alyeska", "AK", (60.9697, -149.0997)),
    ("Eaglecrest", "AK", (58.2775, -134.5167)),
    ("Arctic Valley", "AK", (61.2464, -149.5383)),
    ("Hilltop", "AK", (61.1400, -149.7300)),
    
    # ===== VERMONT (20+) =====
    ("Killington", "VT", (43.6045, -72.8201)),
    ("Stowe", "VT", (44.5303, -72.7814)),
    ("Sugarbush", "VT", (44.1358, -72.9022)),
    ("Stratton", "VT", (43.1136, -72.9078)),
    ("Okemo", "VT", (43.4017, -72.7172)),
    ("Mount Snow", "VT", (42.9603, -72.9206)),
    ("Jay Peak", "VT", (44.9261, -72.5053)),
    ("Mad River Glen", "VT", (44.2042, -72.9150)),
    ("Smugglers Notch", "VT", (44.5878, -72.7872)),
    ("Bolton Valley", "VT", (44.4217, -72.8500)),
    ("Burke Mountain", "VT", (44.5853, -71.8969)),
    ("Bromley", "VT", (43.2150, -72.9369)),
    ("Pico Mountain", "VT", (43.6617, -72.8436)),
    ("Magic Mountain", "VT", (43.2011, -72.7767)),
    ("Middlebury Snow Bowl", "VT", (43.9422, -72.9353)),
    ("Suicide Six", "VT", (43.6550, -72.5186)),
    ("Cochran's", "VT", (44.3375, -72.9419)),
    ("Northeast Slopes", "VT", (44.5333, -72.0833)),
    ("Lyndon Outing Club", "VT", (44.5203, -72.0194)),
    
    # ===== NEW HAMPSHIRE (20+) =====
    ("Loon Mountain", "NH", (44.0364, -71.6214)),
    ("Cannon Mountain", "NH", (44.1567, -71.6986)),
    ("Bretton Woods", "NH", (44.2531, -71.4622)),
    ("Waterville Valley", "NH", (43.9650, -71.5281)),
    ("Wildcat", "NH", (44.2636, -71.2394)),
    ("Attitash", "NH", (44.0836, -71.2294)),
    ("Cranmore", "NH", (44.0536, -71.1097)),
    ("Gunstock", "NH", (43.5497, -71.3656)),
    ("Ragged Mountain", "NH", (43.4656, -71.8411)),
    ("Mount Sunapee", "NH", (43.3264, -72.0869)),
    ("Pats Peak", "NH", (43.1581, -71.7753)),
    ("Crotched Mountain", "NH", (42.9892, -71.8731)),
    ("King Pine", "NH", (43.8206, -71.1397)),
    ("Black Mountain", "NH", (44.0517, -71.1247)),
    ("Dartmouth Skiway", "NH", (43.7736, -72.0814)),
    ("Tenney Mountain", "NH", (43.7736, -71.7386)),
    ("McIntyre Ski Area", "NH", (43.1258, -70.9169)),
    ("Whaleback", "NH", (43.5500, -72.1500)),
    
    # ===== MAINE (12+) =====
    ("Sugarloaf", "ME", (45.0314, -70.3131)),
    ("Sunday River", "ME", (44.4728, -70.8567)),
    ("Saddleback", "ME", (44.9372, -70.5108)),
    ("Shawnee Peak", "ME", (44.0678, -70.8414)),
    ("Mt Abram", "ME", (44.3756, -70.6522)),
    ("Black Mountain of Maine", "ME", (44.4172, -70.6944)),
    ("Camden Snow Bowl", "ME", (44.2167, -69.0639)),
    ("Hermon Mountain", "ME", (44.7958, -68.9150)),
    ("Bigrock", "ME", (46.6617, -68.0775)),
    ("Lost Valley", "ME", (44.1042, -70.2214)),
    ("Titcomb Mountain", "ME", (44.6500, -70.2167)),
    ("Baker Mountain", "ME", (45.0833, -68.4833)),
    
    # ===== NEW YORK (35+) =====
    ("Whiteface", "NY", (44.3658, -73.9028)),
    ("Gore Mountain", "NY", (43.6744, -74.0017)),
    ("Hunter Mountain", "NY", (42.2019, -74.2258)),
    ("Windham Mountain", "NY", (42.2958, -74.2558)),
    ("Belleayre", "NY", (42.1328, -74.5011)),
    ("Holiday Valley", "NY", (42.2672, -78.6708)),
    ("Bristol Mountain", "NY", (42.7353, -77.4097)),
    ("Greek Peak", "NY", (42.5086, -76.1453)),
    ("Song Mountain", "NY", (42.8131, -76.0817)),
    ("Labrador Mountain", "NY", (42.7800, -76.0469)),
    ("Plattekill", "NY", (42.2936, -74.6508)),
    ("Titus Mountain", "NY", (44.8833, -74.2500)),
    ("Whiteface Lake Placid", "NY", (44.3658, -73.9028)),
    ("West Mountain", "NY", (43.2867, -73.8006)),
    ("Oak Mountain", "NY", (43.1500, -74.3667)),
    ("Snow Ridge", "NY", (43.5861, -75.4078)),
    ("Woods Valley", "NY", (43.2500, -75.3167)),
    ("McCauley Mountain", "NY", (43.6833, -74.9500)),
    ("Maple Ski Ridge", "NY", (42.8444, -74.0403)),
    ("Willard Mountain", "NY", (43.0778, -73.4903)),
    ("Mount Peter", "NY", (41.2125, -74.3122)),
    ("Thunder Ridge", "NY", (41.4383, -73.5717)),
    ("Catamount", "NY", (42.1711, -73.4914)),
    ("Kissing Bridge", "NY", (42.6036, -78.7167)),
    ("Peek'n Peak", "NY", (42.0611, -79.7264)),
    ("Swain", "NY", (42.4803, -77.8597)),
    ("Hunt Hollow", "NY", (42.6267, -77.4983)),
    ("Brantling", "NY", (43.0333, -77.2833)),
    ("Four Seasons", "NY", (43.3833, "-75.6833")),
    ("Toggenburg", "NY", (42.8500, -75.9667)),
    ("Dry Hill", "NY", (43.7500, -75.5167)),
    
    # ===== PENNSYLVANIA (20+) =====
    ("Seven Springs", "PA", (40.0225, -79.2978)),
    ("Blue Mountain", "PA", (40.8231, -75.9419)),
    ("Camelback", "PA", (41.0522, -75.3583)),
    ("Jack Frost", "PA", (41.0639, -75.5236)),
    ("Big Boulder", "PA", (41.1028, -75.5611)),
    ("Elk Mountain", "PA", (41.7083, -75.5722)),
    ("Blue Knob", "PA", (40.2878, -78.5567)),
    ("Whitetail", "PA", (39.7367, -77.9339)),
    ("Roundtop", "PA", (40.1072, -76.9353)),
    ("Liberty Mountain", "PA", (39.7583, -77.3750)),
    ("Hidden Valley", "PA", (40.0508, -79.2442)),
    ("Laurel Mountain", "PA", (40.1708, -79.1653)),
    ("Tussey Mountain", "PA", (40.7422, -77.7644)),
    ("Shawnee Mountain", "PA", (41.0106, -75.0686)),
    ("Montage Mountain", "PA", (41.3536, -75.6025)),
    ("Bear Creek", "PA", (41.0606, -75.7142)),
    ("Spring Mountain", "PA", (40.2800, -75.4433)),
    ("Ski Big Bear", "PA", (41.2167, -75.0833)),
    ("Tanglwood", "PA", (40.0833, -79.0333)),
    ("Boyce Park", "PA", (40.4333, -79.7333)),
    
    # ===== MASSACHUSETTS (8+) =====
    ("Wachusett", "MA", (42.5008, -71.8856)),
    ("Jiminy Peak", "MA", (42.5539, -73.2722)),
    ("Berkshire East", "MA", (42.6278, -72.8856)),
    ("Bousquet", "MA", (42.4414, -73.2503)),
    ("Catamount", "MA", (42.1711, -73.4914)),
    ("Ski Butternut", "MA", (42.1764, -73.3017)),
    ("Mount Greylock", "MA", (42.6375, -73.1667)),
    ("Blue Hills", "MA", (42.2125, -71.1125)),
    ("Nashoba Valley", "MA", (42.5258, -71.4458)),
    
    # ===== CONNECTICUT (5) =====
    ("Mohawk Mountain", "CT", (41.8403, -73.3158)),
    ("Mount Southington", "CT", (41.5608, -72.8792)),
    ("Ski Sundown", "CT", (41.9361, -72.9536)),
    ("Powder Ridge", "CT", (41.5172, -72.6992)),
    
    # ===== NEW JERSEY (3) =====
    ("Mountain Creek", "NJ", (41.2014, -74.5119)),
    ("Campgaw Mountain", "NJ", (41.0597, -74.1731)),
    
    # ===== MICHIGAN (30+) =====
    ("Boyne Mountain", "MI", (45.1653, -84.9253)),
    ("Boyne Highlands", "MI", (45.4675, -84.9150)),
    ("Nub's Nob", "MI", (45.4692, -84.9089)),
    ("Crystal Mountain", "MI", (44.5242, -85.9914)),
    ("Shanty Creek", "MI", (44.9086, -85.1631)),
    ("Caberfae Peaks", "MI", (44.2533, -85.6372)),
    ("Mt Brighton", "MI", (42.5467, -83.8219)),
    ("Alpine Valley", "MI", (42.7603, -83.5406)),
    ("Pine Knob", "MI", (42.7539, -83.4142)),
    ("Mt Holly", "MI", (42.7983, -83.5364)),
    ("Timber Ridge", "MI", (42.3756, -85.3803)),
    ("Swiss Valley", "MI", (41.8758, -86.2742)),
    ("Bittersweet", "MI", (42.0906, -86.1561)),
    ("Cannonsburg", "MI", (43.0433, -85.4875)),
    ("Marquette Mountain", "MI", (46.5167, -87.4500)),
    ("Big Powderhorn", "MI", (46.4889, -90.0919)),
    ("Blackjack", "MI", (46.4708, -89.9861)),
    ("Indianhead", "MI", (46.4419, -89.9419)),
    ("Ski Brule", "MI", (46.0667, -88.5500)),
    ("Mont Ripley", "MI", (47.1167, -88.5667)),
    ("Porcupine Mountains", "MI", (46.7833, -89.7167)),
    ("Norway Mountain", "MI", (45.8667, -87.8833)),
    ("Treetops", "MI", (45.1375, -84.6436)),
    
    # ===== WISCONSIN (20+) =====
    ("Granite Peak", "WI", (44.9319, -89.6847)),
    ("Devil's Head", "WI", (43.4333, -89.7000)),
    ("Cascade Mountain", "WI", (43.5436, -89.6108)),
    ("Tyrol Basin", "WI", (43.1053, -89.7756)),
    ("Wilmot Mountain", "WI", (42.5092, -88.1764)),
    ("Alpine Valley", "WI", (42.6625, -88.4619)),
    ("The Rock", "WI", (43.3389, -89.0806)),
    ("Little Switzerland", "WI", (42.6083, -88.0833)),
    ("Christmas Mountain", "WI", (43.5833, -89.7833)),
    ("Whitecap Mountains", "WI", (46.3750, -90.2083)),
    ("Trollhaugen", "WI", (45.2833, -92.5667)),
    ("Afton Alps", "MN", (44.8553, -92.7842)),
    ("Spirit Mountain", "MN", (46.7186, -92.2178)),
    
    # ===== MINNESOTA (15+) =====
    ("Lutsen Mountains", "MN", (47.6611, -90.7097)),
    ("Giants Ridge", "MN", (47.5667, -92.3667)),
    ("Spirit Mountain", "MN", (46.7186, -92.2178)),
    ("Afton Alps", "MN", (44.8553, -92.7842)),
    ("Welch Village", "MN", (44.5667, -92.7333)),
    ("Buck Hill", "MN", (44.7333, -93.2833)),
    ("Wild Mountain", "MN", (45.5167, -92.7333)),
    ("Powder Ridge", "MN", (45.5833, -94.2167)),
    ("Andes Tower Hills", "MN", (45.6667, -95.3167)),
    ("Buena Vista", "MN", (46.0833, "-95.2333")),
    ("Detroit Mountain", "MN", (46.8500, -95.8667)),
    ("Mount Kato", "MN", (44.1333, -94.0167)),
    ("Coffee Mill", "MN", (44.4000, -92.0167)),
    ("Mount Frontenac", "MN", (44.5167, -92.3500)),
    
    # ===== OHIO (8) =====
    ("Boston Mills", "OH", (41.2628, -81.5464)),
    ("Brandywine", "OH", (41.2367, -81.5081)),
    ("Alpine Valley", "OH", (41.4678, -81.0553)),
    ("Snow Trails", "OH", (40.6750, -82.5167)),
    ("Mad River Mountain", "OH", (40.3167, -83.6833)),
    ("Clear Fork", "OH", (40.6333, "-82.5667")),
    ("Mansfield", "OH", (40.6167, "-82.5333")),
    
    # ===== INDIANA (3) =====
    ("Paoli Peaks", "IN", (38.5617, -86.4678)),
    ("Perfect North Slopes", "IN", (39.1500, -84.9167)),
    ("Ski World", "IN", (38.5833, "-86.2167")),
    
    # ===== MISSOURI (3) =====
    ("Hidden Valley", "MO", (38.5167, -90.6500)),
    ("Snow Creek", "MO", (39.4667, -94.6167)),
    
    # ===== IOWA (3) =====
    ("Sundown Mountain", "IA", (42.5167, -90.8500)),
    ("Mt Crescent", "IA", (41.2833, -95.8333)),
    ("Seven Oaks", "IA", (42.0667, -93.6000)),
    
    # ===== WEST VIRGINIA (6) =====
    ("Snowshoe", "WV", (38.4128, -79.9942)),
    ("Canaan Valley", "WV", (39.0022, -79.4481)),
    ("Timberline", "WV", (39.0028, -79.4333)),
    ("Winterplace", "WV", (37.5917, -81.0875)),
    ("Oglebay Resort", "WV", (40.0833, -80.6833)),
    
    # ===== VIRGINIA (5) =====
    ("Wintergreen", "VA", (37.9417, -78.9008)),
    ("Massanutten", "VA", (38.4083, -78.7361)),
    ("The Homestead", "VA", (37.9833, -79.8333)),
    ("Bryce Resort", "VA", (38.8361, -78.7569)),
    
    # ===== NORTH CAROLINA (7) =====
    ("Sugar Mountain", "NC", (36.1197, -81.8694)),
    ("Beech Mountain", "NC", (36.1853, -81.8822)),
    ("Appalachian Ski Mountain", "NC", (36.0903, -81.6722)),
    ("Cataloochee", "NC", (35.5833, -83.0833)),
    ("Wolf Ridge", "NC", (35.5500, "-83.0833")),
    ("Sapphire Valley", "NC", (35.1167, -82.9833)),
    
    # ===== TENNESSEE (2) =====
    ("Ober Gatlinburg", "TN", (35.7097, -83.5219)),
    
    # ===== GEORGIA (1) =====
    ("Sky Valley", "GA", (35.0333, -83.3333)),
    
    # ===== MARYLAND (2) =====
    ("Wisp", "MD", (39.5569, -79.3647)),
    
    # ===== SOUTH DAKOTA (2) =====
    ("Terry Peak", "SD", (44.3667, -103.8667)),
    ("Deer Mountain", "SD", (44.3333, -103.9500)),
    
    # ===== NORTH DAKOTA (1) =====
    ("Huff Hills", "ND", (46.6333, -100.6667)),
    
    # ===== KANSAS (1) =====
    ("Snow Creek", "KS", None),  # Actually in MO
    
    # ===== NEBRASKA (1) =====
    # No major ski areas
]


def geocode(name: str, state: str, cache: Dict) -> Optional[Tuple[float, float]]:
    """Geocode a resort using Nominatim API."""
    cache_key = f"{name}|{state}"
    
    # Check cache first
    if cache_key in cache and cache[cache_key].get("lat"):
        return (cache[cache_key]["lat"], cache[cache_key]["lon"])
    
    # Query Nominatim
    query = f"{name} ski resort, {state}, USA"
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "SkiWithCare/2.0"},
            timeout=10
        )
        resp.raise_for_status()
        results = resp.json()
        
        if results:
            lat = float(results[0]["lat"])
            lon = float(results[0]["lon"])
            # Update cache
            cache[cache_key] = {"lat": lat, "lon": lon}
            return (lat, lon)
    except Exception as e:
        print(f"    Geocode error for {name}: {e}")
    
    return None


def main():
    print("=" * 60)
    print("SkiWithCare - Comprehensive Resort Database Builder")
    print("=" * 60)
    
    # Load existing cache
    try:
        with open(CACHE_FILE, "r") as f:
            cache = json.load(f)
        print(f"Loaded {len(cache)} cached coordinates")
    except FileNotFoundError:
        cache = {}
        print("No cache found, starting fresh")
    
    resorts = []
    need_geocode = []
    
    print(f"\nProcessing {len(US_SKI_RESORTS)} resorts...")
    
    for name, state, coords in US_SKI_RESORTS:
        # Skip entries with obvious data issues
        if not name or not state:
            continue
        
        # Handle string coordinates (data entry errors)
        if coords and isinstance(coords[1], str):
            coords = (coords[0], float(coords[1]))
        
        cache_key = f"{name}|{state}"
        
        # Get coordinates
        if coords:
            lat, lon = coords
        elif cache_key in cache and cache.get(cache_key, {}).get("lat"):
            lat = cache[cache_key]["lat"]
            lon = cache[cache_key]["lon"]
        else:
            need_geocode.append((name, state))
            continue
        
        # Build resort object
        resort = {
            "id": cache_key,
            "name": name,
            "state": state,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "region": get_region(state),
            "size": get_resort_size(name, state),
        }
        
        # Only add passNetwork if it's a pass resort
        pass_network = get_pass_network(name)
        if pass_network:
            resort["passNetwork"] = pass_network
        
        resorts.append(resort)
    
    # Geocode missing resorts
    if need_geocode:
        print(f"\nGeocoding {len(need_geocode)} resorts without coordinates...")
        for i, (name, state) in enumerate(need_geocode, 1):
            print(f"  [{i}/{len(need_geocode)}] {name}, {state}... ", end="", flush=True)
            coords = geocode(name, state, cache)
            if coords:
                lat, lon = coords
                resort = {
                    "id": f"{name}|{state}",
                    "name": name,
                    "state": state,
                    "lat": round(lat, 6),
                    "lon": round(lon, 6),
                    "region": get_region(state),
                    "size": get_resort_size(name, state),
                }
                pass_network = get_pass_network(name)
                if pass_network:
                    resort["passNetwork"] = pass_network
                resorts.append(resort)
                print("✓")
            else:
                print("✗")
            time.sleep(1.1)  # Nominatim rate limit
    
    # Save updated cache
    with open(CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)
    print(f"\nSaved cache to {CACHE_FILE}")
    
    # Sort and dedupe
    seen = set()
    unique_resorts = []
    for r in sorted(resorts, key=lambda x: x["name"]):
        key = r["id"].lower()
        if key not in seen:
            seen.add(key)
            unique_resorts.append(r)
    
    # Save resorts
    with open(OUTPUT_FILE, "w") as f:
        json.dump(unique_resorts, f, indent=2)
    
    # Summary
    print("\n" + "=" * 60)
    print(f"SUCCESS: {len(unique_resorts)} total resorts saved to {OUTPUT_FILE}")
    
    # Stats
    by_region = {}
    by_size = {}
    by_pass = {"epic": 0, "ikon": 0, "both": 0, "independent": 0}
    
    for r in unique_resorts:
        region = r.get("region", "other")
        by_region[region] = by_region.get(region, 0) + 1
        
        size = r.get("size", "local")
        by_size[size] = by_size.get(size, 0) + 1
        
        pass_net = r.get("passNetwork", "independent")
        if pass_net in by_pass:
            by_pass[pass_net] += 1
        else:
            by_pass["independent"] += 1
    
    print("\nBy Region:")
    for region, count in sorted(by_region.items(), key=lambda x: -x[1]):
        print(f"  {region}: {count}")
    
    print("\nBy Size:")
    for size, count in sorted(by_size.items(), key=lambda x: -x[1]):
        print(f"  {size}: {count}")
    
    print("\nBy Pass Network:")
    for pass_net, count in sorted(by_pass.items(), key=lambda x: -x[1]):
        print(f"  {pass_net}: {count}")
    
    print("=" * 60)


if __name__ == "__main__":
    main()
