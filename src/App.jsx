import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { BillingProvider } from './contexts/BillingContext'
import { ToastProvider } from './hooks/useToast'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminRoute from './components/layout/AdminRoute'
import HubLayout from './components/layout/HubLayout'

// Auth
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'

// SEO Audit
import AuditHome from './pages/audit/AuditHome'
import AuditNew from './pages/audit/AuditNew'
import AuditResults from './pages/audit/AuditResults'

// Citations
import CitationsHome from './pages/citations/CitationsHome'
import CitationsDirs from './pages/citations/CitationsDirs'
import CitationsJobs from './pages/citations/CitationsJobs'
import CitationsAnalytics from './pages/citations/CitationsAnalytics'

// Leads
import LeadFinder from './pages/leads/LeadFinder'
import MyLeads from './pages/leads/MyLeads'
import OutreachTemplates from './pages/leads/OutreachTemplates'

// Scheduler
import CalendarView from './pages/scheduler/CalendarView'
import SchedulePost from './pages/scheduler/SchedulePost'
import ConnectedAccounts from './pages/scheduler/ConnectedAccounts'

// Creator
import GenerateContent from './pages/creator/GenerateContent'
import GenerateImage from './pages/creator/GenerateImage'

// Calendar
import ContentLibrary from './pages/calendar/ContentLibrary'
import TemplateEditor from './pages/calendar/TemplateEditor'

// Reviews
import AllReviews from './pages/reviews/AllReviews'
import ReviewRequests from './pages/reviews/ReviewRequests'

// Rank Tracker
import Keywords from './pages/ranktracker/Keywords'
import RankingsReport from './pages/ranktracker/RankingsReport'

// Agency
import TerritoryChecker from './pages/agency/TerritoryChecker'
import AgencyServices from './pages/agency/AgencyServices'

// Settings
import Profile from './pages/settings/Profile'
import Billing from './pages/settings/Billing'
import Integrations from './pages/settings/Integrations'
import Pricing from './pages/Pricing'

// Setup (one-time admin claim)
import Setup from './pages/setup/Setup'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminClients from './pages/admin/Clients'
import AdminUsers from './pages/admin/Users'
import AdminContent from './pages/admin/ContentManager'
import AdminTerritories from './pages/admin/Territories'
import AdminOffers from './pages/admin/Offers'
import AdminApiKeys from './pages/admin/ApiKeys'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BillingProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Setup — protected but no layout */}
              <Route element={<ProtectedRoute />}>
                <Route path="/setup" element={<Setup />} />
              </Route>

              {/* Protected — inside HubLayout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<HubLayout />}>
                  <Route index element={<Navigate to="/audit" replace />} />

                  {/* SEO Audit */}
                  <Route path="audit" element={<AuditHome />} />
                  <Route path="audit/new" element={<AuditNew />} />
                  <Route path="audit/results" element={<AuditResults />} />

                  {/* Citations */}
                  <Route path="citations" element={<CitationsHome />} />
                  <Route path="citations/directories" element={<CitationsDirs />} />
                  <Route path="citations/jobs" element={<CitationsJobs />} />
                  <Route path="citations/analytics" element={<CitationsAnalytics />} />

                  {/* Leads */}
                  <Route path="leads" element={<LeadFinder />} />
                  <Route path="leads/my-leads" element={<MyLeads />} />
                  <Route path="leads/outreach" element={<OutreachTemplates />} />

                  {/* Scheduler */}
                  <Route path="scheduler" element={<CalendarView />} />
                  <Route path="scheduler/new" element={<SchedulePost />} />
                  <Route path="scheduler/accounts" element={<ConnectedAccounts />} />

                  {/* AI Creator */}
                  <Route path="creator" element={<GenerateContent />} />
                  <Route path="creator/image" element={<GenerateImage />} />

                  {/* Content Calendar */}
                  <Route path="calendar" element={<ContentLibrary />} />
                  <Route path="calendar/editor/:id" element={<TemplateEditor />} />

                  {/* Reviews */}
                  <Route path="reviews" element={<AllReviews />} />
                  <Route path="reviews/requests" element={<ReviewRequests />} />

                  {/* Rank Tracker */}
                  <Route path="rank-tracker" element={<Keywords />} />
                  <Route path="rank-tracker/report" element={<RankingsReport />} />

                  {/* Agency */}
                  <Route path="agency" element={<TerritoryChecker />} />
                  <Route path="agency/services" element={<AgencyServices />} />

                  {/* Settings */}
                  <Route path="settings" element={<Profile />} />
                  <Route path="settings/billing" element={<Billing />} />
                  <Route path="settings/integrations" element={<Integrations />} />
                  <Route path="pricing" element={<Pricing />} />

                  {/* Admin — staff/admin only */}
                  <Route element={<AdminRoute />}>
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/clients" element={<AdminClients />} />
                    <Route path="admin/users" element={<AdminUsers />} />
                    <Route path="admin/content" element={<AdminContent />} />
                    <Route path="admin/territories" element={<AdminTerritories />} />
                    <Route path="admin/offers" element={<AdminOffers />} />
                    <Route path="admin/api-keys" element={<AdminApiKeys />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/audit" replace />} />
            </Routes>
          </ToastProvider>
        </BillingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
