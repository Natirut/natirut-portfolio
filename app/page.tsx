import Nav from "@/components/ui/Nav";
import Hero from "@/components/ui/Hero";
import Section from "@/components/ui/Section";
import About from "@/components/ui/About";
import Timeline from "@/components/ui/Timeline";
import SkillsGrid from "@/components/ui/SkillsGrid";
import Credentials from "@/components/ui/Credentials";
import Contact from "@/components/ui/Contact";
import Marquee from "@/components/ui/Marquee";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative z-10">
        <Hero />

        <Section id="about" index="01" eyebrow="Identity" title="Profile">
          <About />
        </Section>

        <Marquee />

        <Section id="experience" index="02" eyebrow="Log" title="Experience">
          <Timeline />
        </Section>

        <Section id="skills" index="03" eyebrow="Modules" title="Tech Stack">
          <SkillsGrid />
        </Section>

        <Section
          id="education"
          index="04"
          eyebrow="Records"
          title="Credentials"
        >
          <Credentials />
        </Section>

        <Section id="contact" index="05" eyebrow="Uplink" title="Contact">
          <Contact />
        </Section>

        <Footer />
      </main>
    </>
  );
}
