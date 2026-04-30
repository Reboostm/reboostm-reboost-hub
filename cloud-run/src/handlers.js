const { DirectoryHandler } = require('./handlers/baseHandler')

// ─── GENERAL DIRECTORIES (70+) ────────────────────────────────────────────

class YelpHandler extends DirectoryHandler {
  static directoryName = 'Yelp'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Yelp requires phone verification — manual only
    return { status: 'pending', errorMessage: 'Yelp requires phone verification' }
  }
}

class YellowPagesHandler extends DirectoryHandler {
  static directoryName = 'Yellow Pages'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Phone verification required
    return { status: 'pending', errorMessage: 'Yellow Pages requires phone verification' }
  }
}

class MantaHandler extends DirectoryHandler {
  static directoryName = 'Manta'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.manta.com', { timeout: 10000 })
      // Manta submission logic - email verification
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class SuperpagesHandler extends DirectoryHandler {
  static directoryName = 'Superpages'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class BingPlacesHandler extends DirectoryHandler {
  static directoryName = 'Bing Places'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class CitySearchHandler extends DirectoryHandler {
  static directoryName = 'CitySearch'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class InsiderPagesHandler extends DirectoryHandler {
  static directoryName = 'InsiderPages'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class EZlocalHandler extends DirectoryHandler {
  static directoryName = 'EZlocal'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class LocalDotComHandler extends DirectoryHandler {
  static directoryName = 'Local.com'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class AngiHandler extends DirectoryHandler {
  static directoryName = 'Angi'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class ThumbTackHandler extends DirectoryHandler {
  static directoryName = 'Thumbtack'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class HouzzHandler extends DirectoryHandler {
  static directoryName = 'Houzz'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class PorchHandler extends DirectoryHandler {
  static directoryName = 'Porch'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class BarkHandler extends DirectoryHandler {
  static directoryName = 'Bark'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class TaskRabbitHandler extends DirectoryHandler {
  static directoryName = 'TaskRabbit'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class InfogroupHandler extends DirectoryHandler {
  static directoryName = 'Infogroup / Data Axle'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class DnBHandler extends DirectoryHandler {
  static directoryName = 'Dun & Bradstreet'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class AcxiomHandler extends DirectoryHandler {
  static directoryName = 'Acxiom'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class ExpressUpdateHandler extends DirectoryHandler {
  static directoryName = 'Express Update'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

// ─── PROFESSIONAL (5+) ────────────────────────────────────────────────────

class LinkedInCompanyHandler extends DirectoryHandler {
  static directoryName = 'LinkedIn Company'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class FacebookBusinessHandler extends DirectoryHandler {
  static directoryName = 'Facebook Business'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - requires admin review
    return { status: 'pending', errorMessage: 'Facebook requires manual verification' }
  }
}

class LinkedInHandler extends DirectoryHandler {
  static directoryName = 'LinkedIn'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - phone/postcard verification
    return { status: 'pending', errorMessage: 'Requires phone/postcard verification' }
  }
}

class AppleMapsConnectHandler extends DirectoryHandler {
  static directoryName = 'Apple Maps Connect'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Manual - requires approval
    return { status: 'pending', errorMessage: 'Apple Maps requires manual verification' }
  }
}

class BetterBusinessBureauHandler extends DirectoryHandler {
  static directoryName = 'Better Business Bureau'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class TruliaHandler extends DirectoryHandler {
  static directoryName = 'Trulia'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class OpenTableHandler extends DirectoryHandler {
  static directoryName = 'OpenTable'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class ZocdocHandler extends DirectoryHandler {
  static directoryName = 'Zocdoc'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class FindLawHandler extends DirectoryHandler {
  static directoryName = 'FindLaw'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class G2Handler extends DirectoryHandler {
  static directoryName = 'G2'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class UpworkHandler extends DirectoryHandler {
  static directoryName = 'Upwork'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class ShopifyHandler extends DirectoryHandler {
  static directoryName = 'Shopify Store Locator'
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
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

class NextdoorHandler extends DirectoryHandler {
  static directoryName = 'Nextdoor'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending' }
  }
}

class AlignableHandler extends DirectoryHandler {
  static directoryName = 'Alignable'
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', emailUsed: businessData.email }
  }
}

const localBusinessDirs = [
  'Citysquares', 'LocalStack', 'LocalPin', 'Local Business Link', 'NearSay'
]

// ─── GENERATE REMAINING HANDLERS FROM TEMPLATES ───────────────────────────

const generateHandlers = (names) => {
  const handlers = {}
  names.forEach(name => {
    const className = name.replace(/[^a-zA-Z0-9]/g, '') + 'Handler'
    handlers[name] = class extends DirectoryHandler {
      static directoryName = name
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
