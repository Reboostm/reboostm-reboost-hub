import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Globe, Zap, Megaphone, Bot, ExternalLink } from 'lucide-react'

const SERVICES = [
  {
    icon: Globe,
    title: 'Website Design & SEO',
    description: 'Custom-built, mobile-first websites optimized for local search. Includes on-page SEO and Google setup.',
  },
  {
    icon: Zap,
    title: 'Marketing Automations',
    description: 'GHL-powered follow-up sequences, lead nurture, and appointment booking automations.',
  },
  {
    icon: Megaphone,
    title: 'Paid Ads Management',
    description: 'Google Ads and Facebook Ads campaigns managed by certified specialists with local business expertise.',
  },
  {
    icon: Bot,
    title: 'Voice AI & Chatbot',
    description: 'AI-powered voice agents and webchat bots that capture and qualify leads 24/7.',
  },
]

export default function AgencyServices() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-hub-text">Done-For-You Services</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Let ReBoost Marketing handle the heavy lifting. Full-service digital marketing for local businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {SERVICES.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-hub-blue/10 border border-hub-blue/20 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-hub-blue" />
              </div>
              <div>
                <h3 className="font-medium text-hub-text text-sm">{title}</h3>
                <p className="text-xs text-hub-text-secondary mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-hub-text">Book a Free Strategy Call</h3>
            <p className="text-sm text-hub-text-secondary mt-1">30 minutes with a ReBoost specialist. No pressure, no fluff.</p>
          </div>
          <Button variant="accent" size="lg" className="shrink-0">
            Book a Call
          </Button>
        </div>
      </Card>

      <div className="mt-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-hub-text">ReBoost CRM</h3>
              <p className="text-sm text-hub-text-secondary mt-1">
                Full GHL white-label CRM — pipelines, automations, campaigns, and more.
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Learn More <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
