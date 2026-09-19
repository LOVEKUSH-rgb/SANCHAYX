import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { CustomCursor } from './components/common/CustomCursor';
import { ScrollToTop } from './components/common/ScrollToTop';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { GoalPage } from './pages/GoalPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ComparePage } from './pages/ComparePage';
import { SourcesPage } from './pages/SourcesPage';
import { MyPlansPage } from './pages/MyPlansPage';
import { LICPage } from './pages/LICPage';
import { FreeBenefitsPage } from './pages/FreeBenefitsPage';
import { MyProfilePage } from './pages/MyProfilePage';
import { ManualCalculatorPage } from './pages/ManualCalculatorPage';
import { SchemesPage } from './pages/SchemesPage';
import { MarketsPage } from './pages/MarketsPage';


export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <CustomCursor />
          <div className="min-h-screen bg-sanchay-light text-sanchay-navy-900 font-sans overflow-x-hidden w-full relative">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/goal" element={<GoalPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/my-plans" element={<MyPlansPage />} />
              <Route path="/my-profile" element={<MyProfilePage />} />
              <Route path="/lic" element={<LICPage />} />
              <Route path="/lic-plans" element={<LICPage />} />
              <Route path="/free-benefits" element={<FreeBenefitsPage />} />
              <Route path="/benefits" element={<FreeBenefitsPage />} />
              <Route path="/calculator" element={<ManualCalculatorPage />} />
              <Route path="/schemes" element={<SchemesPage />} />
              <Route path="/markets" element={<MarketsPage />} />
            </Routes>
            <AuthModal />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
