const axios = require('axios')

class CaptchaHandler {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: 'http://2captcha.com',
      timeout: 120000,
    })
  }

  /**
   * Solve a reCAPTCHA v2 (image-based)
   * @param {string} imageBase64 - Base64-encoded image
   * @returns {string} - Captcha text solution
   */
  async solveImageCaptcha(imageBase64) {
    try {
      console.log('[2CAPTCHA] Solving image captcha...')

      // Upload image
      const uploadRes = await this.client.post('/in.php', {
        method: 'base64',
        apikey: this.apiKey,
        captchafile: imageBase64,
      })

      const captchaId = this.parseCaptchaId(uploadRes.data)
      if (!captchaId) {
        throw new Error(`Failed to upload captcha: ${uploadRes.data}`)
      }

      console.log(`[2CAPTCHA] Captcha ID: ${captchaId}`)

      // Poll for result (up to 2 minutes)
      return await this.pollResult(captchaId, 120)
    } catch (err) {
      console.error('[2CAPTCHA] Error solving image captcha:', err.message)
      throw err
    }
  }

  /**
   * Solve reCAPTCHA v2 (JavaScript-based)
   * @param {string} sitekey - reCAPTCHA site key
   * @param {string} pageurl - Page URL containing the CAPTCHA
   * @returns {string} - g-recaptcha-response token
   */
  async solveRecaptchaV2(sitekey, pageurl) {
    try {
      console.log('[2CAPTCHA] Solving reCAPTCHA v2...')

      // Submit reCAPTCHA
      const uploadRes = await this.client.post('/in.php', {
        method: 'userrecaptcha',
        apikey: this.apiKey,
        googlekey: sitekey,
        pageurl,
      })

      const captchaId = this.parseCaptchaId(uploadRes.data)
      if (!captchaId) {
        throw new Error(`Failed to upload reCAPTCHA: ${uploadRes.data}`)
      }

      console.log(`[2CAPTCHA] reCAPTCHA ID: ${captchaId}`)

      // Poll for result (up to 3 minutes)
      return await this.pollResult(captchaId, 180)
    } catch (err) {
      console.error('[2CAPTCHA] Error solving reCAPTCHA v2:', err.message)
      throw err
    }
  }

  /**
   * Solve hCaptcha
   * @param {string} sitekey - hCaptcha site key
   * @param {string} pageurl - Page URL containing the CAPTCHA
   * @returns {string} - hCaptcha response token
   */
  async solveHCaptcha(sitekey, pageurl) {
    try {
      console.log('[2CAPTCHA] Solving hCaptcha...')

      const uploadRes = await this.client.post('/in.php', {
        method: 'hcaptcha',
        apikey: this.apiKey,
        sitekey,
        pageurl,
      })

      const captchaId = this.parseCaptchaId(uploadRes.data)
      if (!captchaId) {
        throw new Error(`Failed to upload hCaptcha: ${uploadRes.data}`)
      }

      console.log(`[2CAPTCHA] hCaptcha ID: ${captchaId}`)

      // Poll for result
      return await this.pollResult(captchaId, 180)
    } catch (err) {
      console.error('[2CAPTCHA] Error solving hCaptcha:', err.message)
      throw err
    }
  }

  /**
   * Poll for captcha result
   */
  async pollResult(captchaId, maxWaitSeconds) {
    const pollInterval = 3000 // 3 seconds
    const maxAttempts = Math.ceil(maxWaitSeconds / (pollInterval / 1000))

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await this.client.get('/res.php', {
          params: {
            apikey: this.apiKey,
            action: 'get',
            id: captchaId,
            json: 1,
          },
        })

        if (res.data.status === 0) {
          // Not ready yet
          console.log(`[2CAPTCHA] Status for ${captchaId}: pending (${i + 1}/${maxAttempts})`)
          await this.sleep(pollInterval)
          continue
        }

        if (res.data.status === 1) {
          // Solved
          console.log(`[2CAPTCHA] Solved: ${captchaId}`)
          return res.data.request
        }

        // Error
        throw new Error(`2Captcha error: ${res.data.error_text || 'Unknown error'}`)
      } catch (err) {
        if (i === maxAttempts - 1) {
          throw new Error(`Timeout solving captcha ${captchaId} after ${maxWaitSeconds}s`)
        }
        console.error(`[2CAPTCHA] Poll error (attempt ${i + 1}):`, err.message)
      }
    }

    throw new Error(`Failed to solve captcha ${captchaId}`)
  }

  /**
   * Parse captcha ID from 2Captcha response
   */
  parseCaptchaId(response) {
    try {
      const match = response.match(/captcha(\d+)/)
      return match ? match[1] : null
    } catch {
      return null
    }
  }

  /**
   * Utility: sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Report captcha as incorrect (refund credits)
   */
  async reportIncorrect(captchaId) {
    try {
      await this.client.post('/res.php', {
        apikey: this.apiKey,
        action: 'report',
        id: captchaId,
        json: 1,
      })
      console.log(`[2CAPTCHA] Reported incorrect: ${captchaId}`)
    } catch (err) {
      console.error('[2CAPTCHA] Error reporting incorrect:', err.message)
    }
  }
}

module.exports = CaptchaHandler
