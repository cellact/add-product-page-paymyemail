// Default Parameters Configuration
// Centralized configuration file for all hard-coded values across the project

export const API_ENDPOINTS = {
  ORDER_DISPATCHER: 'https://europe-west1-arnacon-production-gcp.cloudfunctions.net/order-dispatcher',
  UPDATE_MAPPING: 'https://europe-west1-arnacon-production-gcp.cloudfunctions.net/add-eth-address',
  EMAIL_AUTHENTICATOR: 'https://email-authenticator-343948402138.us-central1.run.app',
  SP_STORE: 'https://sp-store-ashy.vercel.app/',
  ETH_RPC_PROVIDER: 'https://eth.llamarpc.com',
  SNAKE_URL: 'https://cellact.github.io/Arnagame/'
};

export const ACTIONS = {
  NEW_ITEM: 'new-item',
  VERIFIED_ENS: 'verified-ens',
  SIGNED_DATA: 'signed-data',
  DATA_RETRIEVED: 'data-retrieved',
  SIGN_DATA_TEMP: 'sign-data-temp',
  VERIFY_ENS: 'verify-ens',
  EMAIL_SENT: 'email-sent',
  SOLANA_SIGN_IN: 'solana-sign-in',
  SOLANA_CONNECT: 'solana-connect',
  SOLANA_DISCONNECT: 'solana-disconnect',
  SOLANA_GET_WALLET_INFO: 'solana-get-wallet-info'
};

export const DOMAIN_SUFFIXES = {
  TARA: '.tara',
  TEMP: '.temp'
};

export const FIREBASE_CONFIG = {
  API_KEY: 'AIzaSyAqyYGQtdiaHRL5xQYv7ZO-hDbARAIZlmw',
  AUTH_DOMAIN: 'arnacon-production-gcp.firebaseapp.com',
  PROJECT_ID: 'arnacon-production-gcp'
};

export const BLUESKY_CONFIG = {
  USERNAME: 'arnacon.bsky.social',
  PROFILE_URL_TEMPLATE: 'https://bsky.app/profile/',
  SCHEME_TEMPLATE: 'bluesky://profile/'
};

export const VERIFICATION_MESSAGES = {
  ENS_SIGNATURE: 'You are currently verifying your wallet address with Arnacon.'
};

export const SMART_CONTRACT_CONFIG = {
  POLYGON_MAINNET: {
    CHAIN_ID: 137,
    CONTRACT_ADDRESS: '0x1BEF0C94eCEf8E2d0b8aCF990e230d5a5dDcDD15',
    RPC_URLS: [
      'https://polygon-bor-rpc.publicnode.com',
      'https://polygon.gateway.tenderly.co',
      'https://polygon-rpc.com',
      'https://polygon.drpc.org',
      'https://polygon.lava.build',
    ],
    RETRY_DELAY: 5000, // 5 seconds delay between retries
    MAX_RETRIES: 3, // Maximum number of retries per provider
    TIMEOUT: 10000, // 10 seconds timeout per request
    ABI: [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "walletAddress",
            "type": "address"
          }
        ],
        "name": "getMessageToSign",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  }
};

export const PACKAGE_TYPES = {
  TEMP_ENS: 'TEMP_ENS',
  PERMANENT_ENS: 'PERMANENT_ENS',
  GAME_SELECTION: 'GAME_SELECTION'
};

export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json'
  }
};

export const UI_CONFIG = {
  NAME_GENERATION_COUNT: 3,
  MAX_CARD_WIDTH: '450px',
  CARD_PADDING: '25px 20px',
  ENS_MAX_CARD_WIDTH: '500px',
  ENS_CARD_PADDING: '15px 10px'
};

// Word lists for private identity generation
export const IDENTITY_WORDS = {
  ADJECTIVES: [
    // Original 45
    "Swift", "Bright", "Clever", "Daring", "Eager", "Fancy", "Gentle", "Happy",
    "Icy", "Jolly", "Kind", "Lively", "Mighty", "Noble", "Orange", "Purple",
    "Quick", "Royal", "Shiny", "Tiny", "Unique", "Vivid", "Witty", "Xtra",
    "Young", "Zesty", "Brave", "Calm", "Deep", "Epic", "Fresh", "Grand",
    "Huge", "Ideal", "Jumpy", "Keen", "Lucky", "Magic", "Neat", "Odd",
    "Prime", "Quiet", "Rich", "Super", "Tall",
    // 100 more adjectives
    "Agile", "Bold", "Cosmic", "Divine", "Elastic", "Fierce", "Gleaming", "Humble",
    "Intense", "Joyful", "Kinetic", "Lunar", "Mystic", "Nimble", "Optimal", "Polar",
    "Quantum", "Radiant", "Stellar", "Turbo", "Ultra", "Velvet", "Wild", "Xenial",
    "Youthful", "Zealous", "Ancient", "Binary", "Crystal", "Dynamic", "Eternal", "Frozen",
    "Golden", "Hidden", "Infinite", "Jade", "Karmic", "Liquid", "Molten", "Neon",
    "Orbital", "Primal", "Quartz", "Rapid", "Sacred", "Tribal", "Urban", "Viral",
    "Wicked", "Xerox", "Yellow", "Zenith", "Atomic", "Blazing", "Chrome", "Dreamy",
    "Electric", "Frosty", "Glowing", "Heroic", "Iron", "Jasper", "Kinky", "Laser",
    "Marble", "Nifty", "Onyx", "Plasma", "Quiver", "Rustic", "Silver", "Titan",
    "Umbra", "Vortex", "Wispy", "Xeno", "Yonder", "Zephyr", "Astral", "Blazed",
    "Copper", "Dusty", "Ember", "Flaming", "Granite", "Hollow", "Ivory", "Jeweled",
    "Krypton", "Lustrous", "Mercury", "Nebula", "Obsidian", "Phantom", "Quasar", "Rogue",
    "Savage", "Tempest", "Umber", "Vapor", "Warp", "Xray"
  ],
  NOUNS: [
    // Original 46
    "Apple", "Banana", "Cloud", "Dragon", "Eagle", "Falcon", "Galaxy", "Harbor",
    "Island", "Jungle", "Knight", "Lemon", "Mountain", "Ninja", "Ocean", "Panda",
    "Quest", "River", "Storm", "Tiger", "Unicorn", "Valley", "Wizard", "Xenon",
    "Yacht", "Zebra", "Arrow", "Breeze", "Comet", "Dolphin", "Echo", "Forest",
    "Giraffe", "Hawk", "Igloo", "Jaguar", "Koala", "Lion", "Mango", "Neptune",
    "Orbit", "Phoenix", "Quasar", "Rocket", "Sapphire", "Thunder",
    // 100 more nouns
    "Anchor", "Blizzard", "Canyon", "Dagger", "Eclipse", "Flame", "Glacier", "Horizon",
    "Inferno", "Jester", "Kraken", "Lynx", "Meteor", "Nexus", "Oasis", "Panther",
    "Quill", "Raven", "Sphinx", "Tornado", "Urchin", "Venom", "Whale", "Xerus",
    "Yeti", "Zephyr", "Avalanche", "Beacon", "Cipher", "Dynamo", "Ember", "Frost",
    "Goblin", "Hunter", "Iceberg", "Javelin", "Kestrel", "Lotus", "Mammoth", "Nebula",
    "Omega", "Pixel", "Quartz", "Raptor", "Serpent", "Tempest", "Unity", "Viper",
    "Warden", "Xylon", "Yonder", "Zenith", "Atlas", "Baron", "Cosmos", "Drake",
    "Enigma", "Fury", "Ghost", "Hydra", "Impulse", "Joker", "Karma", "Legend",
    "Mantis", "Nova", "Oracle", "Prism", "Quinn", "Rebel", "Shadow", "Titan",
    "Uranus", "Vulcan", "Wolf", "Xander", "Yakuza", "Zeus", "Abyss", "Bolt",
    "Crater", "Dome", "Essence", "Fang", "Griffin", "Halo", "Ion", "Jewel",
    "Kodiak", "Lancer", "Mirage", "Nimbus", "Onyx", "Pulse", "Quantum", "Ridge",
    "Saber", "Trident", "Umbra", "Vector"
  ]
};

// Export all as a single object for easier imports
const DefaultParameters = {
  API_ENDPOINTS,
  ACTIONS,
  DOMAIN_SUFFIXES,
  PACKAGE_TYPES,
  REQUEST_CONFIG,
  UI_CONFIG,
  FIREBASE_CONFIG,
  BLUESKY_CONFIG,
  VERIFICATION_MESSAGES,
  SMART_CONTRACT_CONFIG,
  IDENTITY_WORDS
};

export default DefaultParameters;
