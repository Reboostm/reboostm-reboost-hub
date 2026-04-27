// Pre-written 3-email cold outreach sequences by niche.
// Placeholders: {{firstName}}, {{businessName}}, {{city}}, {{senderName}}
// Send Email 1 on day 1, Email 2 on day 4, Email 3 on day 8.

const BASE = {
  emails: [
    {
      number: 1,
      subject: `Quick question about {{businessName}}`,
      body: `Hi {{firstName}},

I came across {{businessName}} while looking at {{niche}} companies in {{city}} and wanted to reach out.

Most {{niche}} businesses we talk to are getting leads — but not enough of them are coming from Google. A lot of the time it comes down to a few fixable things that most owners don't know to look for.

Would it be worth a 10-minute conversation to see if there's any low-hanging fruit for you?

{{senderName}} | ReBoost Marketing`,
    },
    {
      number: 2,
      subject: `Re: Quick question about {{businessName}}`,
      body: `Hi {{firstName}},

Just following up on my last note.

We recently helped a {{niche}} in a similar market go from page 3 on Google to the top 3 results in about 90 days. That translated to roughly 2–3 extra calls per day without any ad spend.

I'm not sure if that kind of result is realistic for {{businessName}}, but it'd take me about 10 minutes to look at your current online presence and give you an honest answer.

Worth a quick chat?

{{senderName}} | ReBoost Marketing`,
    },
    {
      number: 3,
      subject: `Last email from me, {{firstName}}`,
      body: `Hi {{firstName}},

I'll keep this short — I know your inbox is busy.

I've reached out a couple times about helping {{businessName}} get more visibility on Google in {{city}}. If the timing just isn't right, no worries at all.

If you ever want to revisit, I'm happy to do a free audit of your online presence and tell you exactly where the gaps are — no pitch, just a straight answer.

Either way, good luck with the business.

{{senderName}} | ReBoost Marketing`,
    },
  ],
}

const SEQUENCES = {
  plumber: {
    emails: [
      {
        number: 1,
        subject: `Most plumbers in {{city}} are leaving calls on the table`,
        body: `Hi {{firstName}},

I was looking at plumbing companies in {{city}} and noticed {{businessName}} came up — wanted to reach out.

Most plumbers we work with are relying on word-of-mouth and a few referrals, but they're invisible on Google Maps when someone types "plumber near me" at 10pm with a burst pipe.

That's usually the easiest thing to fix, and it can make a big difference in call volume.

Would it be worth 10 minutes to see if that's happening with {{businessName}}?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: Plumbers in {{city}} — quick follow-up`,
        body: `Hi {{firstName}},

Just checking back in.

We helped a plumbing company similar to {{businessName}} go from barely showing on Google Maps to landing in the top 3 results for their city. Within 60 days they were getting 5–8 additional calls per week — all from people already searching for a plumber, no ads needed.

Happy to take a look at your current setup and tell you where you stand. Takes about 10 minutes and I'll give you an honest picture.

Is that something you'd be open to?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last one from me, {{firstName}}`,
        body: `Hi {{firstName}},

Last email, I promise.

I've reached out a couple times about helping {{businessName}} get more visibility when people in {{city}} search for a plumber. If the timing isn't right, no hard feelings.

If you ever want a free, no-strings-attached look at how your business shows up online, the offer stands.

Hope things are going well.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  hvac: {
    emails: [
      {
        number: 1,
        subject: `HVAC calls in {{city}} — is {{businessName}} showing up?`,
        body: `Hi {{firstName}},

When someone in {{city}} searches "AC repair" or "furnace replacement" on Google, who shows up first?

I was looking at the local HVAC market and noticed there are some real gaps in visibility that a good company could step into. Wanted to see if {{businessName}} has looked at this.

The busy season only comes twice a year — most of the bookings go to whoever shows up on Google first. Worth a quick conversation?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: HVAC visibility in {{city}}`,
        body: `Hi {{firstName}},

Following up from my last note.

We worked with an HVAC company last spring who was getting edged out by competitors online. After cleaning up their Google presence and local SEO, they had their busiest summer season on record — fully booked out 3 weeks in advance at one point.

It's not always that dramatic, but it's worth knowing where {{businessName}} stands before the next busy season hits.

I can give you a free rundown in about 10 minutes. Interested?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}}, last note from me`,
        body: `Hi {{firstName}},

I've sent a couple notes about helping {{businessName}} get more visibility online in {{city}}. If the timing isn't right, totally understand.

If you ever want a free look at how you show up vs. your local competitors, just reply and I'll put something together — no pitch, just honest data.

Good luck with the business.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  electrician: {
    emails: [
      {
        number: 1,
        subject: `Quick question about {{businessName}}'s Google visibility`,
        body: `Hi {{firstName}},

I came across {{businessName}} while researching electricians in {{city}}. Wanted to reach out about something I see a lot with electrical contractors.

Most homeowners search Google when they need an electrician — and most of the calls go to whoever shows up in the top 3 results on Google Maps. A lot of great contractors are invisible there, not because they're not good, but because no one's ever looked at their online setup.

Would it be worth 10 minutes to see where {{businessName}} stands?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just checking back in on my last message.

We helped an electrical contractor in a similar market triple their Google Map Pack appearances in about 8 weeks. More visibility meant more calls, and more calls meant they could start being more selective about the jobs they took.

Happy to take a look at {{businessName}}'s current presence and tell you exactly where the opportunity is — free, no sales pressure.

Let me know if that's interesting.

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last email, {{firstName}}`,
        body: `Hi {{firstName}},

Last one from me — I don't want to clutter your inbox.

I reached out a couple times about helping {{businessName}} get more calls from Google in {{city}}. If the timing isn't right, I get it.

If you ever want a free audit of your online visibility, just reply and I'll put one together. No pitch, just a straight answer on where things stand.

Thanks for your time either way.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  roofer: {
    emails: [
      {
        number: 1,
        subject: `Roofing leads in {{city}} — is {{businessName}} visible?`,
        body: `Hi {{firstName}},

I was looking at roofing companies in {{city}} and reached out to a handful — {{businessName}} stood out and I wanted to connect.

Roofing is one of those industries where a single job can be worth $10,000+, but most homeowners just Google "roofer near me" and call whoever shows up first. If you're not in the top results, you're not even in the conversation.

Do you know how {{businessName}} currently ranks on Google Maps locally? Worth a quick look if you haven't checked lately.

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: Roofing leads — one example`,
        body: `Hi {{firstName}},

Following up on my last email.

We worked with a roofing company that was getting outranked by competitors with half the reviews and smaller crews. After improving their local SEO and Google presence, they started showing up in the top 3 for their main target areas — and closed 4 additional jobs in the first month from those leads alone.

I'd like to see if there's a similar opportunity for {{businessName}} in {{city}}. Free to look, no commitment.

Worth a quick chat?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}} — wrapping up`,
        body: `Hi {{firstName}},

I've reached out a couple times and don't want to overstay my welcome.

If {{businessName}} is fully booked and not looking for more work, that's great — sounds like things are going well. If more leads would ever be useful, I'm happy to do a free audit and show you exactly where the gaps are.

Good luck with the season.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  dentist: {
    emails: [
      {
        number: 1,
        subject: `New patient leads in {{city}} — a question for {{businessName}}`,
        body: `Hi {{firstName}},

I came across {{businessName}} while looking at dental practices in {{city}} and wanted to reach out about something specific.

When someone new to the area (or someone who just lost their dentist) searches for a dentist on Google, the practices that show up in the top 3 get the overwhelming majority of calls. That positioning is almost entirely driven by a few factors most practices have never looked at.

Would it be worth 10 minutes to see how {{businessName}} stacks up against other practices in your area?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: New patients for {{businessName}}`,
        body: `Hi {{firstName}},

Just following up from my last note.

We recently worked with a dental practice that was losing new patient calls to competitors who had worse reviews but better Google visibility. After improving their local presence, they added 18 new patients in the first 60 days — without any paid ads.

I'd like to take a look at {{businessName}}'s current visibility and give you a clear picture. No commitment, free to do.

Open to a quick call?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last note, {{firstName}}`,
        body: `Hi {{firstName}},

I'll keep this short — last email from me.

I reached out a couple times about helping {{businessName}} attract more new patients through Google. If the schedule is full and you're not looking to grow right now, that's great news.

If that ever changes, I'd be happy to do a free review of your online presence. Just reply anytime.

Best of luck.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  pest_control: {
    emails: [
      {
        number: 1,
        subject: `Pest control calls in {{city}} — quick question`,
        body: `Hi {{firstName}},

I was looking at pest control companies in {{city}} and found {{businessName}} — wanted to reach out.

Pest control has some of the highest-intent searches out there. When someone has a problem, they need help now — and they call the first company Google shows them. The difference between ranking #1 and #4 on Maps is massive in terms of calls.

Do you know where {{businessName}} currently lands when someone searches for pest control in your area?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Checking back in on my last message.

We helped a pest control company in a market similar to {{city}} move into the top 3 Google Maps results. Their call volume nearly doubled in the first 90 days — all from organic search, no ads.

Happy to take a free look at {{businessName}}'s current setup and tell you exactly where things stand. No strings attached.

Interested?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}}, last one from me`,
        body: `Hi {{firstName}},

Last email, I promise.

I sent a couple notes about helping {{businessName}} show up better on Google in {{city}}. If the timing isn't right, no worries at all.

If more service calls ever become a priority, I'm happy to do a free audit and show you exactly what's possible. Just reply anytime.

Thanks for your time.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  landscaping: {
    emails: [
      {
        number: 1,
        subject: `Landscaping leads in {{city}} — a thought for {{businessName}}`,
        body: `Hi {{firstName}},

I came across {{businessName}} while looking at landscaping companies in {{city}}. Wanted to reach out about something I see a lot this time of year.

Homeowners searching for landscaping help almost always start on Google. The companies in the top 3 spots on Google Maps get the majority of those calls — and for recurring maintenance contracts, a single new customer can be worth thousands per year.

Would it be worth 10 minutes to see where {{businessName}} stands in local search?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} landscaping — quick follow-up`,
        body: `Hi {{firstName}},

Just following up from last week.

We worked with a landscaping company that was being outranked by newer competitors despite having more experience and better reviews. After fixing their local SEO, they jumped into the top 3 in their main service areas and picked up 6 new recurring maintenance clients within 60 days.

I'd like to see if there's a similar opportunity for {{businessName}}. Free to look, no pressure.

Worth a quick conversation?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last email, {{firstName}}`,
        body: `Hi {{firstName}},

I don't want to keep filling your inbox — this is the last one.

I reached out about helping {{businessName}} get more visibility on Google in {{city}}. If the schedule is already full, that's a good problem to have.

If you ever want a free look at your online presence, just reply. No pitch — just an honest answer on where things stand.

Good luck with the season.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  cleaning: {
    emails: [
      {
        number: 1,
        subject: `Cleaning service leads in {{city}} — quick question`,
        body: `Hi {{firstName}},

I came across {{businessName}} while researching cleaning services in {{city}} and wanted to reach out.

Most homeowners looking for a cleaning service search Google, read a few reviews, and call the first 2–3 companies they see. If {{businessName}} isn't showing up in those top spots, the calls are going to competitors who may not even do better work.

Do you know how {{businessName}} currently looks on Google Maps compared to other local services?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just checking back in.

We helped a residential cleaning service go from page 2 of Google to the top 3 results in their city. They had a slow period before — within 90 days of improving their local presence they had a waitlist for new clients.

I'd love to take a free look at {{businessName}}'s current visibility and tell you what the opportunity looks like. No cost, no commitment.

Interested in a quick call?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}}, wrapping up`,
        body: `Hi {{firstName}},

Last email from me.

I reached out a couple times about helping {{businessName}} get more visibility on Google in {{city}}. If you're already booked out, that's great — sounds like things are going well.

If more leads would ever be useful, I'm happy to do a free audit. Just reply anytime.

Thanks for your time.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  auto_repair: {
    emails: [
      {
        number: 1,
        subject: `Auto repair shops in {{city}} — is {{businessName}} showing up?`,
        body: `Hi {{firstName}},

When someone in {{city}} searches "auto repair near me" or "mechanic {{city}}" — does {{businessName}} come up?

I was looking at the local auto repair market and noticed there's usually a big gap between who actually deserves to rank at the top and who does. Most shop owners never think about it until they realize calls have slowed down.

Would it be worth 10 minutes to see where you stand and whether there's a quick fix?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — one example`,
        body: `Hi {{firstName}},

Just following up.

We worked with an auto repair shop that was getting eclipsed by a national chain on Google Maps despite better reviews and lower prices. After improving their local presence, they moved into the top 3 and added roughly 15 new customers in the first month from search alone.

Happy to give {{businessName}} the same free look — no strings attached.

Worth a quick chat?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last one, {{firstName}}`,
        body: `Hi {{firstName}},

This is the last email — promise.

I've reached out about helping {{businessName}} show up better on Google in {{city}}. If things are busy and you don't need more customers right now, that's genuinely great news.

If that ever changes, a free audit is always available. Just reply anytime.

Good luck with the shop.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  chiropractor: {
    emails: [
      {
        number: 1,
        subject: `New patients in {{city}} — a question for {{businessName}}`,
        body: `Hi {{firstName}},

I came across {{businessName}} while looking at chiropractic practices in {{city}}. Wanted to reach out about something specific.

New patients looking for a chiropractor almost always start with Google. The practices in the top 3 results on Google Maps get the large majority of those calls — and a new patient relationship can be worth hundreds or thousands in lifetime value.

Do you know how {{businessName}} currently shows up vs. other practices in {{city}}?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just checking back in.

We worked with a chiropractic practice that was getting outranked by newer competitors with fewer reviews. After improving their Google presence, they added 12 new patients in the first 60 days without any ad spend.

I'd like to take a free look at {{businessName}}'s current visibility — no commitment, no pitch, just honest data.

Interested in a quick call?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}}, last note from me`,
        body: `Hi {{firstName}},

Last email, I promise.

I reached out a couple times about helping {{businessName}} attract more new patients through Google. If the practice is full, that's fantastic.

If you ever want a free review of how you show up online vs. competitors, just reply. No sales pitch — just straight data.

Best of luck.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  real_estate: {
    emails: [
      {
        number: 1,
        subject: `Real estate visibility in {{city}} — quick question`,
        body: `Hi {{firstName}},

I came across {{businessName}} while looking at real estate professionals in {{city}} and wanted to reach out.

Most buyers and sellers start their search online — and the agents and brokerages that show up prominently on Google consistently get the first call. A lot of great agents miss leads simply because their online presence isn't optimized.

Would it be worth 10 minutes to see how {{businessName}} currently stacks up in local search?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just following up from last week.

We helped a real estate agent in a competitive market improve their Google visibility significantly — within 60 days they were getting consistent inbound inquiries from people searching locally, without running a single ad.

I'd like to take a free look at {{businessName}}'s current presence. No commitment involved.

Worth a quick conversation?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last one from me, {{firstName}}`,
        body: `Hi {{firstName}},

This is the last one — don't want to be a nuisance.

I reached out about helping {{businessName}} get more visibility in {{city}}. If now isn't the right time, totally understood.

Free audit offer stands anytime you want it — just reply.

Thanks for your time.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  insurance: {
    emails: [
      {
        number: 1,
        subject: `Insurance leads in {{city}} — a thought for {{businessName}}`,
        body: `Hi {{firstName}},

I was looking at insurance agencies in {{city}} and came across {{businessName}} — wanted to reach out.

When someone in {{city}} needs new coverage, they often start with a Google search. Agencies in the top local results capture most of those calls — and the difference between ranking #2 vs. #5 on Google Maps can mean dozens of leads per month.

Do you know where {{businessName}} currently stands in local search?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just checking back in.

We helped an independent insurance agency compete more effectively against the big national names online. After improving their local SEO and Google presence, they started getting consistent inbound calls from people searching for coverage in their area.

Happy to take a free look at {{businessName}} and tell you exactly where the opportunity is.

Interested?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}}, wrapping up`,
        body: `Hi {{firstName}},

Last email from me.

I sent a couple notes about helping {{businessName}} get more visibility online in {{city}}. If it's not a priority right now, no worries at all.

Free audit is available whenever it makes sense. Just reply.

Thanks for your time.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  restaurant: {
    emails: [
      {
        number: 1,
        subject: `Restaurant visibility in {{city}} — quick question for {{businessName}}`,
        body: `Hi {{firstName}},

I came across {{businessName}} while looking at restaurants in {{city}}. Wanted to ask a quick question.

When someone in {{city}} searches "restaurants near me" or looks for your type of food on Google Maps — does {{businessName}} show up in the first few results? That positioning drives a huge amount of foot traffic and orders, and most restaurant owners have never looked at why some places dominate it and others don't.

Would it be worth 10 minutes to see where you stand?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just following up.

We worked with a restaurant that was getting lost behind chains and heavily marketed competitors on Google Maps. After improving their visibility, they saw a consistent increase in new diners finding them through search — particularly on weekends.

I'd like to take a free look at {{businessName}}'s current setup and tell you what's fixable. No commitment.

Interested in a quick call?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `Last one, {{firstName}}`,
        body: `Hi {{firstName}},

Last email — I know you're busy running the restaurant.

I reached out about helping {{businessName}} show up better on Google in {{city}}. If now isn't a good time, totally understand.

Free audit is available whenever you'd like it. Just reply.

Thanks for your time.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  retail: {
    emails: [
      {
        number: 1,
        subject: `{{businessName}} — showing up when {{city}} shoppers search?`,
        body: `Hi {{firstName}},

I came across {{businessName}} while looking at retail businesses in {{city}} and wanted to reach out.

Local retailers that show up in Google Maps searches see a real lift in foot traffic — people searching "near me" have high purchase intent. But a lot of great local stores are invisible in those results simply because of a few fixable gaps in their online presence.

Would it be worth 10 minutes to see how {{businessName}} is showing up locally?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 2,
        subject: `Re: {{businessName}} — following up`,
        body: `Hi {{firstName}},

Just checking back in from last week.

We helped a local retail shop improve its Google Maps ranking in their city. Within a month they saw a noticeable uptick in people mentioning they "found us on Google" — without spending anything on ads.

Happy to take a free look at {{businessName}} and tell you where the opportunity is.

Worth a quick call?

{{senderName}} | ReBoost Marketing`,
      },
      {
        number: 3,
        subject: `{{firstName}}, last note`,
        body: `Hi {{firstName}},

Last email from me.

I reached out a couple times about helping {{businessName}} get more visibility in {{city}}. If now isn't the right time, no problem.

Free audit is available anytime. Just reply.

Thanks.

{{senderName}} | ReBoost Marketing`,
      },
    ],
  },

  other: BASE,
}

export function getOutreachSequence(niche, city) {
  const sequence = SEQUENCES[niche] || BASE
  return sequence.emails.map(email => ({
    ...email,
    subject: email.subject.replace(/\{\{niche\}\}/g, niche).replace(/\{\{city\}\}/g, city),
    body: email.body.replace(/\{\{niche\}\}/g, niche).replace(/\{\{city\}\}/g, city),
  }))
}
