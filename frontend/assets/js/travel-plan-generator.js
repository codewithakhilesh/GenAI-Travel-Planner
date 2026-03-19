function saveTrip(tripData) {
  const trips = JSON.parse(localStorage.getItem("goyatra_trips") || "[]");
  trips.push(tripData);
  localStorage.setItem("goyatra_trips", JSON.stringify(trips));
}



// assets/js/travel-plan-generator.js
(function attachTravelPlanGenerator(global) {
  "use strict";

  const STORAGE_KEY = "goyatra_last_plan";
  const FIXED_FROM = "Nagpur (NGP)";
  const SUPPORTED_DESTINATIONS = ["Goa", "Manali", "Leh-Ladakh", "Ooty"];

const DEST_IMAGES = {
  Goa: "assets/images/Goa/goa-poster.JPEG",
  Manali: "assets/images/Manali/manali-poster.JPEG",
  "Leh-Ladakh": "assets/images/Leh-ladakh/leh-poster.JPEG",
  "Leh Ladakh": "assets/images/Leh-ladakh/leh-poster.JPEG", // ⭐ important
  Ooty: "assets/images/Ooty/ooty-poster.JPEG"
};

  const ROUTE_DATA = {
    Goa: {
      distanceKm: 1110,
      timeByMode: {
        flight: "2h 10m + airport transfer",
        train: "22h 30m",
        car: "18h 30m",
        bike: "22h 00m"
      },
      hoursByMode: {
        flight: 2.2,
        train: 22.5,
        car: 18.5,
        bike: 22
      }
    },
    Manali: {
      distanceKm: 1570,
      timeByMode: {
        flight: "3h 40m (1 stop) + 2h road transfer",
        train: "29h 30m + 3h road transfer",
        car: "27h 00m",
        bike: "32h 00m"
      },
      hoursByMode: {
        flight: 3.7,
        train: 29.5,
        car: 27,
        bike: 32
      }
    },
    "Leh-Ladakh": {
      distanceKm: 2480,
      timeByMode: {
        flight: "4h 20m (1 stop) + city transfer",
        train: "No direct train (train + road: 44h+)",
        car: "42h 00m",
        bike: "48h 00m"
      },
      hoursByMode: {
        flight: 4.3,
        train: 44,
        car: 42,
        bike: 48
      }
    },
    Ooty: {
      distanceKm: 1230,
      timeByMode: {
        flight: "3h 00m (1 stop) + 3h road transfer",
        train: "24h 30m + 4h road transfer",
        car: "21h 30m",
        bike: "25h 00m"
      },
      hoursByMode: {
        flight: 3,
        train: 24.5,
        car: 21.5,
        bike: 25
      }
    }
  };

  const FLIGHTS_DATA = {
    Goa: [
      { airline: "IndiGo 6E", time: "06:55 - 09:05", price: 4200 },
      { airline: "Air India", time: "10:20 - 12:40", price: 5100 },
      { airline: "Akasa Air", time: "14:10 - 16:20", price: 4600 },
      { airline: "SpiceJet", time: "18:05 - 20:25", price: 5400 }
    ],
    Manali: [
      { airline: "IndiGo 6E", time: "07:15 - 10:55", price: 6800 },
      { airline: "Vistara", time: "11:35 - 15:10", price: 7600 },
      { airline: "Air India", time: "15:25 - 19:05", price: 7200 },
      { airline: "SpiceJet", time: "19:10 - 22:45", price: 6500 }
    ],
    "Leh-Ladakh": [
      { airline: "IndiGo 6E", time: "06:20 - 10:35", price: 8900 },
      { airline: "Air India", time: "09:45 - 14:05", price: 9800 },
      { airline: "Vistara", time: "13:30 - 17:55", price: 10600 },
      { airline: "Akasa Air", time: "18:00 - 22:20", price: 9400 }
    ],
    Ooty: [
      { airline: "IndiGo 6E", time: "06:40 - 09:35", price: 5200 },
      { airline: "Air India", time: "10:15 - 13:10", price: 6100 },
      { airline: "Akasa Air", time: "14:35 - 17:25", price: 5600 },
      { airline: "SpiceJet", time: "19:00 - 21:55", price: 5900 }
    ]
  };

  const TRAINS_DATA = {
    Goa: [
      { name: "Nagpur - Madgaon Express", number: "12143", time: "21h 55m", price: 1450 },
      { name: "Vidarbha Konkan SF", number: "22119", time: "23h 10m", price: 1680 },
      { name: "Goa Sampark Kranti", number: "12449", time: "22h 05m", price: 1820 },
      { name: "Konkan Special", number: "01129", time: "24h 20m", price: 1320 }
    ],
    Manali: [
      { name: "Nagpur - Chandigarh SF", number: "22685", time: "27h 40m", price: 2050 },
      { name: "Dakshin Uttar Link", number: "12687", time: "30h 10m", price: 1780 },
      { name: "Himachal Connect", number: "12057", time: "29h 15m", price: 2240 },
      { name: "Northern Hills Express", number: "04011", time: "31h 00m", price: 1900 }
    ],
    "Leh-Ladakh": [
      { name: "Nagpur - Jammu Tawi SF", number: "12491", time: "35h 20m", price: 2550 },
      { name: "Maharashtra Kashmir Link", number: "22121", time: "37h 10m", price: 2320 },
      { name: "Jammu Mail Connection", number: "01077", time: "39h 05m", price: 2100 },
      { name: "North Frontier Express", number: "12219", time: "36h 50m", price: 2480 }
    ],
    Ooty: [
      { name: "Nagpur - Coimbatore SF", number: "22644", time: "23h 35m", price: 1700 },
      { name: "Nilgiri Link Express", number: "12690", time: "24h 50m", price: 1520 },
      { name: "Western Ghats Superfast", number: "11013", time: "25h 10m", price: 1620 },
      { name: "Tamil Nadu Mail", number: "12621", time: "24h 30m", price: 1840 }
    ]
  };

  const PLACES_DATA = {
    Goa: [
      { name: "Baga Beach", img: "assets/images/goa/goa-BagaBeach.jpeg", note: "Watersports and lively beach shacks.", bestTime: "evening (sunset view chaan rahil)" },
      { name: "Calangute Beach", img: "assets/images/goa/goa-CalanguteBeach.jpeg", note: "Longest beach stretch with cafes.", bestTime: "early morning or sunset" },
      { name: "Fort Aguada", img: "assets/images/goa/goa-FortAguada.jpeg", note: "Historic fort with sea panorama.", bestTime: "late afternoon" },
      { name: "Dudhsagar Falls", img: "assets/images/goa/goa-Dudhsagar Falls.jpeg", note: "Powerful waterfall and jeep trails.", bestTime: "morning (post-monsoon)" },
      { name: "Basilica of Bom Jesus", img: "assets/images/goa/goa-Basilica of Bom Jesus.jpeg", note: "UNESCO church and old Goa heritage.", bestTime: "morning (less crowd)" },
      { name: "Anjuna Flea Market", img: "assets/images/goa/goa-Anjuna Flea Market.jpeg", note: "Street shopping and local music vibe.", bestTime: "evening (Wednesday best)" },
      { name: "Chapora Fort", img: "assets/images/goa/goa-Chapora Fort.jpeg", note: "Cliff fort for iconic sunset views.", bestTime: "evening" },
      { name: "Vagator Beach", img: "assets/images/goa/goa-Vagator Beach.jpeg", note: "Red cliffs and calmer beach pockets.", bestTime: "sunset hour" },
      { name: "Candolim Beach", img: "assets/images/goa/goa-Candolim Beach.jpeg", note: "Relaxed shoreline and less crowd.", bestTime: "morning walk" },
      { name: "Fontainhas Latin Quarter", img: "assets/images/goa/goa-Fontainhas Latin Quarter.jpeg", note: "Colorful heritage lanes and cafes.", bestTime: "late afternoon" }
    ],
    Manali: [
      { name: "Solang Valley", img: "assets/images/Manali/manali-Solang-Valley.jpeg", note: "Adventure zone for paragliding and ropeway.", bestTime: "morning (clear skies)" },
      { name: "Hadimba Temple", img: "assets/images/Manali/manali-Hadimba.jpeg", note: "Ancient cedar-forest temple.", bestTime: "early morning" },
      { name: "Old Manali", img: "assets/images/Manali/manali-Old-Manali.jpeg", note: "Cafe lanes and live music spots.", bestTime: "evening" },
      { name: "Mall Road", img: "assets/images/Manali/manali-Mall-Road.jpeg", note: "Shopping, food, and city buzz.", bestTime: "evening (street lights chaan rahil)" },
      { name: "Atal Tunnel", img: "assets/images/Manali/manali-Atal-Tunnel.jpeg", note: "Scenic high-altitude drive.", bestTime: "daytime" },
      { name: "Rohtang Pass Viewpoint", img: "assets/images/Manali/manali-Rohtang-Pass-Viewpoint.jpeg", note: "Snow peaks and panoramic valley views.", bestTime: "morning" },
      { name: "Jogini Falls", img: "assets/images/Manali/manali-Jogini-Falls.jpeg", note: "Short trek to a serene waterfall.", bestTime: "morning" },
      { name: "Manu Temple", img: "assets/images/Manali/ManuTemple.jpeg", note: "Quiet hill temple in old quarter.", bestTime: "morning" },
      { name: "Naggar Castle", img: "assets/images/Manali/manali-Naggar-Castle.jpeg", note: "Wood-stone architecture and valley view.", bestTime: "afternoon" },
      { name: "Sissu Valley", img: "assets/images/Manali/manali-Sissu-Valley.jpeg", note: "Riverside picnic and mountain views.", bestTime: "daytime" }
    ],
    "Leh-Ladakh": [
      { name: "Shanti Stupa", img: "assets/images/Leh-ladakh/p-Shanti-Stupa.jpg", note: "Hilltop stupa with Leh city panorama.", bestTime: "sunrise or sunset" },
      { name: "Leh Palace", img: "assets/images/Leh-ladakh/p-Leh-Palace.jpg", note: "Historic palace and old town skyline.", bestTime: "afternoon" },
      { name: "Magnetic Hill", img: "assets/images/Leh-ladakh/p-Magnetic-Hill.jpg", note: "Optical hill illusion on Leh highway.", bestTime: "daytime" },
      { name: "Pangong Lake", img: "assets/images/Leh-ladakh/p-Pangong-Lake.jpg", note: "High-altitude blue lake and dramatic ranges.", bestTime: "morning (blue water chaan rahil)" },
      { name: "Nubra Valley", img: "assets/images/Leh-ladakh/p-Nubra-Valley.jpg", note: "Sand dunes, double-humped camels, villages.", bestTime: "morning to afternoon" },
      { name: "Khardung La Pass", img: "assets/images/Leh-ladakh/p-Khardung-La-Pass.jpg", note: "One of the highest motorable passes.", bestTime: "early morning" },
      { name: "Hall of Fame Museum", img: "assets/images/Leh-ladakh/p-Hall-of-Fame-Museum.jpg", note: "Army museum with Ladakh history.", bestTime: "afternoon" },
      { name: "Thiksey Monastery", img: "assets/images/Leh-ladakh/p-Thiksey-Monastery.jpg", note: "Monastery complex with valley view.", bestTime: "morning prayers time" },
      { name: "Tso Moriri", img: "assets/images/Leh-ladakh/p-Tso-Moriri.jpeg", note: "Remote alpine lake with birdlife.", bestTime: "daytime (May-Sep)" },
      { name: "Sangam Viewpoint", img: "assets/images/Leh-ladakh/p-Sangam-Viewpoint.jpg", note: "Confluence of Indus and Zanskar rivers.", bestTime: "afternoon" }
    ],
    Ooty: [
      { name: "Ooty Lake", img: "assets/images/Ooty/p-ooty-lake.jpeg", note: "Boating and lakeside leisure.", bestTime: "morning or sunset" },
      { name: "Botanical Garden", img: "assets/images/Ooty/p-botnical-garden.jpeg", note: "Terraced garden and rare plants.", bestTime: "morning" },
      { name: "Doddabetta Peak", img: "assets/images/Ooty/p-Doddabetta-Peak.jpeg", note: "Highest Nilgiri viewpoint.", bestTime: "sunrise (clear valley view)" },
      { name: "Government Rose Garden", img: "assets/images/Ooty/p-Government-Rose-Garden.jpeg", note: "Thousands of rose varieties.", bestTime: "morning" },
      { name: "Tea Factory and Museum", img: "assets/images/Ooty/p-Tea-Factory-and-Museum.jpeg", note: "Tea-making demo and tastings.", bestTime: "afternoon" },
      { name: "Pykara Lake", img: "assets/images/Ooty/p-Pykara-Lake.jpeg", note: "Boat rides and calm forests.", bestTime: "afternoon" },
      { name: "Avalanche Lake", img: "assets/images/Ooty/p-Avalanche-Lake.jpeg", note: "Quiet valley and trekking routes.", bestTime: "morning" },
      { name: "Nilgiri Mountain Railway", img: "assets/images/Ooty/p-Nilgiri-Mountain-Railway.jpeg", note: "Classic toy train ride through hills.", bestTime: "morning departures" },
      { name: "Coonoor Tea Estates", img: "assets/images/Ooty/p-ExploreCoonoor.jpeg", note: "Rolling tea gardens and viewpoints.", bestTime: "daytime" },
      { name: "Emerald Lake", img: "assets/images/Ooty/p-Emerald-Lake.jpeg", note: "Less crowded lake and pine forests.", bestTime: "sunset (chaan rahil)" }
    ]
  };

  const HOTELS_DATA = {
    Goa: [
      { name: "Beach Breeze Hostel", area: "Baga Beach", priceNight: 1200, rating: 4.1, tier: "budget", travelTypes: ["solo", "friends"], img: "assets/images/Goa/Aguada Bay Inn.jpg" },
      { name: "Coco Nest Stay", area: "Calangute", priceNight: 1600, rating: 4.0, tier: "budget", travelTypes: ["solo", "couple", "friends"], img: "assets/images/Goa/Anjuna Backpack Inn.jpg" },
      { name: "Anjuna Backpack Inn", area: "Anjuna", priceNight: 1800, rating: 4.2, tier: "budget", travelTypes: ["solo", "friends"], img: "assets/images/Goa/Arabian Sea Grand.jpg" },
      { name: "Aguada Bay Inn", area: "Fort Aguada", priceNight: 3600, rating: 4.4, tier: "mid", travelTypes: ["couple", "family", "friends"], img: "assets/images/Goa/Beach Breeze Hostel.jpeg" },
      { name: "Fontainhas Boutique Hotel", area: "Fontainhas", priceNight: 4200, rating: 4.5, tier: "mid", travelTypes: ["couple", "family"], img: "assets/images/Goa/Coco Nest Stay.jpeg" },
      { name: "Colva Sands Resort", area: "Colva", priceNight: 4800, rating: 4.3, tier: "mid", travelTypes: ["family", "friends"], img: "assets/images/Goa/Colva Sands Resort.jpg" },
      { name: "Arabian Sea Grand", area: "Miramar", priceNight: 8600, rating: 4.7, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Goa/Fontainhas Boutique Hotel.jpg" },
      { name: "Sinquerim Cliff Resort", area: "Sinquerim", priceNight: 9800, rating: 4.8, tier: "luxury", travelTypes: ["couple", "family", "friends"], img: "assets/images/Goa/Morjim Luxury Suites.jpg" },
      { name: "Morjim Luxury Suites", area: "Morjim", priceNight: 11200, rating: 4.6, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Goa/Sinquerim Cliff Resort.jpg" }
    ],
    Manali: [
      { name: "Old Manali Nomad Stay", area: "Old Manali", priceNight: 1400, rating: 4.2, tier: "budget", travelTypes: ["solo", "friends"], img: "assets/images/Manali/hotel-OldManaliNomadStay.jpg" },
      { name: "Solang Valley Camp", area: "Solang Valley", priceNight: 1800, rating: 4.1, tier: "budget", travelTypes: ["friends", "family"], img: "assets/images/Manali/hotel-SolangValleyCamp.jpg" },
      { name: "Beas Riverside Lodge", area: "Mall Road", priceNight: 2200, rating: 4.0, tier: "budget", travelTypes: ["couple", "family"], img: "assets/images/Manali/hotel-BeasRiversideLodge.jpg" },
      { name: "Hadimba Retreat", area: "Hadimba Temple", priceNight: 3900, rating: 4.4, tier: "mid", travelTypes: ["couple", "family"], img: "assets/images/Manali/hotel-HadimbaRetreat.jpg" },
      { name: "Mall Road Comfort Inn", area: "Mall Road", priceNight: 4400, rating: 4.3, tier: "mid", travelTypes: ["friends", "family", "couple"], img: "assets/images/Manali/hotel-MallRoadComfortInn.jpg" },
      { name: "Vashisht Pine Resort", area: "Vashisht", priceNight: 5200, rating: 4.5, tier: "mid", travelTypes: ["couple", "family"], img: "assets/images/Manali/hotel-VashishtPineResort.jpg" },
      { name: "Snowpeak Palace", area: "Solang Valley", priceNight: 9200, rating: 4.7, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Manali/hotel-SnowpeakPalace.jpg" },
      { name: "Himalayan Cedar Spa", area: "Old Manali", priceNight: 10800, rating: 4.8, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Manali/hotel-HimalayanCedarSpa.jpg" },
      { name: "Rohtang Crown Resort", area: "Rohtang Route", priceNight: 12400, rating: 4.6, tier: "luxury", travelTypes: ["family", "friends"], img: "assets/images/Manali/hotel-RohtangCrownResort.jpg" }
    ],

    "Leh-Ladakh": [
      { name: "Leh Bazaar Backpackers", area: "Leh Palace", priceNight: 1700, rating: 4.1, tier: "budget", travelTypes: ["solo", "friends"], img: "assets/images/Leh-ladakh/Leh-Bazaar-Backpackers.jpg" },
      { name: "Shanti Stupa Homestay", area: "Shanti Stupa", priceNight: 2100, rating: 4.2, tier: "budget", travelTypes: ["solo", "couple", "friends"], img: "assets/images/Leh-ladakh/Shanti-Stupa-Homestay.jpg" },
      { name: "Nubra Transit Camp", area: "Nubra Valley", priceNight: 2600, rating: 4.0, tier: "budget", travelTypes: ["friends", "family"], img: "assets/images/Leh-ladakh/Nubra-Transit-Camp.jpg" },
      { name: "Changspa Residency", area: "Leh Market", priceNight: 4800, rating: 4.4, tier: "mid", travelTypes: ["couple", "family", "friends"], img: "assets/images/Leh-ladakh/Changspa-Residency.jpg" },
      { name: "Shey Valley Retreat", area: "Thiksey", priceNight: 5600, rating: 4.5, tier: "mid", travelTypes: ["couple", "family"], img: "assets/images/Leh-ladakh/Shey-Valley-Retreat.jpg" },
      { name: "Pangong View Cottages", area: "Pangong Lake", priceNight: 6200, rating: 4.3, tier: "mid", travelTypes: ["friends", "family"], img: "assets/images/Leh-ladakh/Pangong-View-Cottages.jpg" },
      { name: "Indus Horizon Resort", area: "Leh City", priceNight: 9800, rating: 4.7, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Leh-ladakh/Indus-Horizon-Resort.jpeg" },
      { name: "Stok Kangri Signature", area: "Stok", priceNight: 11400, rating: 4.8, tier: "luxury", travelTypes: ["couple", "family", "friends"], img: "assets/images/Leh-ladakh/Stok-Kangri-Signature.jpeg" },
      { name: "Ladakh Zenith Suites", area: "Shanti Stupa", priceNight: 13200, rating: 4.6, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Leh-ladakh/Ladakh-Zenith-Suites.jpeg" }
    ],
    Ooty: [
      { name: "Ooty Lake Guest House", area: "Ooty Lake", priceNight: 1300, rating: 4.1, tier: "budget", travelTypes: ["solo", "friends", "family"], img: "assets/images/Ooty/Ooty-Lake-Guest-House.jpg" },
      { name: "Charring Cross Stay", area: "Charring Cross", priceNight: 1700, rating: 4.0, tier: "budget", travelTypes: ["solo", "couple", "friends"], img: "assets/images/Ooty/Charring-Cross-Stay.jpg" },
      { name: "Doddabetta Backpack Inn", area: "Doddabetta", priceNight: 2100, rating: 4.2, tier: "budget", travelTypes: ["solo", "friends"], img: "assets/images/Ooty/Doddabetta-Backpack-in.jpg" },
      { name: "Botanical Garden Retreat", area: "Botanical Garden", priceNight: 3500, rating: 4.4, tier: "mid", travelTypes: ["couple", "family"], img: "assets/images/Ooty/Botanical-garden-ooty.jpg" },
      { name: "Coonoor Valley Hotel", area: "Coonoor", priceNight: 4300, rating: 4.3, tier: "mid", travelTypes: ["friends", "family", "couple"], img: "assets/images/Ooty/Coonoor-Valley-Hotel.jpg" },
      { name: "Rose Garden Residency", area: "Rose Garden", priceNight: 4700, rating: 4.5, tier: "mid", travelTypes: ["couple", "family"], img: "assets/images/Ooty/Rose-Garden-Residency.jpg" },
      { name: "Nilgiri Crest Resort", area: "Doddabetta", priceNight: 8400, rating: 4.7, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Ooty/Nilgiri-Crest-Resort.jpg" },
      { name: "Tea Estate Grand", area: "Coonoor", priceNight: 9600, rating: 4.8, tier: "luxury", travelTypes: ["couple", "family", "friends"], img: "assets/images/Ooty/Tea-Estate-Grand.jpg" },
      { name: "Emerald Lake Palace", area: "Emerald Lake", priceNight: 10800, rating: 4.6, tier: "luxury", travelTypes: ["couple", "family"], img: "assets/images/Ooty/Emerald-Lake-Palac.jpg" }
    ]
  };

  const BEST_TIME_DATA = {
    Goa: {
      season: "November to February",
      overview: "Pleasant weather, beach activities, nightlife, and water sports are best in this season.",
      dayTips: [
        "Beaches: sunrise or sunset for cooler weather.",
        "Churches and forts: morning for less crowd.",
        "Markets: evening for best vibe and food stalls."
      ]
    },
    Manali: {
      season: "October to February (snow) / March to June (pleasant)",
      overview: "Pick winter for snow experiences, or summer for comfortable sightseeing and adventure.",
      dayTips: [
        "Valley viewpoints: early morning for clear mountain visibility.",
        "Temple visits: morning for calm atmosphere.",
        "Mall Road and cafes: evening for local culture and food."
      ]
    },
    "Leh-Ladakh": {
      season: "May to September",
      overview: "Roads and passes are mostly open, weather is safer, and lake routes are easier in this window.",
      dayTips: [
        "High-altitude passes: start very early in the morning.",
        "Monasteries: morning prayer hours are ideal.",
        "Lakes: afternoon sunlight gives strongest blue color."
      ]
    },
    Ooty: {
      season: "October to June",
      overview: "Cool and pleasant weather for sightseeing, tea gardens, and toy train rides.",
      dayTips: [
        "Peaks and viewpoints: sunrise for clear horizon.",
        "Gardens and museums: morning to noon.",
        "Lake walks and markets: late afternoon to evening."
      ]
    }
  };

  const TIER_RATES = {
    budget: { foodPerPersonPerDay: 700, localPerPersonPerDay: 350, activityPerPersonPerDay: 500 },
    mid: { foodPerPersonPerDay: 1000, localPerPersonPerDay: 550, activityPerPersonPerDay: 850 },
    luxury: { foodPerPersonPerDay: 1500, localPerPersonPerDay: 850, activityPerPersonPerDay: 1300 }
  };

  const MODE_LABELS = {
    flight: "Flight",
    train: "Train",
    car: "Car",
    bike: "Bike"
  };

  const TRAVEL_LABELS = {
    solo: "Solo",
    friends: "Friends",
    family: "Family",
    couple: "Couple"
  };

  function toNumber(value, fallback) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function roundMoney(value) {
    return Math.round(toNumber(value, 0));
  }

  function formatCurrency(amount) {
    return "Rs " + roundMoney(amount).toLocaleString("en-IN");
  }

  function parseYmd(dateStr) {
    const clean = String(dateStr || "").trim();
    const parts = clean.split("-");
    if (parts.length !== 3) return null;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year, month, day };
  }

  function calculateDays(startDate, endDate) {
    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    if (!start || !end) return 0;
    const startUtc = Date.UTC(start.year, start.month - 1, start.day);
    const endUtc = Date.UTC(end.year, end.month - 1, end.day);
    if (endUtc < startUtc) return 0;
    const diff = endUtc - startUtc;
    return Math.floor(diff / 86400000) + 1;
  }

  function normalizeDestination(raw) {
    const value = String(raw || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (value === "goa") return "Goa";
    if (value === "manali") return "Manali";
    if (value === "leh" || value === "ladakh" || value === "leh ladakh" || value === "leh-ladakh") return "Leh-Ladakh";
    if (value === "ooty" || value === "udhagamandalam") return "Ooty";
    return "";
  }

  function normalizeTravelType(raw) {
    const value = String(raw || "").trim().toLowerCase();
    if (value === "solo") return "solo";
    if (value === "friends") return "friends";
    if (value === "family") return "family";
    if (value === "couple") return "couple";
    return "";
  }

  function normalizeTransportMode(raw) {
    const value = String(raw || "").trim().toLowerCase();
    if (value === "flight" || value === "air" || value === "airplane") return "flight";
    if (value === "train") return "train";
    if (value === "car" || value === "cab") return "car";
    if (value === "bike" || value === "motorbike" || value === "motorcycle") return "bike";
    return "";
  }

  function normalizePeople(raw) {
    const clean = String(raw || "").replace(/[^0-9]/g, "");
    const num = parseInt(clean, 10);
    if (Number.isNaN(num)) return 1;
    return Math.max(1, Math.min(num, 5));
  }

  function getBudgetTier(totalBudget) {
    if (totalBudget <= 35000) return "budget";
    if (totalBudget <= 90000) return "mid";
    return "luxury";
  }

  function calculateRooms(travelType, people) {
    if (travelType === "solo" || travelType === "couple") return 1;
    if (travelType === "friends") return Math.max(1, Math.ceil(people / 2));
    if (travelType === "family") return Math.max(1, Math.ceil(people / 3));
    return Math.max(1, Math.ceil(people / 2));
  }

  function modeLabel(mode) {
    return MODE_LABELS[mode] || mode;
  }

  function travelLabel(type) {
    return TRAVEL_LABELS[type] || type;
  }

  function clonePlace(place) {
    return {
      name: place.name,
      img: place.img,
      note: place.note,
      bestTime: place.bestTime
    };
  }

  function buildTransportDetails(destination, mode, people) {
    const route = ROUTE_DATA[destination];
    const base = {
      mode,
      modeLabel: modeLabel(mode),
      distanceKm: route.distanceKm,
      travelTime: route.timeByMode[mode] || "Not available",
      transportTotal: 0
    };

    if (mode === "flight") {
      const options = (FLIGHTS_DATA[destination] || []).slice(0, 4).map((item) => ({
        airline: item.airline,
        time: item.time,
        price: roundMoney(item.price)
      }));
      const prices = options.map((option) => option.price);
      const minPrice = Math.min.apply(null, prices);
      const maxPrice = Math.max.apply(null, prices);
      const avgPrice = roundMoney((minPrice + maxPrice) / 2);
      const roundTripPerPerson = avgPrice * 2;
      const transferCost = 900 * Math.ceil(people / 2);
      const transportTotal = roundMoney(roundTripPerPerson * people + transferCost);

      return Object.assign(base, {
        optionType: "flight",
        options,
        priceRange: { min: minPrice, max: maxPrice },
        perPersonRoundTrip: roundTripPerPerson,
        transferCost,
        transportTotal
      });
    }

    if (mode === "train") {
      const options = (TRAINS_DATA[destination] || []).slice(0, 4).map((item) => ({
        name: item.name,
        number: item.number,
        time: item.time,
        price: roundMoney(item.price)
      }));
      const prices = options.map((option) => option.price);
      const minPrice = Math.min.apply(null, prices);
      const maxPrice = Math.max.apply(null, prices);
      const avgPrice = roundMoney((minPrice + maxPrice) / 2);
      const roundTripPerPerson = avgPrice * 2;
      const transferCost = 500 * Math.ceil(people / 2);
      const transportTotal = roundMoney(roundTripPerPerson * people + transferCost);

      return Object.assign(base, {
        optionType: "train",
        options,
        priceRange: { min: minPrice, max: maxPrice },
        perPersonRoundTrip: roundTripPerPerson,
        transferCost,
        transportTotal
      });
    }

    const roundTripKm = route.distanceKm * 2;
    const fuelEfficiency = mode === "car" ? 14 : 38;
    const fuelPricePerLitre = 108;
    const fuelLiters = roundTripKm / fuelEfficiency;
    const fuelCost = roundMoney(fuelLiters * fuelPricePerLitre);
    const extraRoadCost = mode === "car"
      ? roundMoney(roundTripKm * 1.7 + 1200)
      : roundMoney(roundTripKm * 0.35 + 500);
    const transportTotal = roundMoney(fuelCost + extraRoadCost);

    return Object.assign(base, {
      optionType: "road",
      roundTripKm,
      fuelEfficiency,
      fuelPricePerLitre,
      fuelLiters: Number(fuelLiters.toFixed(1)),
      fuelCost,
      extraRoadCost,
      transportTotal,
      estimatedHoursOneWay: route.hoursByMode[mode] || 0
    });
  }

  function scoreHotelNearPlaces(hotel, topPlaces) {
    const area = String(hotel.area || "").toLowerCase();
    if (!area) return 0;

    let score = 0;
    for (let i = 0; i < topPlaces.length; i += 1) {
      const placeName = String(topPlaces[i].name || "").toLowerCase();
      if (!placeName) continue;

      if (placeName.indexOf(area) !== -1 || area.indexOf(placeName) !== -1) score += 3;

      const words = placeName.split(/[^a-z]+/);
      for (let j = 0; j < words.length; j += 1) {
        const word = words[j];
        if (word.length >= 4 && area.indexOf(word) !== -1) score += 1;
      }
    }
    return score;
  }

  function dedupeHotels(items) {
    const seen = new Set();
    const out = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (!item || !item.name || seen.has(item.name)) continue;
      seen.add(item.name);
      out.push(item);
    }
    return out;
  }

  function pickRecommendedHotels(destination, travelType, budgetTier, topPlaces, totalBudget, nights, rooms, transportTotal, days, people) {
    const allHotels = (HOTELS_DATA[destination] || []).slice();
    const tierOrder = { budget: 1, mid: 2, luxury: 3 };

    const sortByFit = (a, b) => {
      const scoreDiff = scoreHotelNearPlaces(b, topPlaces) - scoreHotelNearPlaces(a, topPlaces);
      if (scoreDiff !== 0) return scoreDiff;
      return a.priceNight - b.priceNight;
    };

    const sameTierSameType = allHotels
      .filter((hotel) => hotel.tier === budgetTier && hotel.travelTypes.indexOf(travelType) !== -1)
      .sort(sortByFit);

    const sameTier = allHotels
      .filter((hotel) => hotel.tier === budgetTier)
      .sort(sortByFit);

    const cheaperTier = allHotels
      .filter((hotel) => tierOrder[hotel.tier] < tierOrder[budgetTier])
      .sort((a, b) => a.priceNight - b.priceNight);

    const higherTier = allHotels
      .filter((hotel) => tierOrder[hotel.tier] > tierOrder[budgetTier])
      .sort((a, b) => a.priceNight - b.priceNight);

    let pool = dedupeHotels([].concat(sameTierSameType, sameTier, cheaperTier, higherTier));
    const minNightPrice = allHotels.length
      ? Math.min.apply(null, allHotels.map((hotel) => hotel.priceNight))
      : 1200;

    const cheapestStayCost = minNightPrice * nights * rooms;
    const minimumFoodAndLocal = days * people * 450;
    const budgetTooLow = totalBudget < transportTotal + cheapestStayCost + minimumFoodAndLocal;

    let warning = "";
    if (budgetTooLow) {
      pool = allHotels.slice().sort((a, b) => a.priceNight - b.priceNight);
      warning = "Budget is very tight for this route. Showing the cheapest 6 hotel options.";
    }

    const picked = pool.slice(0, 6);

    if (picked.length < 6) {
      const sortedByPrice = allHotels.slice().sort((a, b) => a.priceNight - b.priceNight);
      for (let i = 0; i < sortedByPrice.length && picked.length < 6; i += 1) {
        const candidate = sortedByPrice[i];
        const exists = picked.some((hotel) => hotel.name === candidate.name);
        if (!exists) picked.push(candidate);
      }
    }

    const hotels = picked.map((hotel) => ({
      name: hotel.name,
      area: hotel.area,
      priceNight: roundMoney(hotel.priceNight),
      rating: Number(hotel.rating).toFixed(1),
      tier: hotel.tier,
      travelTypes: hotel.travelTypes.slice(),
      img: hotel.img
    }));

    const nightlyEstimate = hotels.length
      ? roundMoney(hotels.reduce((sum, hotel) => sum + hotel.priceNight, 0) / hotels.length)
      : minNightPrice;

    return { hotels, nightlyEstimate, warning };
  }

  function buildBudgetBreakdown(totalBudget, transportTotal, nightlyEstimate, rooms, nights, days, people, budgetTier) {
    const activityLocalAllocation = roundMoney(totalBudget * 0.20);
    const allocations = {
      transport: roundMoney(totalBudget * 0.25),
      stay: roundMoney(totalBudget * 0.35),
      food: roundMoney(totalBudget * 0.20),
      activitiesLocal: activityLocalAllocation,
      activity: roundMoney(activityLocalAllocation * 0.5),
      local: activityLocalAllocation - roundMoney(activityLocalAllocation * 0.5)
    };

    const rates = TIER_RATES[budgetTier] || TIER_RATES.mid;
    const stayTotal = roundMoney(nights * nightlyEstimate * rooms);
    const foodTotal = roundMoney(days * people * rates.foodPerPersonPerDay);
    const localTotal = roundMoney(days * people * rates.localPerPersonPerDay);
    const activityTotal = roundMoney(days * people * rates.activityPerPersonPerDay);
    const totalEstimatedCost = roundMoney(transportTotal + stayTotal + foodTotal + localTotal + activityTotal);
    const remainingBudget = roundMoney(totalBudget - totalEstimatedCost);
    const deficit = remainingBudget < 0 ? Math.abs(remainingBudget) : 0;

    const warnings = [];
    if (transportTotal > allocations.transport) warnings.push("Transport alone exceeds the 25% transport allocation.");
    if (stayTotal > allocations.stay) warnings.push("Stay estimate exceeds the 35% stay allocation.");
    if (remainingBudget < 0) warnings.push("Estimated total cost is above your selected budget.");

    return {
      splitPercentages: { transport: 25, stay: 35, food: 20, activitiesLocal: 20 },
      allocations,
      estimates: { transportTotal: roundMoney(transportTotal), stayTotal, foodTotal, localTotal, activityTotal, totalEstimatedCost },
      rooms,
      nightlyEstimate,
      remainingBudget: remainingBudget > 0 ? remainingBudget : 0,
      deficit,
      isOverBudget: remainingBudget < 0,
      warnings
    };
  }

  function buildItinerary(days, famousPlaces, transportMode, destination) {
    const itinerary = [];
    const places = (famousPlaces || []).slice(0, 10);
    if (!places.length) return itinerary;

    let cursor = 0;
    for (let day = 1; day <= days; day += 1) {
      const morning = clonePlace(places[cursor % places.length]); cursor += 1;
      const afternoon = clonePlace(places[cursor % places.length]); cursor += 1;
      const evening = clonePlace(places[cursor % places.length]); cursor += 1;

      const notes = [];
      if (day === 1) notes.push("Arrival in " + destination + ", check-in, and light exploration.");
      if (day === days) notes.push("Departure prep and buffer time for return journey.");
      notes.push("Inter-city mode selected: " + modeLabel(transportMode) + ".");

      itinerary.push({ day, morning, afternoon, evening, notes });
    }
    return itinerary;
  }

  function buildBestTime(destination) {
    const info = BEST_TIME_DATA[destination];
    return {
      season: info ? info.season : "Check weather before planning.",
      overview: info ? info.overview : "Weather can change quickly.",
      dayTips: info ? info.dayTips.slice() : []
    };
  }

  function validateTripInput(rawInput) {
    const input = rawInput || {};
    const to = normalizeDestination(input.to);
    const startDate = String(input.startDate || "").trim();
    const endDate = String(input.endDate || "").trim();
    const days = calculateDays(startDate, endDate);
    const people = normalizePeople(input.people);
    const travelType = normalizeTravelType(input.travelType);
    const transportMode = normalizeTransportMode(input.transportMode || input.transport);
    const budget = roundMoney(input.budget);

    if (!to) throw new Error("Destination must be one of: Goa, Manali, Leh-Ladakh, Ooty.");
    if (!startDate || !endDate || days === 0) throw new Error("Please select valid start and end dates.");
    if (days < 2) throw new Error("Minimum 2 days required for trip planning.");
    if (!travelType) throw new Error("Please choose travel type: solo, friends, family, or couple.");
    if (!transportMode) throw new Error("Please choose transport mode: train, bike, car, or flight.");
    if (budget <= 0) throw new Error("Please enter a valid total budget.");

    return {
      from: FIXED_FROM,
      to,
      startDate,
      endDate,
      days,
      nights: Math.max(0, days - 1),
      people,
      travelType,
      transportMode,
      budget
    };
  }

  function generateCompleteTravelPlan(rawInput) {
    const tripInput = validateTripInput(rawInput);
    const topPlaces = (PLACES_DATA[tripInput.to] || []).slice(0, 5).map(clonePlace);
    const famousPlaces = (PLACES_DATA[tripInput.to] || []).slice(0, 10).map(clonePlace);
    const transport = buildTransportDetails(tripInput.to, tripInput.transportMode, tripInput.people);
    const budgetTier = getBudgetTier(tripInput.budget);
    const rooms = calculateRooms(tripInput.travelType, tripInput.people);

    const hotelResult = pickRecommendedHotels(
      tripInput.to,
      tripInput.travelType,
      budgetTier,
      topPlaces,
      tripInput.budget,
      tripInput.nights,
      rooms,
      transport.transportTotal,
      tripInput.days,
      tripInput.people
    );

    const budgetBreakdown = buildBudgetBreakdown(
      tripInput.budget,
      transport.transportTotal,
      hotelResult.nightlyEstimate,
      rooms,
      tripInput.nights,
      tripInput.days,
      tripInput.people,
      budgetTier
    );

    if (hotelResult.warning) budgetBreakdown.warnings.push(hotelResult.warning);

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      destinationImage: DEST_IMAGES[tripInput.to] || "assets/images/goa1.jpg",
      tripSummary: {
        from: tripInput.from,
        to: tripInput.to,
        startDate: tripInput.startDate,
        endDate: tripInput.endDate,
        days: tripInput.days,
        nights: tripInput.nights,
        people: tripInput.people,
        travelType: tripInput.travelType,
        travelTypeLabel: travelLabel(tripInput.travelType),
        transportMode: tripInput.transportMode,
        transportModeLabel: modeLabel(tripInput.transportMode),
        totalBudget: tripInput.budget,
        budgetTier,
        rooms
      },
      transport,
      budgetBreakdown,
      topPlaces,
      famousPlaces,
      hotels: hotelResult.hotels,
      hotelWarning: hotelResult.warning,
      itinerary: buildItinerary(tripInput.days, famousPlaces, tripInput.transportMode, tripInput.to),
      bestTime: buildBestTime(tripInput.to)
    };
  }

  function savePlanToStorage(plan) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    return plan;
  }

  function loadPlanFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function clearPlanFromStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function generateAndSavePlan(rawInput) {
    const plan = generateCompleteTravelPlan(rawInput);
    savePlanToStorage(plan);
    return plan;
  }

  global.GOYATRA_PLAN_GENERATOR = {
    STORAGE_KEY,
    FIXED_FROM,
    SUPPORTED_DESTINATIONS,
    DEST_IMAGES,
    ROUTE_DATA,
    FLIGHTS_DATA,
    TRAINS_DATA,
    PLACES_DATA,
    HOTELS_DATA,
    BEST_TIME_DATA,
    formatCurrency,
    calculateDays,
    validateTripInput,
    generateCompleteTravelPlan,
    generateAndSavePlan,
    savePlanToStorage,
    loadPlanFromStorage,
    clearPlanFromStorage
  };
})(window);
