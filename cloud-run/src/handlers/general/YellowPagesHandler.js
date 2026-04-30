const { DirectoryHandler } = require('../baseHandler')

class YellowPagesHandler extends DirectoryHandler {
  static directoryName = 'Yellow Pages'

  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      await page.goto('https://www.yellowpages.com', { waitUntil: 'networkidle', timeout: 10000 })

      // Click "Add Business" button
      await page.click('[data-test-id="add-business-button"]').catch(() => {})
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {})

      // Fill business name
      await this.fillField(page, 'input[name="businessName"]', businessData.businessName)
      await this.fillField(page, 'input[name="phone"]', businessData.phone)
      await this.fillField(page, 'input[name="address"]', businessData.address)
      await this.fillField(page, 'input[name="city"]', businessData.city)
      await this.fillField(page, 'input[name="state"]', businessData.state)
      await this.fillField(page, 'input[name="zip"]', businessData.zip)

      // Handle CAPTCHA if present
      const hasCaptcha = await page.$('g-recaptcha') !== null
      if (hasCaptcha && captchaHandler) {
        const sitekey = await page.getAttribute('g-recaptcha', 'data-sitekey')
        const token = await captchaHandler.solveRecaptchaV2(sitekey, page.url())
        await page.evaluate(t => {
          document.getElementById('g-recaptcha-response').value = t
        }, token)
      }

      // Submit form
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {})

      // Wait for confirmation page
      const isConfirmed = await page.$('text=Thank you') !== null

      // Yellow Pages requires phone verification, so mark as pending
      return {
        status: 'pending',
        liveUrl: page.url(),
        emailUsed: businessData.email,
        errorMessage: 'Yellow Pages requires phone verification to activate listing',
      }
    } catch (err) {
      return {
        status: 'failed',
        errorMessage: err.message,
      }
    } finally {
      await page.close()
    }
  }
}

module.exports = YellowPagesHandler
