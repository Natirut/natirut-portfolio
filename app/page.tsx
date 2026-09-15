import Nav from "@/components/ui/Nav";
import Hero from "@/components/ui/Hero";
import Dive from "@/components/ui/Dive";
import Section from "@/components/ui/Section";
import About from "@/components/ui/About";
import Timeline from "@/components/ui/Timeline";
import SkillsGrid from "@/components/ui/SkillsGrid";
import Credentials from "@/components/ui/Credentials";
import Contact from "@/components/ui/Contact";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative z-10">
        <Hero />

        <Dive label="Look closer" line="Every system starts as a thought." />

        <Section id="about" index="01" kicker="The Mind" title="A mind for" accent="systems.">
          <About />
        </Section>

        <Dive label="Then" line="Thought becomes structure." />

        <Section id="experience" index="02" kicker="The Work" title="Built on" accent="the floor.">
          <Timeline />
        </Section>

        <Dive label="Then" line="Structure becomes capability." tone="light" />

        <Section id="skills" index="03" kicker="The Toolkit" title="Tools in" accent="hand." tone="light" wide>
          <SkillsGrid />
        </Section>

        <Dive label="For the record" line="Drawn up, signed off." />

        <Section id="education" index="04" kicker="The Record" title="Credentials," accent="on paper.">
          <Credentials />
        </Section>

        <Dive label="Finally" line="Now — let’s build yours." tone="light" />

        <Section id="contact" index="05" kicker="The Reach" title="Let’s build" accent="what’s next.">
          <Contact />
        </Section>

        <Footer />
      </main>
    </>
  );
}
