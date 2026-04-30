const { chromium } = require('playwright')

// ─── Base Handler ────────────────────────────────────────────────────────────

class DirectoryHandler {
  constructor(directoryName) {
    this.directoryName = directoryName
    this.browser = null
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    }
    return this.browser
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Main submission method - override in subclasses
   * Returns: { status: 'live'|'pending'|'failed', liveUrl?, emailUsed?, errorMessage? }
   */
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    throw new Error('submit() must be implemented by subclass')
  }
}

// ─── Yelp Handler ────────────────────────────────────────────────────────────

class YelpHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[YELP] Starting submission for ${businessData.businessName}...`)

    // TODO: Implement Yelp submission
    // 1. Navigate to yelp.com
    // 2. Search for business (if exists, mark as 'live')
    // 3. If not found, fill out new listing form
    // 4. Handle verification email
    // 5. Return result

    return {
      status: 'pending',
      liveUrl: null,
      emailUsed: businessData.email,
      errorMessage: 'Yelp handler not yet implemented',
    }
  }
}

// ─── Yellow Pages Handler ────────────────────────────────────────────────────

class YellowPagesHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[YELLOWPAGES] Starting submission for ${businessData.businessName}...`)

    // TODO: Implement Yellow Pages submission
    // 1. Navigate to yellowpages.com
    // 2. Check if business exists
    // 3. If not, fill out free listing form
    // 4. Handle verification
    // 5. Return result

    return {
      status: 'pending',
      liveUrl: null,
      emailUsed: businessData.email,
      errorMessage: 'Yellow Pages handler not yet implemented',
    }
  }
}

// ─── Manta Handler ───────────────────────────────────────────────────────────

class MantaHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[MANTA] Starting submission for ${businessData.businessName}...`)

    // TODO: Implement Manta submission
    // 1. Navigate to manta.com
    // 2. Search for business
    // 3. Claim or create listing
    // 4. Fill company details form
    // 5. Handle verification
    // 6. Return result

    return {
      status: 'pending',
      liveUrl: null,
      emailUsed: businessData.email,
      errorMessage: 'Manta handler not yet implemented',
    }
  }
}

// ─── Hotfrog Handler ─────────────────────────────────────────────────────────

class HotfrogHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[HOTFROG] Starting submission for ${businessData.businessName}...`)

    // TODO: Implement Hotfrog submission
    // 1. Navigate to hotfrog.com
    // 2. Search for business
    // 3. If not found, create new listing
    // 4. Fill form with NAP + description
    // 5. Handle verification email
    // 6. Return result

    return {
      status: 'pending',
      liveUrl: null,
      emailUsed: businessData.email,
      errorMessage: 'Hotfrog handler not yet implemented',
    }
  }
}

// ─── Superpages Handler ──────────────────────────────────────────────────────

class SuperpagesHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[SUPERPAGES] Starting submission for ${businessData.businessName}...`)

    // TODO: Implement Superpages submission
    // Free listings available for most business types
    // 1. Navigate to superpages.com
    // 2. Add business form
    // 3. Fill details
    // 4. Verify email
    // 5. Return result

    return {
      status: 'pending',
      liveUrl: null,
      emailUsed: businessData.email,
      errorMessage: 'Superpages handler not yet implemented',
    }
  }
}

// ─── Bing Places Handler ─────────────────────────────────────────────────────

class BingPlacesHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[BINGPLACES] Starting submission for ${businessData.businessName}...`)

    // TODO: Implement Bing Places submission
    // 1. Navigate to bingplaces.com
    // 2. Search for business
    // 3. Add or claim listing
    // 4. Fill details
    // 5. Verify
    // 6. Return result

    return {
      status: 'pending',
      liveUrl: null,
      emailUsed: businessData.email,
      errorMessage: 'Bing Places handler not yet implemented',
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

const HANDLERS = {
  'Yelp': YelpHandler,
  'Yellow Pages': YellowPagesHandler,
  'Manta': MantaHandler,
  'Hotfrog': HotfrogHandler,
  'Superpages': SuperpagesHandler,
  'Bing Places': BingPlacesHandler,

  // TODO: Add more handlers for remaining ~95 directories
  // Priority 1: HomeAdvisor, Angi, Thumbtack, Foursquare, MapQuest, etc.
  // Priority 2: Neustar, Infogroup, DnB, LinkedIn, Houzz, Porch, Bark, etc.
  // Priority 3: Cylex, Tuugo, Topix, Opendi, iGlobal, Americantowns, etc.
}

function getDirectoryHandler(directoryName) {
  const HandlerClass = HANDLERS[directoryName]

  if (!HandlerClass) {
    // Return a generic handler that marks as 'pending' (manual review needed)
    return new DirectoryHandler(directoryName)
  }

  return new HandlerClass(directoryName)
}

module.exports = { getDirectoryHandler, DirectoryHandler }
