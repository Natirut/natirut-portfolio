import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Section from "@/components/Section";
import Timeline from "@/components/Timeline";
import SkillsGrid from "@/components/SkillsGrid";
import EducationCerts from "@/components/EducationCerts";
import Footer from "@/components/Footer";
import { profile } from "@/data/resume";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Section id="about" eyebrow="Profile" title="About">
        <p className="max-w-3xl text-base leading-relaxed text-foreground/70">
          {profile.summary}
        </p>
      </Section>
      <Section id="experience" eyebrow="Career" title="Experience">
        <Timeline />
      </Section>
      <Section id="skills" eyebrow="Toolbox" title="Skills">
        <SkillsGrid />
      </Section>
      <Section id="education" eyebrow="Background" title="Education & More">
        <EducationCerts />
      </Section>
      <Footer />
    </main>
  );
}
