const { google } = require('googleapis')

class GmailHandler {
  constructor(clientId, clientSecret, refreshToken) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.refreshToken = refreshToken
    this.gmail = null
    this.watchers = {} // { businessEmail: { unsubscribe, lastCheck } }
  }

  async initialize() {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      'http://localhost' // Not used in service account context
    )

    oauth2Client.setCredentials({
      refresh_token: this.refreshToken,
    })

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    console.log('[GMAIL] Authenticated with Gmail API')
  }

  /**
   * Watch for verification emails sent to a Gmail alias
   * Returns an unsubscribe function
   */
  watchAlias(businessName, businessEmail) {
    const alias = `reboostai+${businessName}@gmail.com`
    console.log(`[GMAIL] Watching ${alias} for verification emails`)

    // Poll for new emails every 10 seconds
    const interval = setInterval(async () => {
      try {
        const links = await this.extractVerificationLinks(alias)
        if (links.length > 0) {
          console.log(`[GMAIL] Found ${links.length} verification links in ${alias}`)
          this.watchers[businessEmail].links = links
        }
      } catch (err) {
        console.error(`[GMAIL] Error watching ${alias}:`, err.message)
      }
    }, 10000)

    const unsubscribe = () => {
      clearInterval(interval)
      delete this.watchers[businessEmail]
    }

    this.watchers[businessEmail] = { unsubscribe, links: [] }
    return unsubscribe
  }

  /**
   * Extract verification links from recent emails
   * Looks for common patterns: verify, confirm, click here, activate
   */
  async extractVerificationLinks(alias) {
    try {
      const res = await this.gmail.users.messages.list({
        userId: 'me',
        q: `to:${alias} is:unread`,
        maxResults: 5,
      })

      if (!res.data.messages) return []

      const links = []

      for (const msg of res.data.messages) {
        const fullMsg = await this.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
        })

        const body = this.getMessageBody(fullMsg.data)
        const extracted = this.parseVerificationLinks(body)
        links.push(...extracted)

        // Mark as read
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: msg.id,
          requestBody: { removeLabelIds: ['UNREAD'] },
        })
      }

      return links
    } catch (err) {
      console.error('[GMAIL] Error extracting links:', err.message)
      return []
    }
  }

  /**
   * Get email body from Gmail message object
   */
  getMessageBody(message) {
    const parts = message.payload?.parts || [message.payload]
    let body = ''

    for (const part of parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        const data = part.body?.data
        if (data) {
          body += Buffer.from(data, 'base64').toString('utf-8')
        }
      }
    }

    return body
  }

  /**
   * Parse verification links from email body
   * Matches common URL patterns in verification emails
   */
  parseVerificationLinks(body) {
    const links = []

    // Match URLs
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/g
    const matches = body.match(urlRegex) || []

    for (const url of matches) {
      // Filter to likely verification URLs
      if (/verify|confirm|activate|click|validate|validate-email/i.test(url)) {
        links.push(url)
      }
    }

    return links
  }

  /**
   * Get pending verification links for a business
   */
  getPendingLinks(businessEmail) {
    return (this.watchers[businessEmail]?.links || []).splice(0) // Pop all links
  }

  /**
   * Stop watching a business email
   */
  stopWatching(businessEmail) {
    const watcher = this.watchers[businessEmail]
    if (watcher) {
      watcher.unsubscribe()
    }
  }
}

module.exports = GmailHandler
