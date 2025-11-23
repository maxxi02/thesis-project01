"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Session } from "@/better-auth/auth-types";
import { Mail, Phone } from "lucide-react";
import { FaFacebook } from "react-icons/fa6";
import { getServerSession } from "@/better-auth/action";
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getServerSession();
      setSession(session);
    };
    fetchSession();
  }, []);

  const headerRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featureCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const aboutTitleRef = useRef<HTMLDivElement>(null);
  const aboutContentRef = useRef<(HTMLParagraphElement | null)[]>([]);
  const aboutImageRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scrolling
    gsap.config({
      autoSleep: 60,
      force3D: true,
      nullTargetWarn: false,
    });
    const ctx = gsap.context(() => {
      // Header animation
      gsap.from(headerRef.current, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
      // Hero animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(heroTitleRef.current, {
        y: 100,
        opacity: 0,
        duration: 1,
      })
        .from(
          heroDescRef.current,
          {
            y: 50,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )
        .from(
          heroButtonsRef.current,
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
          },
          "-=0.5"
        )
        .from(
          heroImageRef.current,
          {
            x: 100,
            opacity: 0,
            duration: 1,
          },
          "-=1"
        );
      // Features section animation
      gsap.from(featuresRef.current, {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          end: "top 50%",
          scrub: 1,
        },
        y: 100,
        opacity: 0,
      });
      // Feature cards stagger animation
      featureCardsRef.current.forEach((card, index) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "top 60%",
            scrub: 1,
          },
          y: 80,
          opacity: 0,
          delay: index * 0.2,
        });
      });
      // About section animations
      gsap.from(aboutTitleRef.current, {
        scrollTrigger: {
          trigger: aboutTitleRef.current,
          start: "top 80%",
          end: "top 60%",
          scrub: 1,
        },
        y: 60,
        opacity: 0,
      });
      aboutContentRef.current.forEach((content, index) => {
        gsap.from(content, {
          scrollTrigger: {
            trigger: content,
            start: "top 85%",
            end: "top 65%",
            scrub: 1,
          },
          x: -50,
          opacity: 0,
          delay: index * 0.1,
        });
      });
      gsap.from(aboutImageRef.current, {
        scrollTrigger: {
          trigger: aboutImageRef.current,
          start: "top 85%",
          end: "top 60%",
          scrub: 1,
        },
        x: 100,
        opacity: 0,
        scale: 0.9,
      });
      // Contact section animation
      gsap.from(contactRef.current, {
        scrollTrigger: {
          trigger: contactRef.current,
          start: "top 80%",
          end: "top 60%",
          scrub: 1,
        },
        y: 80,
        opacity: 0,
      });
    });
    // Cleanup
    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);
  return (
    <div className="min-h-screen w-full bg-background">
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 md:px-12 py-4"
      >
        <div className="flex items-center md:justify-between justify-center max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/lgw-logo.png"
              alt="LGW Logo"
              width={32}
              height={32}
              className="object-contain md:w-[38px] md:h-[38px]"
            />
            <span className="text-lg md:text-xl font-semibold text-foreground">
              LGW
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              href="#features"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#about"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </header>
      {/* Hero Section */}
      <section className="pt-20 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-16 md:py-24 gap-12 min-h-screen">
        <div className="flex-1 flex flex-col gap-6">
          <h1
            ref={heroTitleRef}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
          >
            Revolutionize Your Inventory Control
          </h1>
          <p
            ref={heroDescRef}
            className="text-lg text-muted-foreground max-w-lg"
          >
            LGW Warehouse Management System uses advanced ML-driven automation
            to eliminate manual inefficiencies in stock logging, item
            categorization, and order fulfillment for construction materials and
            hardware supplies.
          </p>
          <div ref={heroButtonsRef} className="flex gap-4 pt-4">
            {session ? (
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/dashboard">Get Started</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/sign-in">Get Started</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <a href="#features" className="scroll-smooth">
                Learn More
              </a>
            </Button>
          </div>
        </div>
        {/* Warehouse Image with Wavy Container */}
        <div className="flex-1 flex justify-center items-center w-full">
          <div className="relative w-full h-full">
            {/* Image with wavy clip */}
            <div
              ref={heroImageRef}
              className="relative w-full h-full aspect-square overflow-hidden"
            >
              <Image
                src="/hero-section-img.jpg"
                alt="Warehouse management system"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section
        id="features"
        className="px-6 md:px-12 py-16 md:py-24 bg-card border-t border-border scroll-smooth"
      >
        <div className="max-w-6xl mx-auto">
          <h2
            ref={featuresRef}
            className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground"
          >
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div
              ref={(el) => {
                featureCardsRef.current[0] = el;
              }}
              className="flex flex-col gap-4 p-6 rounded-lg border border-border bg-background"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-xl">
                🤖
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                ML-Driven Object Detection
              </h3>
              <p className="text-muted-foreground">
                Automatically categorize items like cement, steel bars, and
                electrical wiring using advanced machine learning algorithms.
              </p>
            </div>
            <div
              ref={(el) => {
                featureCardsRef.current[1] = el;
              }}
              className="flex flex-col gap-4 p-6 rounded-lg border border-border bg-background"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-xl">
                📊
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Real-Time Analytics
              </h3>
              <p className="text-muted-foreground">
                Get actionable insights with comprehensive reporting and
                real-time visibility into your inventory operations.
              </p>
            </div>
            <div
              ref={(el) => {
                featureCardsRef.current[2] = el;
              }}
              className="flex flex-col gap-4 p-6 rounded-lg border border-border bg-background"
            >
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-xl">
                🚚
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Logistics Tracking
              </h3>
              <p className="text-muted-foreground">
                Monitor product shipments from procurement to delivery with
                real-time updates and chain-of-custody documentation.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* About Section */}
      <section
        id="about"
        className="px-6 md:px-12 py-16 md:py-24 bg-background border-t border-border scroll-smooth"
      >
        <div className="max-w-6xl mx-auto">
          <h2
            ref={aboutTitleRef}
            className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground"
          >
            About LGW
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <p
                ref={(el) => {
                  aboutContentRef.current[0] = el;
                }}
                className="text-lg text-muted-foreground"
              >
                At LGW Warehouse Management System, we transform inventory
                management for construction materials and hardware supplies
                through automation and machine learning.
              </p>
              <p
                ref={(el) => {
                  aboutContentRef.current[1] = el;
                }}
                className="text-lg text-muted-foreground"
              >
                Using real-time analytics and ML-powered object detection, our
                system removes manual inefficiencies in stock logging,
                categorization, and order fulfillment. It efficiently manages
                high-volume inventories like cement, steel bars, and plumbing
                fixtures.
              </p>
              <p
                ref={(el) => {
                  aboutContentRef.current[2] = el;
                }}
                className="text-lg text-muted-foreground"
              >
                With comprehensive logistics tracking, it delivers real-time
                shipment updates, delivery estimates, and full supply chain
                visibility to optimize operations, boost efficiency, and reduce
                costs.
              </p>
            </div>
            <div ref={aboutImageRef} className="flex justify-center">
              <Image
                src="/our-team.jpg"
                alt="Our team"
                className="w-full max-w-sm rounded-lg shadow-lg"
                width={500}
                height={500}
              />
            </div>
          </div>
        </div>
      </section>
      {/* Contact Section */}
      <section
        id="contact"
        ref={contactRef}
        className="px-6 md:px-12 py-16 md:py-24 text-center bg-card border-t border-border scroll-mt-20 relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 100 100"
          >
            <defs>
              <pattern
                id="grain"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="25" cy="25" r="1" />
                <circle cx="75" cy="75" r="1" />
                <circle cx="50" cy="10" r="0.5" />
                <circle cx="10" cy="60" r="0.8" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grain)" />
          </svg>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Get In Touch
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              For more information, please contact LGW Hardware on the following
              platforms.
            </p>
          </div>

          {/* Contact Methods with Icons */}
          <div className="flex flex-col md:flex-row gap-8 justify-center mb-12">
            {/* Email */}
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-2 p-6 h-auto bg-muted/50 hover:bg-muted transition-colors"
              asChild
            >
              <Link href="mailto:lgwhardware@gmail.com">
                <Mail className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold text-foreground text-sm">Email</h3>
                <span className="text-primary hover:text-primary/80 transition text-sm font-medium">
                  lgwhardware@gmail.com
                </span>
              </Link>
            </Button>

            {/* Phone */}
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-2 p-6 h-auto bg-muted/50 hover:bg-muted transition-colors"
              asChild
            >
              <Link href="tel:09936090374">
                <Phone className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold text-foreground text-sm">Phone</h3>
                <span className="text-primary hover:text-primary/80 transition text-sm font-medium">
                  09936090374
                </span>
              </Link>
            </Button>

            {/* Facebook */}
            <Button
              variant="ghost"
              className="flex flex-col items-center gap-2 p-6 h-auto bg-muted/50 hover:bg-muted transition-colors"
              asChild
            >
              <Link href="https://facebook.com" target="_blank">
                <FaFacebook className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold text-foreground text-sm">
                  Facebook
                </h3>
                <span className="text-primary hover:text-primary/80 transition text-sm font-medium">
                  LGW Hardware
                </span>
              </Link>
            </Button>
          </div>

          {/* CTA Button */}
          {session ? (
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              <Link href="/dashboard">Get Started</Link>
            </Button>
          ) : (
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              <Link href="/sign-in">Get Started</Link>
            </Button>
          )}
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-card text-muted-foreground px-6 md:px-12 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <p>
            &copy; 2025 LGW Warehouse Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;