import { Navbar } from "@/components/ui/Navbar";
import { Hero } from "@/components/ui/Hero";
import { Marquee } from "@/components/ui/Marquee";
import { SystemsGrid } from "@/components/ui/SystemsGrid";
import { Footer } from "@/components/ui/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grid">
      <Navbar />
      <main className="pt-20">
        <Hero />
        <Marquee />
        <SystemsGrid />
      </main>
      <Footer />
    </div>
  );
}
