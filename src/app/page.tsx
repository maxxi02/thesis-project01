import { getServerSession } from "@/better-auth/action"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Home() {
  const session = await getServerSession()

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 border-b border-border bg-background/95 backdrop-blur">
        <div className="text-2xl font-bold text-foreground">LGW</div>
        <div className="hidden md:flex gap-8 items-center">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition scroll-smooth">
            Features
          </a>
          <a href="#about" className="text-muted-foreground hover:text-foreground transition scroll-smooth">
            About
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition scroll-smooth">
            Contact
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-16 md:py-24 gap-12 min-h-screen">
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Revolutionize Your Inventory Control
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            LGW Warehouse Management System uses advanced ML-driven automation to eliminate manual inefficiencies in
            stock logging, item categorization, and order fulfillment for construction materials and hardware supplies.
          </p>
          <div className="flex gap-4 pt-4">
            {session ? (
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={"/dashboard"}>Get Started</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href={"/sign-in"}>Get Started</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg">
              <a href="#features" className="scroll-smooth">
                Learn More
              </a>
            </Button>
          </div>
        </div>

        {/* Warehouse Image */}
        <div className="flex-1 flex justify-center">
          <img
            src="/warehouse-management-system-with-boxes-and-shelves.jpg"
            alt="Warehouse management system"
            className="w-full max-w-md rounded-lg shadow-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 md:px-12 py-16 md:py-24 bg-card border-t border-border scroll-smooth">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border bg-background">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-xl">🤖</div>
              <h3 className="text-xl font-semibold text-foreground">ML-Driven Object Detection</h3>
              <p className="text-muted-foreground">
                Automatically categorize items like cement, steel bars, and electrical wiring using advanced machine
                learning algorithms.
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border bg-background">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-xl">📊</div>
              <h3 className="text-xl font-semibold text-foreground">Real-Time Analytics</h3>
              <p className="text-muted-foreground">
                Get actionable insights with comprehensive reporting and real-time visibility into your inventory
                operations.
              </p>
            </div>
            <div className="flex flex-col gap-4 p-6 rounded-lg border border-border bg-background">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-xl">🚚</div>
              <h3 className="text-xl font-semibold text-foreground">Logistics Tracking</h3>
              <p className="text-muted-foreground">
                Monitor product shipments from procurement to delivery with real-time updates and chain-of-custody
                documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-6 md:px-12 py-16 md:py-24 bg-background border-t border-border scroll-smooth">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-foreground">About LGW</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <p className="text-lg text-muted-foreground">
                At LGW Warehouse Management System, we transform inventory management for construction materials and
                hardware supplies through automation and machine learning.
              </p>
              <p className="text-lg text-muted-foreground">
                Using real-time analytics and ML-powered object detection, our system removes manual inefficiencies in
                stock logging, categorization, and order fulfillment. It efficiently manages high-volume inventories
                like cement, steel bars, and plumbing fixtures.
              </p>
              <p className="text-lg text-muted-foreground">
                With comprehensive logistics tracking, it delivers real-time shipment updates, delivery estimates, and
                full supply chain visibility to optimize operations, boost efficiency, and reduce costs.
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src="/team-working-in-warehouse-office.jpg"
                alt="Our team"
                className="w-full max-w-sm rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="px-6 md:px-12 py-16 md:py-24 text-center bg-card border-t border-border scroll-smooth"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Get In Touch</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Ready to transform your warehouse operations? Contact us today to schedule a demo or learn more about LGW.
          </p>
          <div className="flex flex-col md:flex-row gap-6 justify-center mb-8">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground">Email</h3>
              <a href="mailto:info@lgw.com" className="text-primary hover:text-primary/80 transition">
                info@lgw.com
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground">Phone</h3>
              <a href="tel:+1234567890" className="text-primary hover:text-primary/80 transition">
                +1 (234) 567-890
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground">Address</h3>
              <p className="text-muted-foreground">123 Logistics Ave, Tech City, TC 12345</p>
            </div>
          </div>
          {session ? (
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={"/dashboard"}>Get Started</Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href={"/sign-in"}>Get Started</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card text-muted-foreground px-6 md:px-12 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2025 LGW Warehouse Management System. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
