import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Globe, Zap, Megaphone, Bot, ExternalLink, CheckCircle } from 'lucide-react'

const SERVICES = [
  {
    icon: Globe,
    title: 'Website Design & SEO',
    price: 'From $997',
    badge: 'Most Popular',
    badgeVariant: 'info',
    description: 'Custom-built, mobile-first websites optimized for local search. Includes on-page SEO, Google Business Profile setup, and schema markup.',
    includes: ['Custom design', 'On-page SEO', 'Google setup', 'Fast hosting'],
  },
  {
    icon: Zap,
    title: 'Marketing Automations',
    price: 'From $497/mo',
    badge: null,
    description: 'GHL-powered follow-up sequences, lead nurture campaigns, and appointment booking automations that run while you sleep.',
    includes: ['Lead follow-up', 'Appointment booking', 'SMS & email flows', 'CRM pipeline'],
  },
  {
    icon: Megaphone,
    title: 'Paid Ads Management',
    price: 'From $797/mo',
    badge: null,
    description: 'Google Ads and Facebook Ads campaigns managed by certified specialists with deep local business expertise. Performance guaranteed.',
    includes: ['Google Ads', 'Facebook/Instagram Ads', 'Landing pages', 'Monthly reporting'],
  },
  {
    icon: Bot,
    title: 'Voice AI & Chatbot',
    price: 'From $297/mo',
    badge: 'New',
    badgeVariant: 'success',
    description: 'AI-powered voice agents and webchat bots that answer calls, capture leads, and book appointments 24/7 — no staff required.',
    includes: ['24/7 answering', 'Lead capture', 'Appointment booking', 'CRM sync'],
  },
]

export default function AgencyServices() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Done-For-You Services</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Let ReBoost Marketing handle the heavy lifting. Full-service digital marketing for local businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {SERVICES.map(({ icon: Icon, title, price, badge, badgeVariant, description, includes }) => (
          <Card key={title} className="flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-hub-blue/10 border border-hub-blue/20 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-hub-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-hub-text text-sm">{title}</h3>
                  {badge && <Badge variant={badgeVariant} size="sm">{badge}</Badge>}
                </div>
                <p className="text-hub-blue font-semibold text-sm mt-0.5">{price}</p>
              </div>
            </div>
            <p className="text-xs text-hub-text-secondary leading-relaxed mb-3">{description}</p>
            <ul className="space-y-1 mt-auto">
              {includes.map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-hub-text-secondary">
                  <CheckCircle className="w-3 h-3 text-hub-green shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="mb-4 bg-hub-blue/5 border-hub-blue/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-hub-text">Book a Free Strategy Call</h3>
            <p className="text-sm text-hub-text-secondary mt-1">
              30 minutes with a ReBoost specialist. We'll map out exactly what your business needs — no pressure, no fluff.
            </p>
          </div>
          <a
            href="https://marketingreboost.com/call"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button size="lg">Book a Free Call →</Button>
          </a>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-hub-text">ReBoost CRM</h3>
            <p className="text-sm text-hub-text-secondary mt-1">
              Full GHL white-label CRM — pipelines, automations, campaigns, and more.
              All your clients in one place.
            </p>
          </div>
          <a
            href="https://app.marketingreboost.com/crm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="sm">
              Open CRM <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </a>
        </div>
      </Card>
    </div>
  )
}
