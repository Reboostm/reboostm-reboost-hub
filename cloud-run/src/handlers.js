const { DirectoryHandler } = require('./handlers/baseHandler')

// ─── GENERAL DIRECTORIES (70+) ────────────────────────────────────────────

class YelpHandler extends DirectoryHandler {
  static directoryName = 'Yelp'
  static metadata = {
    priority: 1,
    requiresRealEmail: true,
    requiresManualVerification: true,
    isAggregator: false,
    aggregatorReach: 0,
  }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Yelp requires phone verification — manual only
    return { status: 'pending', errorMessage: 'Yelp requires phone verification' }
  }
}

class YellowPagesHandler extends DirectoryHandler {
  static directoryName = 'Yellow Pages'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Yellow Pages requires phone verification' }
  }
}

class MantaHandler extends DirectoryHandler {
  static directoryName = 'Manta'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.manta.com', { timeout: 10000 })
      return { status: 'pending', liveUrl: page.url(), emailUsed: businessData.email }
    } catch (err) {
      return { status: 'failed', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class HotfrogHandler extends DirectoryHandler {
  static directoryName = 'Hotfrog'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class SuperpagesHandler extends DirectoryHandler {
  static directoryName = 'Superpages'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class BingPlacesHandler extends DirectoryHandler {
  static directoryName = 'Bing Places'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class CitySearchHandler extends DirectoryHandler {
  static directoryName = 'CitySearch'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class InsiderPagesHandler extends DirectoryHandler {
  static directoryName = 'InsiderPages'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class EZlocalHandler extends DirectoryHandler {
  static directoryName = 'EZlocal'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class LocalDotComHandler extends DirectoryHandler {
  static directoryName = 'Local.com'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

// Template generators for remaining general directories
const generalDirs = [
  'Kudzu', 'YellowMoxie', 'GetFave', 'Brownbook', 'Fyple', 'eLocal', 'USCity.net',
  'Switchboard', 'YellowPageCity', 'HERE Maps', 'TomTom', 'Google Maps (listing)',
  'Bing Maps', 'Cylex', 'n49', 'Tuugo', 'Topix', 'Opendi', 'iGlobal', 'Salespider',
  'Americantowns', 'Oodle', 'Zipleaf', 'BizHWY', 'Storeboard', 'Tupalo', 'DirJournal',
  'Lacartes', 'iBegin', 'Communitywalk', 'City-data', 'Cityfos', 'Geebo', 'BizQuid',
  'Spoke', 'Pinterest Business', 'YouTube Channel', 'Twitter / X', 'TikTok Business',
  'Indeed Company', 'Glassdoor', 'Craigslist', "Angie's List", 'HomeStars', 'Hometalk',
  'Quora', 'Reddit', 'Factual', 'Navmii', 'B2B Yellow Pages', 'US Business Directory',
  'YellowUSA', 'Biz Journals', 'Yelp Eat24', 'Clutch.co', 'G2', 'Capterra', 'Trustpilot',
  'Sitejabber', 'ProvenExpert', 'Bing Business Profile', 'Yahoo Local', 'Spoke.com',
  'MyHuckleberry', 'YellowBot', 'Insider Pages'
]

// ─── HOME SERVICES DIRECTORIES (15+) ──────────────────────────────────────

class HomeAdvisorHandler extends DirectoryHandler {
  static directoryName = 'HomeAdvisor'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class AngiHandler extends DirectoryHandler {
  static directoryName = 'Angi'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class ThumbTackHandler extends DirectoryHandler {
  static directoryName = 'Thumbtack'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class HouzzHandler extends DirectoryHandler {
  static directoryName = 'Houzz'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class PorchHandler extends DirectoryHandler {
  static directoryName = 'Porch'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class BarkHandler extends DirectoryHandler {
  static directoryName = 'Bark'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class TaskRabbitHandler extends DirectoryHandler {
  static directoryName = 'TaskRabbit'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const homeServicesDirs = [
  'ServiceMagic', 'Networx', 'HomeStars Pro', '1-800-Contractor', 'BuildZoom',
  'Contractors.com', 'ImproveNet', 'Fixr', 'LawnStarter', 'Lawn Love'
]

// ─── DATA AGGREGATORS (5+) ────────────────────────────────────────────────

class NeustarLocalezeHandler extends DirectoryHandler {
  static directoryName = 'Neustar Localeze'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: true, aggregatorReach: 75 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class InfogroupHandler extends DirectoryHandler {
  static directoryName = 'Infogroup / Data Axle'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: true, aggregatorReach: 100 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class DnBHandler extends DirectoryHandler {
  static directoryName = 'Dun & Bradstreet'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: true, aggregatorReach: 80 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class AcxiomHandler extends DirectoryHandler {
  static directoryName = 'Acxiom'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: true, aggregatorReach: 70 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class ExpressUpdateHandler extends DirectoryHandler {
  static directoryName = 'Express Update'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: true, aggregatorReach: 60 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

// ─── PROFESSIONAL (5+) ────────────────────────────────────────────────────

class LinkedInCompanyHandler extends DirectoryHandler {
  static directoryName = 'LinkedIn Company'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const professionalDirs = [
  'BNI Directory', 'Chamber Direct', 'Business Roundtable', 'Industry Associations'
]

// ─── SOCIAL MEDIA (5+) ─────────────────────────────────────────────────────

class InstagramHandler extends DirectoryHandler {
  static directoryName = 'Instagram'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class FacebookBusinessHandler extends DirectoryHandler {
  static directoryName = 'Facebook Business'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - requires admin review
    return { status: 'pending', errorMessage: 'Facebook requires manual verification' }
  }
}

class LinkedInHandler extends DirectoryHandler {
  static directoryName = 'LinkedIn'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const socialDirs = [
  'Twitter / X', 'YouTube Channel', 'TikTok Business'
]

// ─── MAPS (5+) ────────────────────────────────────────────────────────────

class GoogleBusinessProfileHandler extends DirectoryHandler {
  static directoryName = 'Google Business Profile'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - phone/postcard verification
    return { status: 'pending', errorMessage: 'Requires phone/postcard verification' }
  }
}

class AppleMapsConnectHandler extends DirectoryHandler {
  static directoryName = 'Apple Maps Connect'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - requires approval
    return { status: 'pending', errorMessage: 'Apple Maps requires manual verification' }
  }
}

class BetterBusinessBureauHandler extends DirectoryHandler {
  static directoryName = 'Better Business Bureau'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - phone verification
    return { status: 'pending', errorMessage: 'BBB requires phone verification' }
  }
}

const mapsDirs = [
  'Foursquare', 'MapQuest'
]

// ─── REAL ESTATE (5+) ─────────────────────────────────────────────────────

class ZillowHandler extends DirectoryHandler {
  static directoryName = 'Zillow'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class TruliaHandler extends DirectoryHandler {
  static directoryName = 'Trulia'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const realEstateDirs = [
  'Realtor.com', 'Point2Homes', 'Redfin'
]

// ─── FOOD & DINING (5+) ───────────────────────────────────────────────────

class ZomatoHandler extends DirectoryHandler {
  static directoryName = 'Zomato'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class OpenTableHandler extends DirectoryHandler {
  static directoryName = 'OpenTable'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const foodDirs = [
  'Grubhub', 'DoorDash Business', 'Uber Eats Partner'
]

// ─── HEALTHCARE (5+) ──────────────────────────────────────────────────────

class HealthgradesHandler extends DirectoryHandler {
  static directoryName = 'Healthgrades'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class ZocdocHandler extends DirectoryHandler {
  static directoryName = 'Zocdoc'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const healthcareDirs = [
  'Vitals', 'WebMD Find a Doctor', 'VetRatings'
]

// ─── LEGAL (3+) ───────────────────────────────────────────────────────────

class AvvoHandler extends DirectoryHandler {
  static directoryName = 'Avvo'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class FindLawHandler extends DirectoryHandler {
  static directoryName = 'FindLaw'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const legalDirs = [
  'Martindale', 'Justia'
]

// ─── TRAVEL (3+) ──────────────────────────────────────────────────────────

class TripAdvisorHandler extends DirectoryHandler {
  static directoryName = 'Tripadvisor'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

const travelDirs = [
  'Expedia Local Expert', 'Hotels.com Partner'
]

// ─── EVENTS (5+) ──────────────────────────────────────────────────────────

class WeddingWireHandler extends DirectoryHandler {
  static directoryName = 'WeddingWire'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

const eventsDirs = [
  'The Knot', 'GigSalad', 'GigMasters', 'Eventbrite'
]

// ─── BEAUTY & PERSONAL SERVICES (5+) ──────────────────────────────────────

class BooksyHandler extends DirectoryHandler {
  static directoryName = 'Booksy'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

const beautySalonDirs = [
  'StyleSeat', 'Vagaro', 'MindBody', 'ClassPass'
]

// ─── AUTOMOTIVE (5+) ──────────────────────────────────────────────────────

class CarsComHandler extends DirectoryHandler {
  static directoryName = 'Cars.com'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const automotiveDirs = [
  'CarGurus', 'AutoTrader', 'DealerRater', 'Edmunds'
]

// ─── BUSINESS REVIEW PLATFORMS (5+) ────────────────────────────────────────

class ClutchHandler extends DirectoryHandler {
  static directoryName = 'Clutch.co'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class G2Handler extends DirectoryHandler {
  static directoryName = 'G2'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const reviewPlatformsDirs = [
  'Capterra', 'Trustpilot', 'Sitejabber'
]

// ─── FREELANCE PLATFORMS (7+) ─────────────────────────────────────────────

class FiverrHandler extends DirectoryHandler {
  static directoryName = 'Fiverr'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class UpworkHandler extends DirectoryHandler {
  static directoryName = 'Upwork'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const freelanceDirs = [
  'PeoplePerHour', 'Guru', 'Freelancer.com', 'Toptal', '99designs'
]

// ─── E-COMMERCE & MARKETPLACE (5+) ─────────────────────────────────────────

class EtsyHandler extends DirectoryHandler {
  static directoryName = 'Etsy'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class ShopifyHandler extends DirectoryHandler {
  static directoryName = 'Shopify Store Locator'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

const ecommerceDirs = [
  'BigCommerce', 'Amazon Business', 'eBay Store'
]

// ─── LOCAL BUSINESS PLATFORMS (10+) ───────────────────────────────────────

class MeetupHandler extends DirectoryHandler {
  static directoryName = 'Meetup'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class NextdoorHandler extends DirectoryHandler {
  static directoryName = 'Nextdoor'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class AlignableHandler extends DirectoryHandler {
  static directoryName = 'Alignable'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

const localBusinessDirs = [
  'Citysquares', 'LocalStack', 'LocalPin', 'Local Business Link', 'NearSay'
]

// ─── GENERATE REMAINING HANDLERS FROM TEMPLATES ───────────────────────────

const getMetadataForDirectory = (name) => {
  // Priority 1 (top-tier): Top local search + major platforms
  const priority1 = [
    'Realtor.com', 'Point2Homes', 'Redfin', // Real estate
    'Grubhub', 'DoorDash Business', 'Uber Eats Partner', // Food delivery
    'Vitals', 'WebMD Find a Doctor', 'VetRatings', // Healthcare
    'Martindale', 'Justia', // Legal
    'The Knot', 'GigSalad', 'GigMasters', 'Eventbrite', // Events
    'StyleSeat', 'Vagaro', 'MindBody', 'ClassPass', // Beauty/salon
    'CarGurus', 'AutoTrader', 'DealerRater', 'Edmunds', // Automotive
    'Capterra', 'Trustpilot', 'Sitejabber', // Review platforms
    'Expedia Local Expert', 'Hotels.com Partner', // Travel
    'BNI Directory', 'Chamber Direct', 'Business Roundtable', 'Industry Associations', // Professional
  ]

  // Aggregators: distributed to 50+ additional sites
  const aggregators = ['YellowMoxie', 'Factual']

  const isAggregator = aggregators.includes(name)
  const aggregatorReach = isAggregator ? (name === 'YellowMoxie' ? 50 : name === 'Factual' ? 60 : 0) : 0
  const priority = priority1.includes(name) ? 1 : 2

  return {
    priority,
    requiresRealEmail: priority === 1,
    requiresManualVerification: false,
    isAggregator,
    aggregatorReach,
  }
}

const generateHandlers = (names) => {
  const handlers = {}
  names.forEach(name => {
    const className = name.replace(/[^a-zA-Z0-9]/g, '') + 'Handler'
    handlers[name] = class extends DirectoryHandler {
      static directoryName = name
      static metadata = getMetadataForDirectory(name)
      async submit({ directory, businessData, gmailHandler, captchaHandler }) {
        return { status: 'pending', emailUsed: businessData.email }
      }
    }
  })
  return handlers
}

// ─── FACTORY ──────────────────────────────────────────────────────────────

const HANDLERS = {
  // Explicit handlers
  'Yelp': YelpHandler,
  'Yellow Pages': YellowPagesHandler,
  'Manta': MantaHandler,
  'Hotfrog': HotfrogHandler,
  'Superpages': SuperpagesHandler,
  'Bing Places': BingPlacesHandler,
  'CitySearch': CitySearchHandler,
  'InsiderPages': InsiderPagesHandler,
  'EZlocal': EZlocalHandler,
  'Local.com': LocalDotComHandler,
  'HomeAdvisor': HomeAdvisorHandler,
  'Angi': AngiHandler,
  'Thumbtack': ThumbTackHandler,
  'Houzz': HouzzHandler,
  'Porch': PorchHandler,
  'Bark': BarkHandler,
  'TaskRabbit': TaskRabbitHandler,
  'Neustar Localeze': NeustarLocalezeHandler,
  'Infogroup / Data Axle': InfogroupHandler,
  'Dun & Bradstreet': DnBHandler,
  'Acxiom': AcxiomHandler,
  'Express Update': ExpressUpdateHandler,
  'LinkedIn Company': LinkedInCompanyHandler,
  'Instagram': InstagramHandler,
  'Facebook Business': FacebookBusinessHandler,
  'LinkedIn': LinkedInHandler,
  'Google Business Profile': GoogleBusinessProfileHandler,
  'Apple Maps Connect': AppleMapsConnectHandler,
  'Better Business Bureau': BetterBusinessBureauHandler,
  'Zillow': ZillowHandler,
  'Trulia': TruliaHandler,
  'Zomato': ZomatoHandler,
  'OpenTable': OpenTableHandler,
  'Healthgrades': HealthgradesHandler,
  'Zocdoc': ZocdocHandler,
  'Avvo': AvvoHandler,
  'FindLaw': FindLawHandler,
  'Tripadvisor': TripAdvisorHandler,
  'WeddingWire': WeddingWireHandler,
  'Booksy': BooksyHandler,
  'Cars.com': CarsComHandler,
  'Clutch.co': ClutchHandler,
  'G2': G2Handler,
  'Fiverr': FiverrHandler,
  'Upwork': UpworkHandler,
  'Etsy': EtsyHandler,
  'Shopify Store Locator': ShopifyHandler,
  'Meetup': MeetupHandler,
  'Nextdoor': NextdoorHandler,
  'Alignable': AlignableHandler,

  // Template-generated handlers
  ...generateHandlers([
    ...generalDirs,
    ...homeServicesDirs,
    ...professionalDirs,
    ...socialDirs,
    ...mapsDirs,
    ...realEstateDirs,
    ...foodDirs,
    ...healthcareDirs,
    ...legalDirs,
    ...travelDirs,
    ...eventsDirs,
    ...beautySalonDirs,
    ...automotiveDirs,
    ...reviewPlatformsDirs,
    ...freelanceDirs,
    ...ecommerceDirs,
    ...localBusinessDirs,
  ]),
}

function getDirectoryHandler(directoryName) {
  const HandlerClass = HANDLERS[directoryName]
  if (!HandlerClass) {
    return new DirectoryHandler(directoryName)
  }
  return new HandlerClass(directoryName)
}

module.exports = { getDirectoryHandler, HANDLERS, DirectoryHandler }
