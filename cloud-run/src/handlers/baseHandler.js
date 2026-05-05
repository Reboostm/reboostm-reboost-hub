const { chromium } = require('playwright-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
chromium.use(StealthPlugin())

class DirectoryHandler {
  constructor(directoryName) {
    this.directoryName = directoryName
    this.browser = null
  }

  async getBrowser() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
        ],
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
   * @param {Object} params
   * @param {Object} params.directory - Directory info { name, url, category, priority }
   * @param {Object} params.businessData - Business info { businessName, phone, address, email, etc. }
   * @param {Object} params.gmailHandler - Gmail handler for verification email watching
   * @param {Object} params.captchaHandler - 2Captcha handler for CAPTCHA solving
   * @returns {Object} { status: 'live'|'pending'|'failed', liveUrl?, emailUsed?, errorMessage? }
   */
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    // Generic handler: mark as pending (manual review needed)
    return {
      status: 'pending',
      errorMessage: `${this.directoryName} handler not yet implemented. Manual submission required.`,
    }
  }

  /**
   * Wait for verification email and extract links.
   * Starts the watcher if not already watching.
   */
  async waitForEmailVerification(gmailHandler, email, timeoutSec = 300) {
    if (!gmailHandler) return []

    // Start watcher for this inbox if not already running
    if (!gmailHandler.watchers[email]) {
      const bizSlug = email.replace(/reboostai\+/, '').replace(/@.*/, '')
      gmailHandler.watchAlias(bizSlug, email)
    }

    const startTime = Date.now()
    const timeout = timeoutSec * 1000

    while (Date.now() - startTime < timeout) {
      const links = gmailHandler.getPendingLinks(email)
      if (links.length > 0) return links
      await new Promise(r => setTimeout(r, 10000))  // Check every 10s
    }

    return []
  }

  /**
   * Detect Cloudflare/bot challenge pages — returns true if blocked
   */
  async detectBotChallenge(page) {
    const title = await page.title().catch(() => '')
    const html = await page.content().catch(() => '')
    const blocked = title.includes('Just a moment') ||
      title.includes('Attention Required') ||
      html.includes('Checking your browser') ||
      html.includes('cf-browser-verification') ||
      html.includes('Enable JavaScript and cookies') ||
      html.includes('cf_chl_opt')
    if (blocked) {
      console.log(`[HANDLER] Bot challenge detected on page (title: "${title}")`)
    }
    return blocked
  }

  /**
   * Inject a solved reCAPTCHA token into the page and trigger the widget callback
   */
  async injectRecaptchaToken(page, token) {
    await page.evaluate((t) => {
      // Set every g-recaptcha-response textarea on the page
      document.querySelectorAll('textarea[name="g-recaptcha-response"], #g-recaptcha-response').forEach(el => {
        el.style.display = 'block'
        el.value = t
        el.dispatchEvent(new Event('change', { bubbles: true }))
        el.dispatchEvent(new Event('input', { bubbles: true }))
      })

      // Trigger via data-callback attribute (most reliable approach)
      document.querySelectorAll('[data-callback]').forEach(widget => {
        const cb = widget.getAttribute('data-callback')
        if (cb && typeof window[cb] === 'function') window[cb](t)
      })

      // Try common callback names used by various sites
      ;['verifyRecaptchaResponse', 'onCaptchaSuccess', 'recaptchaCallback', 'onRecaptchaSuccess',
        'verifyCallback', 'captchaCallback'].forEach(name => {
        if (typeof window[name] === 'function') window[name](t)
      })
    }, token)
  }

  /**
   * Helper: safely fill form field
   */
  async fillField(page, selector, value) {
    try {
      const element = await page.$(selector)
      if (element) {
        await page.fill(selector, value)
        return true
      }
      return false
    } catch (err) {
      console.error(`Error filling ${selector}:`, err.message)
      return false
    }
  }

  /**
   * Helper: safely click element
   */
  async clickElement(page, selector, waitNav = false) {
    try {
      await page.click(selector)
      if (waitNav) {
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 5000 }).catch(() => {})
      }
      return true
    } catch (err) {
      console.error(`Error clicking ${selector}:`, err.message)
      return false
    }
  }

  /**
   * Helper: wait for element with fallback
   */
  async waitForElement(page, selector, timeoutMs = 5000) {
    try {
      await page.waitForSelector(selector, { timeout: timeoutMs })
      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = { DirectoryHandler }
