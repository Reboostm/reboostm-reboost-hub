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
    return { status: 'pending', errorMessage: 'Requires phone verification. Visit: https://biz.yelp.com/claim to manually claim.' }
  }
}

class YellowPagesHandler extends DirectoryHandler {
  static directoryName = 'Yellow Pages'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Requires phone verification. Visit: https://www.yellowpages.com/add-listing to manually add.' }
  }
}

class MantaHandler extends DirectoryHandler {
  static directoryName = 'Manta'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Manta blocks headless browsers (Cloudflare 403). Submit manually at https://www.manta.com/add to add your business.' }
  }
}

class HotfrogHandler extends DirectoryHandler {
  static directoryName = 'Hotfrog'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'assisted' }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Hotfrog requires account creation with email verification. Visit https://www.hotfrog.com/add to submit your business.' }
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
    return { status: 'pending', errorMessage: 'Requires Microsoft account. Visit: https://www.bingplaces.com to manually add.' }
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
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'assisted' }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'EZlocal uses a phone/name lookup flow to find existing listings before allowing new ones. Visit https://ezlocal.com/free-business-listing/ to submit manually.' }
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
// NOTE: Do NOT list names here that already have explicit handler classes above —
// the spread runs last and would silently overwrite the real handlers.
const generalDirs = [
  'YellowMoxie',
  'Switchboard', 'YellowPageCity', 'HERE Maps', 'TomTom', 'Google Maps (listing)',
  'Bing Maps', 'iGlobal', 'Salespider',
  'Americantowns', 'Storeboard', 'Tupalo', 'DirJournal',
  'Lacartes', 'Communitywalk', 'City-data', 'Geebo', 'BizQuid',
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
    return { status: 'pending', errorMessage: 'Requires pro account and phone verification. Visit: https://pro.angi.com to sign up.' }
  }
}

class AngiHandler extends DirectoryHandler {
  static directoryName = 'Angi'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Requires pro account and phone verification. Visit: https://pro.angi.com to sign up.' }
  }
}

class ThumbTackHandler extends DirectoryHandler {
  static directoryName = 'Thumbtack'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Requires pro account. Visit: https://www.thumbtack.com/pro to sign up.' }
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
    return { status: 'pending', errorMessage: 'Requires LinkedIn account. Visit: https://www.linkedin.com/company/setup/new/ to manually create.' }
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
    return { status: 'pending', errorMessage: 'Requires manual Instagram business account creation. Visit: https://www.instagram.com to set up.' }
  }
}

class FacebookBusinessHandler extends DirectoryHandler {
  static directoryName = 'Facebook Business'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Requires Facebook account. Visit: https://business.facebook.com to manually create page.' }
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
    return { status: 'pending', errorMessage: 'Requires postcard/phone verification. Visit: https://business.google.com to manually verify.' }
  }
}

class AppleMapsConnectHandler extends DirectoryHandler {
  static directoryName = 'Apple Maps Connect'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Requires Apple ID. Visit: https://mapsconnect.apple.com to manually add.' }
  }
}

class BetterBusinessBureauHandler extends DirectoryHandler {
  static directoryName = 'Better Business Bureau'
  static metadata = { priority: 1, requiresRealEmail: true, requiresManualVerification: true, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Requires manual application. Visit: https://www.bbb.org/accreditation to apply.' }
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
    return { status: 'pending', errorMessage: 'Requires address verification. Visit: https://business.nextdoor.com to manually create.' }
  }
}

class AlignableHandler extends DirectoryHandler {
  static directoryName = 'Alignable'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) { return { status: 'pending', errorMessage: 'Alignable /users/sign_up returns 404. Submit manually at https://www.alignable.com' } }
}

const localBusinessDirs = [
  'LocalStack', 'LocalPin', 'Local Business Link', 'NearSay'
]

// ─── STANDALONE HANDLERS for the 15 automatable directories not yet in explicit classes above ──

class MerchantCircleHandler extends DirectoryHandler {
  static directoryName = 'MerchantCircle'
  // reCAPTCHA v2 site key: 6LeUcv8SAAAAACMihSqwLVGPms5kQv9FaqVNm34Z
  // Step 1: fill account form (name, email, password, phone, zip, biz name) + solve reCAPTCHA
  // Step 2: fill business details (address, website, description, category)
  // Step 3: select free plan
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'automated' }
  static RECAPTCHA_SITEKEY = '6LeUcv8SAAAAACMihSqwLVGPms5kQv9FaqVNm34Z'
  static SIGNUP_URL = 'https://www.merchantcircle.com/signup'

  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    if (!captchaHandler) {
      return { status: 'pending', errorMessage: 'MerchantCircle requires reCAPTCHA solving — configure 2Captcha API key in admin dashboard to enable automated submission.' }
    }
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    const bizSlug = (businessData.businessName || 'business').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20)
    const email = businessData.listingEmail || `reboostai+${bizSlug}@gmail.com`
    const password = `Rb${Math.random().toString(36).slice(2, 10)}Mc!`
    try {
      await page.goto(MerchantCircleHandler.SIGNUP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2000)

      // Step 1: fill account form
      const nameParts = (businessData.businessName || 'Business Owner').split(' ')
      const firstName = nameParts[0] || 'Business'
      const lastName = nameParts.slice(1).join(' ') || 'Owner'
      await page.fill('#user_firstname', firstName).catch(() => {})
      await page.fill('#user_lastname', lastName).catch(() => {})
      await page.fill('#user_email', email).catch(() => {})
      await page.fill('#user_password', password).catch(() => {})
      await page.fill('#user_password_confirmation', password).catch(() => {})
      await page.fill('#__zip1', businessData.zip || '').catch(() => {})
      await page.fill('#business_name', businessData.businessName || '').catch(() => {})
      await page.fill('#business_phone', businessData.phone || '').catch(() => {})

      // Solve reCAPTCHA
      const token = await captchaHandler.solveRecaptchaV2(
        MerchantCircleHandler.RECAPTCHA_SITEKEY,
        MerchantCircleHandler.SIGNUP_URL
      )
      await page.evaluate((t) => {
        const el = document.querySelector('#g-recaptcha-response')
        if (el) {
          el.style.display = 'block'
          el.value = t
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        if (typeof window.verifyRecaptchaResponse === 'function') window.verifyRecaptchaResponse(t)
      }, token)
      await page.waitForTimeout(500)

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {}),
        page.click('button:has-text("Create my account"), button[type="submit"]'),
      ])
      await page.waitForTimeout(2000)

      const url1 = page.url()
      if (url1.includes('signup')) {
        const errText = await page.locator('[class*="error"], [class*="alert"]').allTextContents().catch(() => [])
        return { status: 'failed', errorMessage: `MerchantCircle signup failed: ${errText.join(' ').trim() || 'unknown error'}`, emailUsed: email }
      }

      // Step 2: fill business details
      await page.fill('#bizName', businessData.businessName || '').catch(() => {})
      await page.fill('#business_address', businessData.address || '').catch(() => {})
      await page.fill('#phoneNumber', businessData.phone || '').catch(() => {})
      await page.fill('#bizWebAddr', businessData.website || '').catch(() => {})
      await page.fill('#bizDesc', businessData.description || businessData.shortDesc || '').catch(() => {})
      const catInput = await page.$('#levelone, input[name="category"], select[name="category"]')
      if (catInput) {
        const tag = await catInput.evaluate(el => el.tagName.toLowerCase())
        if (tag === 'select') await page.selectOption('#levelone', { label: businessData.category || '' }).catch(() => {})
        else await page.fill('#levelone', businessData.category || '').catch(() => {})
      }
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        page.click('button[type="submit"], button:has-text("Continue"), button:has-text("Next")'),
      ])
      await page.waitForTimeout(1500)

      // Step 3: select free plan
      const freePlan = await page.$('button:has-text("Free"), a:has-text("Free"), input[value*="free" i]')
      if (freePlan) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
          freePlan.click(),
        ])
        await page.waitForTimeout(1500)
      }

      return { status: 'submitted', liveUrl: 'https://www.merchantcircle.com', emailUsed: email, accountPassword: password,
        errorMessage: 'MerchantCircle account created and basic listing submitted.' }
    } catch (err) {
      return { status: 'failed', errorMessage: err.message, emailUsed: email, accountPassword: password }
    } finally {
      await page.close()
    }
  }
}

class ShowMeLocalHandler extends DirectoryHandler {
  static directoryName = 'ShowMeLocal'
  // Registration URL confirmed: register.aspx?ReturnURL=/add-listing.aspx
  // reCAPTCHA v2 sitekey: 6LdtzyYTAAAAADVeyuff9jRrfNO-Bs7Yr6cjn8zh
  // Flow: register → reCAPTCHA → redirect to add-listing.aspx → fill listing form
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'automated' }
  static RECAPTCHA_SITEKEY = '6LdtzyYTAAAAADVeyuff9jRrfNO-Bs7Yr6cjn8zh'
  static REGISTER_URL = 'https://www.showmelocal.com/register.aspx?ReturnURL=/add-listing.aspx'

  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    if (!captchaHandler) {
      return { status: 'pending', errorMessage: 'ShowMeLocal requires reCAPTCHA — configure 2Captcha API key in admin dashboard to enable automated submission.' }
    }
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    const bizSlug = (businessData.businessName || 'business').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20)
    const email = businessData.listingEmail || `reboostai+${bizSlug}@gmail.com`
    const password = `Rb${Math.random().toString(36).slice(2, 10)}Sml!`
    try {
      await page.goto(ShowMeLocalHandler.REGISTER_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(1500)

      // Fill registration form (IDs confirmed by recon)
      const nameParts = (businessData.businessName || 'Business Owner').split(' ')
      await page.fill('#ContentPlaceHolder1_txtFirstName', nameParts[0] || 'Business').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtLastName', nameParts.slice(1).join(' ') || 'Owner').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtEmail', email).catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtPassword', password).catch(() => {})

      // Solve reCAPTCHA
      const token = await captchaHandler.solveRecaptchaV2(ShowMeLocalHandler.RECAPTCHA_SITEKEY, ShowMeLocalHandler.REGISTER_URL)
      await page.evaluate((t) => {
        const el = document.querySelector('#g-recaptcha-response, textarea[name="g-recaptcha-response"]')
        if (el) {
          el.style.display = 'block'
          el.value = t
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        if (typeof window.verifyRecaptchaResponse === 'function') window.verifyRecaptchaResponse(t)
      }, token)
      await page.waitForTimeout(500)

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {}),
        page.click('#ContentPlaceHolder1_cmdRegister'),
      ])
      await page.waitForTimeout(2000)

      const afterRegUrl = page.url()
      if (afterRegUrl.includes('register.aspx')) {
        const errText = await page.locator('[id*="lblError"], [class*="error"], [class*="alert"]').allTextContents().catch(() => [])
        return { status: 'failed', errorMessage: `ShowMeLocal registration failed: ${errText.join(' ').trim() || 'unknown error'}`, emailUsed: email }
      }

      // Should now be on add-listing.aspx
      if (!afterRegUrl.includes('add-listing')) {
        return { status: 'pending', liveUrl: 'https://www.showmelocal.com', emailUsed: email, accountPassword: password,
          errorMessage: 'ShowMeLocal account created. Visit showmelocal.com/add-listing.aspx to add your business listing.' }
      }

      // Fill the listing form (ASP.NET ContentPlaceholder pattern)
      await page.fill('#ContentPlaceHolder1_txtBizName, input[id*="BizName"], input[id*="BusinessName"]', businessData.businessName || '').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtPhone, input[id*="Phone"]', businessData.phone || '').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtAddress, input[id*="Address"]', businessData.address || '').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtCity, input[id*="City"]', businessData.city || '').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtZip, input[id*="Zip"]', businessData.zip || '').catch(() => {})
      await page.fill('#ContentPlaceHolder1_txtWebsite, input[id*="Website"], input[type="url"]', businessData.website || '').catch(() => {})
      const stateEl = await page.$('select[id*="State"], select[name*="State"]')
      if (stateEl) await page.selectOption('select[id*="State"], select[name*="State"]', businessData.state || '').catch(() => {})
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        page.click('input[type="submit"], button[type="submit"], input[id*="cmdSubmit"], input[id*="cmdSave"]').catch(() => {}),
      ])
      await page.waitForTimeout(1500)

      return { status: 'submitted', liveUrl: 'https://www.showmelocal.com', emailUsed: email, accountPassword: password,
        errorMessage: 'ShowMeLocal account created and listing submitted.' }
    } catch (err) {
      return { status: 'failed', errorMessage: err.message, emailUsed: email, accountPassword: password }
    } finally {
      await page.close()
    }
  }
}

class BrownbookHandler extends DirectoryHandler {
  static directoryName = 'Brownbook'
  // Brownbook uses react-select for Country + Category — selecting Country triggers navigation
  // away from the form, making automation unreliable. Submit manually at brownbook.net/add-business
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    return { status: 'pending', errorMessage: 'Brownbook uses complex react-select dropdowns that break headless automation. Submit manually at https://www.brownbook.net/add-business' }
  }
}

class CylexHandler extends DirectoryHandler {
  static directoryName = 'Cylex'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.cylex.us.com/signin?view=register', { waitUntil: 'domcontentloaded', timeout: 45000 })

      // Business name
      await page.waitForSelector('input[name="company"], input[name="business_name"], input[placeholder*="company" i], input[placeholder*="business name" i]', { timeout: 15000 })
      await page.fill('input[name="company"], input[name="business_name"], input[placeholder*="company" i], input[placeholder*="business name" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name="street"], input[name="address"], input[placeholder*="street" i], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="street"], input[name="address"], input[placeholder*="street" i], input[placeholder*="address" i]', businessData.address)

      // City
      const cityField = await page.$('input[name="city"], input[placeholder*="city" i]')
      if (cityField) await page.fill('input[name="city"], input[placeholder*="city" i]', businessData.city)

      // State
      const stateSelectField = await page.$('select[name="state"]')
      if (stateSelectField) {
        await page.selectOption('select[name="state"]', businessData.state)
      } else {
        const stateInputField = await page.$('input[name="state"]')
        if (stateInputField) await page.fill('input[name="state"]', businessData.state)
      }

      // Zip
      const zipField = await page.$('input[name="zip"], input[name="zipcode"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[name="zipcode"], input[placeholder*="zip" i]', businessData.zip)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Website
      const websiteField = await page.$('input[name="website"], input[name="www"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[name="www"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Category
      const catSelect = await page.$('select[name="category"]')
      if (catSelect) {
        await page.selectOption('select[name="category"]', { label: businessData.category }).catch(() => {})
      } else {
        const catInput = await page.$('input[name="category"], input[placeholder*="category" i]')
        if (catInput) await page.fill('input[name="category"], input[placeholder*="category" i]', businessData.category || '')
      }

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class N49Handler extends DirectoryHandler {
  static directoryName = 'n49'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) { return { status: 'pending', errorMessage: 'n49 biz/add URL returns 404 — site may have shut down.' } }
}

class FypleHandler extends DirectoryHandler {
  static directoryName = 'Fyple'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) { return { status: 'pending', errorMessage: 'Fyple add-business URL returns 404 — site may have shut down.' } }
}

class eLocalHandler extends DirectoryHandler {
  static directoryName = 'eLocal'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'eLocal registration URL (business-registration) returns 404 — site may have restructured. Check elocal.com for current submit path.' }
  }
}

class KudzuHandler extends DirectoryHandler {
  static directoryName = 'Kudzu'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'Kudzu domain is no longer active (DNS fails). Site appears to have shut down.' }
  }
}

class USCityNetHandler extends DirectoryHandler {
  static directoryName = 'USCity.net'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'USCity.net add-listing URL returns 404 — site may have restructured.' }
  }
}

class GetFaveHandler extends DirectoryHandler {
  static directoryName = 'GetFave'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'GetFave domain appears to be parked/inactive (GoDaddy placeholder). Site has shut down.' }
  }
}

class CityfosHandler extends DirectoryHandler {
  static directoryName = 'Cityfos'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'Cityfos is currently returning 503 Service Unavailable — site may be down or shut down.' }
  }
}

class TuugoHandler extends DirectoryHandler {
  static directoryName = 'Tuugo'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'Tuugo addCompany URL returns 404 — site may have restructured or shut down.' }
  }
}

class ZipleafHandler extends DirectoryHandler {
  static directoryName = 'Zipleaf'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) {
    return { status: 'pending', errorMessage: 'Zipleaf AddListing.aspx returns 404 — site may have shut down.' }
  }
}

class BizHWYHandler extends DirectoryHandler {
  static directoryName = 'BizHWY'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) { return { status: 'pending', errorMessage: 'BizHWY submit URL returns 404 — site appears to have shut down.' } }
}

class OodleHandler extends DirectoryHandler {
  static directoryName = 'Oodle'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) { return { status: 'pending', errorMessage: 'Oodle blocks headless browsers (Cloudflare). Submit manually at https://www.oodle.com' } }
}

class OpendiHandler extends DirectoryHandler {
  static directoryName = 'Opendi'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'manual_only' }
  async submit({ directory, businessData }) { return { status: 'pending', errorMessage: 'Opendi add.html returns 404 — site has shut down.' } }
}

class TopixHandler extends DirectoryHandler {
  static directoryName = 'Topix'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Topix is a community news aggregator — business listings are submitted via
    // city/state pages. Navigate to the city forum and post business info.
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      const citySlug = (businessData.city || '').toLowerCase().replace(/\s+/g, '-')
      const stateSlug = (businessData.state || '').toLowerCase()
      await page.goto(`https://www.topix.com/city/${citySlug}-${stateSlug}`, { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Look for a "Post" or forum submission link
      const postLink = await page.$('a:has-text("Post"), a:has-text("Add"), a:has-text("Submit"), a[href*="post"], a[href*="forum"]')
      if (postLink) {
        await postLink.click()
        await page.waitForTimeout(2000)
      }

      // Fill title/subject
      const titleField = await page.$('input[name="subject"], input[name="title"], input[placeholder*="subject" i]')
      if (titleField) await page.fill('input[name="subject"], input[name="title"], input[placeholder*="subject" i]', businessData.businessName)

      // Fill body
      const bodyField = await page.$('textarea[name="body"], textarea[name="message"], textarea[placeholder*="message" i]')
      if (bodyField) {
        const body = `${businessData.businessName} — ${businessData.category || 'Local Business'}\n` +
          `${businessData.address}, ${businessData.city}, ${businessData.state} ${businessData.zip}\n` +
          `Phone: ${businessData.phone}\n` +
          (businessData.website ? `Website: ${businessData.website}\n` : '') +
          (businessData.description || businessData.shortDesc || '')
        await page.fill('textarea[name="body"], textarea[name="message"], textarea[placeholder*="message" i]', body)
      }

      await page.click('button[type="submit"], input[type="submit"], button:has-text("Post"), button:has-text("Submit")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

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

// ─── CITYSQUARES HANDLER ─────────────────────────────────────────────────

class CitysquaresHandler extends DirectoryHandler {
  static directoryName = 'Citysquares'
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'automated' }

  static NICHE_CATEGORY = {
    'plumber': 'Contractors - Plumbers & Plumbing',
    'hvac': 'Heating, Ventilation & Air Conditioning',
    'electrician': 'Contractors - Electrical',
    'landscaping': 'Landscaping Services & Supplies',
    'lawn': 'Lawn Maintenance',
    'cleaning': 'Cleaning Services & Supplies',
    'roofing': 'Contractors - Roofing',
    'painter': 'Contractors - Painting',
    'contractor': 'Contractors - Building',
    'remodeling': 'Home Improvement & Remodeling Services',
    'realtor': 'Real Estate - Brokers & Agents',
    'dentist': 'Dentists',
    'doctor': 'Physicians - General',
    'lawyer': 'Legal Services',
    'restaurant': 'Restaurants',
    'automotive': 'Automobile - Repairs & Services',
    'pest': 'Pest & Animal Control',
    'flooring': 'Carpet & Flooring',
    'carpet': 'Carpet & Flooring',
    'mover': 'Moving Services',
    'vet': 'Veterinarians',
    'concrete': 'Contractors - Concrete',
    'sewer': 'Contractors - Sewer',
    'masonry': 'Contractors - Masonry',
    'drywall': 'Contractors - Drywall',
    'insulation': 'Contractors - Insulation',
    'paving': 'Contractors - Paving',
    'tile': 'Contractors - Tile, Marble & Granite',
    'fence': 'Fences',
    'garage': 'Garage Doors',
    'locksmith': 'Locksmiths, Safes & Vaults',
    'security': 'Security Systems & Services',
    'pool': 'Swimming Pool Construction',
  }

  static STATE_MAP = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming',
  }

  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    const bizSlug = (businessData.businessName || 'business').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20)
    const email = `reboostai+${bizSlug}@gmail.com`
    const password = `Rb${Math.random().toString(36).slice(2, 10)}Cs!`
    try {
      // Step 1: Create account
      await page.goto('https://citysquares.com/users/sign_up', { waitUntil: 'domcontentloaded', timeout: 40000 })
      await page.waitForSelector('[name="user[email]"]', { timeout: 20000 })
      await page.waitForTimeout(800)
      const nameParts = (businessData.businessName || 'Business Owner').split(' ')
      await page.fill('[name="user[email]"]', email)
      await page.fill('[name="user[first_name]"]', nameParts[0] || 'Business')
      await page.fill('[name="user[last_name]"]', nameParts.slice(1).join(' ') || 'Owner')
      await page.fill('[name="user[password]"]', password)
      await page.fill('[name="user[password_confirmation]"]', password)
      const termsBox = await page.$('#user_terms')
      if (termsBox) await page.check('#user_terms')
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        page.click('[name="commit"]'),
      ])
      await page.waitForTimeout(1500)
      if (page.url().includes('sign_up')) {
        const errText = await page.locator('[class*="error"], [class*="alert"]').allTextContents().catch(() => [])
        return { status: 'failed', errorMessage: `Citysquares signup failed: ${errText.join(' ').trim() || 'unknown error'}`, emailUsed: email, accountPassword: password }
      }

      // Step 2: Auto-click verification email if gmailHandler available
      if (gmailHandler) {
        const links = await this.waitForEmailVerification(gmailHandler, email, 90)
        if (links.length > 0) {
          await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 20000 })
          await page.waitForTimeout(1000)
        }
      }

      // Step 3: Navigate to listings/new and fill the full business form
      await page.goto('https://citysquares.com/listings/new', { waitUntil: 'domcontentloaded', timeout: 20000 })
      await page.waitForTimeout(2000)

      await page.fill('#listing_name', businessData.businessName || '').catch(() => {})
      await page.fill('#listing_address', businessData.address || '').catch(() => {})
      await page.fill('#listing_postal_code', businessData.zip || '').catch(() => {})
      await page.fill('#listing_phone_numbers_attributes_0_formatted', businessData.phone || '').catch(() => {})
      await page.fill('#listing_description', businessData.description || businessData.shortDesc || '').catch(() => {})
      await page.fill('#email_0', email).catch(() => {})
      await page.fill('#url_0', businessData.website || '').catch(() => {})
      await page.fill('#listing_services', businessData.niche || '').catch(() => {})

      // State → wait for city AJAX → city
      const stateLabel = CitysquaresHandler.STATE_MAP[businessData.state?.toUpperCase()] || businessData.state || ''
      if (stateLabel) {
        await page.selectOption('#states_select', { label: stateLabel }).catch(() => {})
        await page.waitForFunction(
          () => (document.querySelector('#cities_select')?.options?.length || 0) > 1,
          { timeout: 8000 }
        ).catch(() => {})
        if (businessData.city) {
          await page.selectOption('#cities_select', { label: businessData.city }).catch(() => {})
        }
      }

      // Category: find best match for business niche
      const nicheKey = Object.keys(CitysquaresHandler.NICHE_CATEGORY).find(k =>
        businessData.niche?.toLowerCase().includes(k)
      )
      if (nicheKey) {
        const categoryKeyword = CitysquaresHandler.NICHE_CATEGORY[nicheKey]
        const options = await page.$$eval('#listing_category_id option',
          opts => opts.map(o => ({ value: o.value, text: o.text }))
        ).catch(() => [])
        const match = options.find(o => o.text.includes(categoryKeyword))
        if (match?.value) await page.selectOption('#listing_category_id', match.value).catch(() => {})
      }

      // Submit
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {}),
        page.click('button:has-text("Create Listing"), input[type="submit"]').catch(() => {}),
      ])
      await page.waitForTimeout(2000)

      const finalUrl = page.url()
      const success = !finalUrl.includes('/new') && !finalUrl.includes('/sign')
      return {
        status: success ? 'submitted' : 'pending',
        liveUrl: success ? finalUrl : 'https://citysquares.com/listings/new',
        emailUsed: email,
        accountPassword: password,
        errorMessage: success
          ? 'Citysquares listing created successfully.'
          : 'Citysquares account created. Complete listing at citysquares.com/listings/new',
      }
    } catch (err) {
      return { status: 'failed', errorMessage: err.message, emailUsed: email, accountPassword: password }
    } finally {
      await page.close()
    }
  }
}

// ─── IBEGIN HANDLER ───────────────────────────────────────────────────────

class iBeginHandler extends DirectoryHandler {
  static directoryName = 'iBegin'
  // Cloudflare JS challenge present — page load intermittent headlessly (45s+ timeout)
  static metadata = { priority: 3, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0, automationTag: 'assisted' }

  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    const bizSlug = (businessData.businessName || 'business').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 20)
    const email = `reboostai+${bizSlug}@gmail.com`
    const password = `Rb${Math.random().toString(36).slice(2, 10)}Ib!`
    try {
      await page.goto('https://www.ibegin.com/account/register/', { waitUntil: 'domcontentloaded', timeout: 40000 })
      const html = await page.content()
      if (html.includes('Checking your browser') || html.includes('Just a moment')) {
        return { status: 'pending', errorMessage: 'iBegin temporarily blocked by Cloudflare — retry later or submit manually at ibegin.com/account/register/', emailUsed: email }
      }
      // Fill via JS injection (fill() times out due to visibility issues)
      // SKIPS [name="liame"] — that is a honeypot field
      await page.evaluate(({ name, emailAddr, pw }) => {
        const setVal = (el, val) => {
          if (!el) return false
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          if (nativeSetter) nativeSetter.call(el, val)
          else el.value = val
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
          return true
        }
        setVal(document.querySelector('input[name="name"]'), name)
        setVal(document.querySelector('input[name="email"]'), emailAddr)
        setVal(document.querySelector('input[name="pw"]'), pw)
      }, { name: businessData.businessName || 'Business Owner', emailAddr: email, pw: password })
      await page.waitForTimeout(800)
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        page.click('input[type="submit"], button[type="submit"]'),
      ])
      await page.waitForTimeout(1500)
      const resultUrl = page.url()
      if (resultUrl.includes('register')) {
        const errText = await page.locator('.error, .alert, .message, [class*="error"], [class*="alert"]').allTextContents().catch(() => [])
        const reason = errText.filter(Boolean).join(' ').trim() || 'form did not advance — possible validation error or missing field'
        return { status: 'failed', errorMessage: `iBegin: ${reason}`, emailUsed: email }
      }
      return { status: 'pending', liveUrl: resultUrl, emailUsed: email, accountPassword: password,
        errorMessage: 'iBegin account created. Check reboostai inbox for verification email.' }
    } catch (err) {
      const isTimeout = err.message.includes('Timeout') || err.message.includes('timeout')
      return {
        status: isTimeout ? 'pending' : 'failed',
        errorMessage: isTimeout
          ? 'iBegin page load timed out (Cloudflare) — will retry on next run or submit manually at ibegin.com/account/register/'
          : err.message,
        emailUsed: email,
        accountPassword: password,
      }
    } finally {
      await page.close()
    }
  }
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
  'MerchantCircle': MerchantCircleHandler,
  'Citysquares': CitysquaresHandler,
  'iBegin': iBeginHandler,
  'ShowMeLocal': ShowMeLocalHandler,
  'Brownbook': BrownbookHandler,
  'Cylex': CylexHandler,
  'n49': N49Handler,
  'Fyple': FypleHandler,
  'GetFave': GetFaveHandler,
  'Cityfos': CityfosHandler,
  'Alignable': AlignableHandler,
  'Tuugo': TuugoHandler,
  'Zipleaf': ZipleafHandler,
  'BizHWY': BizHWYHandler,
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
  'Oodle': OodleHandler,
  'Opendi': OpendiHandler,
  'Topix': TopixHandler,
  'eLocal': eLocalHandler,
  'Kudzu': KudzuHandler,
  'USCity.net': USCityNetHandler,

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
