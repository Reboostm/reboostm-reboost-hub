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
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://app.manta.com/companies/new', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Fill business name
      await page.waitForSelector('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', { timeout: 15000 })
      await page.fill('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', businessData.businessName)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[placeholder*="phone" i], input[type="tel"]')
      if (phoneField) await page.fill('input[name="phone"], input[placeholder*="phone" i], input[type="tel"]', businessData.phone)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i], input[id*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i], input[id*="address" i]', businessData.address)

      // City
      const cityField = await page.$('input[name="city"], input[placeholder*="city" i]')
      if (cityField) await page.fill('input[name="city"], input[placeholder*="city" i]', businessData.city)

      // State
      const stateField = await page.$('select[name="state"], input[name="state"]')
      if (stateField) {
        const tag = await stateField.evaluate(el => el.tagName.toLowerCase())
        if (tag === 'select') {
          await page.selectOption('select[name="state"]', businessData.state)
        } else {
          await page.fill('input[name="state"]', businessData.state)
        }
      }

      // Zip
      const zipField = await page.$('input[name="zip"], input[name="postal_code"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[name="postal_code"], input[placeholder*="zip" i]', businessData.zip)

      // Website
      const websiteField = await page.$('input[name="website"], input[placeholder*="website" i], input[type="url"]')
      if (websiteField) await page.fill('input[name="website"], input[placeholder*="website" i], input[type="url"]', businessData.website || '')

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Category
      const catField = await page.$('input[name="category"], input[placeholder*="category" i], input[placeholder*="industry" i]')
      if (catField) await page.fill('input[name="category"], input[placeholder*="category" i], input[placeholder*="industry" i]', businessData.category || '')

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Business"), button:has-text("Create")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class HotfrogHandler extends DirectoryHandler {
  static directoryName = 'Hotfrog'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.hotfrog.com/addbusiness', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="businessName"], input[placeholder*="business name" i], input[id*="businessName" i]', { timeout: 15000 })
      await page.fill('input[name="businessName"], input[placeholder*="business name" i], input[id*="businessName" i]', businessData.businessName)

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i]', businessData.address)

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
      const zipField = await page.$('input[name="zip"], input[name="postCode"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[name="postCode"], input[placeholder*="zip" i]', businessData.zip)

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Description
      const descField = await page.$('textarea[name="description"], textarea[placeholder*="description" i]')
      if (descField) await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', businessData.description || businessData.shortDesc || '')

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
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://ezlocal.com/register', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i]', { timeout: 15000 })
      await page.fill('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i]', businessData.businessName)

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i]', businessData.address)

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

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Category
      const catField = await page.$('input[name="category"], select[name="category"]')
      if (catField) {
        const tag = await catField.evaluate(el => el.tagName.toLowerCase())
        if (tag === 'select') {
          // try selecting by visible text
          await page.selectOption('select[name="category"]', { label: businessData.category }).catch(() => {})
        } else {
          await page.fill('input[name="category"]', businessData.category || '')
        }
      }

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
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
  'Kudzu', 'YellowMoxie', 'eLocal', 'USCity.net',
  'Switchboard', 'YellowPageCity', 'HERE Maps', 'TomTom', 'Google Maps (listing)',
  'Bing Maps', 'iGlobal', 'Salespider',
  'Americantowns', 'Storeboard', 'Tupalo', 'DirJournal',
  'Lacartes', 'iBegin', 'Communitywalk', 'City-data', 'Geebo', 'BizQuid',
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
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.alignable.com/users/sign_up', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // First name — split businessName as a proxy
      const nameParts = (businessData.businessName || '').split(' ')
      const firstName = nameParts[0] || 'Business'
      const lastName = nameParts.slice(1).join(' ') || 'Owner'

      const firstNameField = await page.$('input[name="user[first_name]"], input[placeholder*="first name" i], input[id*="first_name" i]')
      if (firstNameField) await page.fill('input[name="user[first_name]"], input[placeholder*="first name" i], input[id*="first_name" i]', firstName)

      const lastNameField = await page.$('input[name="user[last_name]"], input[placeholder*="last name" i], input[id*="last_name" i]')
      if (lastNameField) await page.fill('input[name="user[last_name]"], input[placeholder*="last name" i], input[id*="last_name" i]', lastName)

      // Email
      const emailField = await page.$('input[name="user[email]"], input[type="email"]')
      if (emailField) await page.fill('input[name="user[email]"], input[type="email"]', businessData.listingEmail)

      // Password
      const passwordField = await page.$('input[name="user[password]"], input[type="password"]')
      if (passwordField) await page.fill('input[name="user[password]"], input[type="password"]', businessData.listingPassword)

      // Business name
      const bizField = await page.$('input[name="business[name]"], input[placeholder*="business name" i]')
      if (bizField) await page.fill('input[name="business[name]"], input[placeholder*="business name" i]', businessData.businessName)

      // Zip
      const zipField = await page.$('input[name="business[zip]"], input[name="zip"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="business[zip]"], input[name="zip"], input[placeholder*="zip" i]', businessData.zip)

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Sign Up"), button:has-text("Join")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

const localBusinessDirs = [
  'Citysquares', 'LocalStack', 'LocalPin', 'Local Business Link', 'NearSay'
]

// ─── STANDALONE HANDLERS for the 15 automatable directories not yet in explicit classes above ──

class MerchantCircleHandler extends DirectoryHandler {
  static directoryName = 'MerchantCircle'
  static metadata = { priority: 1, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.merchantcircle.com/signup', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i]', { timeout: 15000 })
      await page.fill('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i]', businessData.businessName)

      // Zip
      const zipField = await page.$('input[name="zip"], input[name="postal_code"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[name="postal_code"], input[placeholder*="zip" i]', businessData.zip)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Password
      const passwordField = await page.$('input[name="password"], input[type="password"]')
      if (passwordField) await page.fill('input[name="password"], input[type="password"]', businessData.listingPassword)

      // Category (may be a select or text input)
      const catSelect = await page.$('select[name="category"]')
      if (catSelect) {
        await page.selectOption('select[name="category"]', { label: businessData.category }).catch(() => {})
      } else {
        const catInput = await page.$('input[name="category"], input[placeholder*="category" i]')
        if (catInput) await page.fill('input[name="category"], input[placeholder*="category" i]', businessData.category || '')
      }

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Sign Up"), button:has-text("Create"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class ShowMeLocalHandler extends DirectoryHandler {
  static directoryName = 'ShowMeLocal'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.showmelocal.com/addlisting', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="businessName"], input[placeholder*="business name" i], input[id*="businessName" i]', { timeout: 15000 })
      await page.fill('input[name="businessName"], input[placeholder*="business name" i], input[id*="businessName" i]', businessData.businessName)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i], input[id*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i], input[id*="address" i]', businessData.address)

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
      const zipField = await page.$('input[name="zip"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[placeholder*="zip" i]', businessData.zip)

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

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
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Listing"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class BrownbookHandler extends DirectoryHandler {
  static directoryName = 'Brownbook'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.brownbook.net/add-business', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i], input[id*="businessName" i]', { timeout: 15000 })
      await page.fill('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i], input[id*="businessName" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i], input[id*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i], input[id*="address" i]', `${businessData.address}, ${businessData.city}, ${businessData.state} ${businessData.zip}`)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i], input[placeholder*="url" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i], input[placeholder*="url" i]', businessData.website || '')

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Business"), button:has-text("Save")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class CylexHandler extends DirectoryHandler {
  static directoryName = 'Cylex'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.cylex.us.com/signin?view=register', { waitUntil: 'domcontentloaded', timeout: 30000 })

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
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://n49.com/biz/add', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', { timeout: 15000 })
      await page.fill('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', businessData.businessName)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i]', businessData.address)

      // City
      const cityField = await page.$('input[name="city"], input[placeholder*="city" i]')
      if (cityField) await page.fill('input[name="city"], input[placeholder*="city" i]', businessData.city)

      // State
      const stateSelectField = await page.$('select[name="state"], select[name="province"]')
      if (stateSelectField) {
        await page.selectOption('select[name="state"], select[name="province"]', businessData.state)
      } else {
        const stateInputField = await page.$('input[name="state"]')
        if (stateInputField) await page.fill('input[name="state"]', businessData.state)
      }

      // Category
      const catSelect = await page.$('select[name="category"]')
      if (catSelect) {
        await page.selectOption('select[name="category"]', { label: businessData.category }).catch(() => {})
      } else {
        const catInput = await page.$('input[name="category"], input[placeholder*="category" i]')
        if (catInput) await page.fill('input[name="category"], input[placeholder*="category" i]', businessData.category || '')
      }

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add"), button:has-text("Save")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class FypleHandler extends DirectoryHandler {
  static directoryName = 'Fyple'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.fyple.com/add-business/', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', { timeout: 15000 })
      await page.fill('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i]', businessData.address)

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
      const zipField = await page.$('input[name="zip"], input[name="postal_code"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[name="postal_code"], input[placeholder*="zip" i]', businessData.zip)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Description
      const descField = await page.$('textarea[name="description"], textarea[placeholder*="description" i]')
      if (descField) await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', businessData.description || businessData.shortDesc || '')

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Business"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class GetFaveHandler extends DirectoryHandler {
  static directoryName = 'GetFave'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.getfave.com/addlisting', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', { timeout: 15000 })
      await page.fill('input[name="name"], input[placeholder*="business name" i], input[id*="name" i]', businessData.businessName)

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
      const zipField = await page.$('input[name="zip"], input[placeholder*="zip" i]')
      if (zipField) await page.fill('input[name="zip"], input[placeholder*="zip" i]', businessData.zip)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

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
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class CityfosHandler extends DirectoryHandler {
  static directoryName = 'Cityfos'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.cityfos.com/add-your-business', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i]', { timeout: 15000 })
      await page.fill('input[name="business_name"], input[placeholder*="business name" i], input[id*="business_name" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i]', businessData.address)

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
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Description
      const descField = await page.$('textarea[name="description"], textarea[placeholder*="description" i]')
      if (descField) await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', businessData.description || businessData.shortDesc || '')

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

class TuugoHandler extends DirectoryHandler {
  static directoryName = 'Tuugo'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.tuugo.us/addCompany', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="name"], input[placeholder*="company name" i], input[placeholder*="business name" i], input[id*="name" i]', { timeout: 15000 })
      await page.fill('input[name="name"], input[placeholder*="company name" i], input[placeholder*="business name" i], input[id*="name" i]', businessData.businessName)

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

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]', businessData.phone)

      // Website
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Description
      const descField = await page.$('textarea[name="description"], textarea[placeholder*="description" i], textarea[name="about"]')
      if (descField) await page.fill('textarea[name="description"], textarea[placeholder*="description" i], textarea[name="about"]', businessData.description || businessData.shortDesc || '')

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Company"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class ZipleafHandler extends DirectoryHandler {
  static directoryName = 'Zipleaf'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.zipleaf.us/AddListing.aspx', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name*="BusinessName" i], input[id*="BusinessName" i], input[placeholder*="business name" i]', { timeout: 15000 })
      await page.fill('input[name*="BusinessName" i], input[id*="BusinessName" i], input[placeholder*="business name" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name*="Address" i]:not([name*="Email" i]), input[id*="Address" i]:not([id*="Email" i]), input[placeholder*="address" i]')
      if (addressField) {
        const sel = 'input[name*="Address" i]:not([name*="Email" i])'
        await page.fill(sel, businessData.address).catch(() => {})
      }

      // Phone
      const phoneField = await page.$('input[name*="Phone" i], input[id*="Phone" i], input[type="tel"]')
      if (phoneField) await page.fill('input[name*="Phone" i], input[id*="Phone" i], input[type="tel"]', businessData.phone)

      // Website
      const websiteField = await page.$('input[name*="Website" i], input[id*="Website" i], input[type="url"]')
      if (websiteField) await page.fill('input[name*="Website" i], input[id*="Website" i], input[type="url"]', businessData.website || '')

      // Email
      const emailField = await page.$('input[name*="Email" i], input[id*="Email" i], input[type="email"]')
      if (emailField) await page.fill('input[name*="Email" i], input[id*="Email" i], input[type="email"]', businessData.listingEmail)

      // Submit
      await page.click('input[type="submit"], button[type="submit"], button:has-text("Submit"), button:has-text("Add"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class BizHWYHandler extends DirectoryHandler {
  static directoryName = 'BizHWY'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.bizhwy.com/submit-business.php', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="company"], input[name="business_name"], input[placeholder*="business name" i], input[placeholder*="company name" i]', { timeout: 15000 })
      await page.fill('input[name="company"], input[name="business_name"], input[placeholder*="business name" i], input[placeholder*="company name" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name="address"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[placeholder*="address" i]', businessData.address)

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
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Category
      const catSelect = await page.$('select[name="category"]')
      if (catSelect) {
        await page.selectOption('select[name="category"]', { label: businessData.category }).catch(() => {})
      } else {
        const catInput = await page.$('input[name="category"], input[placeholder*="category" i]')
        if (catInput) await page.fill('input[name="category"], input[placeholder*="category" i]', businessData.category || '')
      }

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Business")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class OodleHandler extends DirectoryHandler {
  static directoryName = 'Oodle'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.oodle.com/listings/manage/', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="title"], input[placeholder*="title" i], input[placeholder*="business name" i]', { timeout: 15000 })
      await page.fill('input[name="title"], input[placeholder*="title" i], input[placeholder*="business name" i]', businessData.businessName)

      // Location / City
      const cityField = await page.$('input[name="city"], input[name="location"], input[placeholder*="city" i], input[placeholder*="location" i]')
      if (cityField) await page.fill('input[name="city"], input[name="location"], input[placeholder*="city" i], input[placeholder*="location" i]', `${businessData.city}, ${businessData.state}`)

      // Phone
      const phoneField = await page.$('input[name="phone"], input[type="tel"]')
      if (phoneField) await page.fill('input[name="phone"], input[type="tel"]', businessData.phone)

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Description
      const descField = await page.$('textarea[name="description"], textarea[name="body"], textarea[placeholder*="description" i]')
      if (descField) await page.fill('textarea[name="description"], textarea[name="body"], textarea[placeholder*="description" i]', businessData.description || businessData.shortDesc || '')

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Post"), button:has-text("Add")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
}

class OpendiHandler extends DirectoryHandler {
  static directoryName = 'Opendi'
  static metadata = { priority: 2, requiresRealEmail: false, requiresManualVerification: false, isAggregator: false, aggregatorReach: 0 }
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    try {
      await page.goto('https://www.opendi.us/add.html', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Business name
      await page.waitForSelector('input[name="name"], input[name="business_name"], input[placeholder*="business name" i]', { timeout: 15000 })
      await page.fill('input[name="name"], input[name="business_name"], input[placeholder*="business name" i]', businessData.businessName)

      // Address
      const addressField = await page.$('input[name="address"], input[name="street"], input[placeholder*="address" i]')
      if (addressField) await page.fill('input[name="address"], input[name="street"], input[placeholder*="address" i]', businessData.address)

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
      const websiteField = await page.$('input[name="website"], input[type="url"], input[placeholder*="website" i]')
      if (websiteField) await page.fill('input[name="website"], input[type="url"], input[placeholder*="website" i]', businessData.website || '')

      // Email
      const emailField = await page.$('input[name="email"], input[type="email"]')
      if (emailField) await page.fill('input[name="email"], input[type="email"]', businessData.listingEmail)

      // Submit
      await page.click('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Add Business"), button:has-text("Register")')
      await page.waitForTimeout(3000)

      return { status: 'pending', emailUsed: businessData.listingEmail }
    } catch (err) {
      return { status: 'pending', errorMessage: err.message }
    } finally {
      await page.close()
    }
  }
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
