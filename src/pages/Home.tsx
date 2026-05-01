import Navbar from "../components/marketing/Navbar";
import Hero from "../components/marketing/Hero";
import ToolsSlider from "../components/ToolsSlider/ToolsSlider";
import Features from "../components/marketing/Features";
import Footer from "../components/marketing/Footer";
import NetworkCTA from "../components/marketing/NetworkCTA";
import MissionSection from "../components/MissionSection/MissionSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <Navbar />
      <main>
        <Hero />
        <ToolsSlider /> 
        <MissionSection />
        <Features />
        <NetworkCTA />
      </main>
      <Footer />
    </div>
  );
}