import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Calendar from "./pages/Calendar";
import Schedule from "./pages/Schedule";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";
import RSS from "./pages/RSS";
import MapPage from "./pages/Map";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Schedule page with infinite scroll */}
        <Route path="/schedule" element={<Schedule />} />
        {/* Calendar page */}
        <Route path="/calendar" element={<Calendar />} />
        {/* Map page */}
        <Route path="/map" element={<MapPage />} />
        {/* Admin panel — Nostr auth gated */}
        <Route path="/admin" element={<Admin />} />
        {/* RSS feed */}
        <Route path="/feed" element={<RSS />} />
        {/* Legacy RSS route */}
        <Route path="/rss.xml" element={<RSS />} />
        {/* NIP-19 route for naddr1 calendar event detail pages */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
