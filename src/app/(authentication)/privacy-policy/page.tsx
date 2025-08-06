// app/privacy-policy/page.tsx
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-medium mb-6 w-fit"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            LGW Warehouse
          </Link>

          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Privacy Policy Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="mb-4">
              LGW Warehouse (we&#34; our&#34; or us) is committed to protecting
              your privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              warehouse management system.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Name and contact information (email address, phone number)
                  </li>
                  <li>Account credentials (username, encrypted password)</li>
                  <li>Professional information (job title, company)</li>
                  <li>Profile information you choose to provide</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Log data (IP address, browser type, pages visited)</li>
                  <li>Device information (device type, operating system)</li>
                  <li>Usage patterns and preferences</li>
                  <li>Warehouse management data and analytics</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our warehouse management services</li>
              <li>Process transactions and manage inventory</li>
              <li>Communicate with you about your account and services</li>
              <li>Improve our services and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
            <p className="mb-4">
              We do not sell, trade, or otherwise transfer your personal
              information to third parties without your consent, except in the
              following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and safety</li>
              <li>With trusted service providers who assist in operations</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your
              personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication measures</li>
              <li>Employee training on data protection</li>
              <li>Secure data storage and backup procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Cookies and Tracking
            </h2>
            <p className="mb-4">
              We use cookies and similar technologies to enhance your
              experience, analyze usage, and provide personalized content. You
              can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="mb-4">
              We retain your personal information only as long as necessary to
              fulfill the purposes outlined in this policy, comply with legal
              obligations, and resolve disputes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              Changes to This Policy
            </h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the Last updated date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p>
                <strong>Email:</strong> privacy@lgwwarehouse.com
              </p>
              <p>
                <strong>Address:</strong> [Your Company Address]
              </p>
              <p>
                <strong>Phone:</strong> [Your Phone Number]
              </p>
            </div>
          </section>
        </div>

        {/* Back to Sign Up */}
        <div className="mt-12 pt-8 border-t">
          <Link href="/signup" className="text-primary hover:underline">
            ← Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
