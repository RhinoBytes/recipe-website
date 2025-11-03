import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Contact Us | CookBook",
  description: "Get in touch with the CookBook team. We'd love to hear from you!",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg ">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-accent-light to-secondary-light py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="text-accent" size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text text-center mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-text-secondary text-center max-w-2xl mx-auto">
            Have a question, suggestion, or just want to say hello? We&apos;d love to hear from you!
          </p>
        </div>
      </div>

      {/* Contact Options */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Email */}
          <div className="bg-bg-secondary rounded-lg shadow-md p-6 text-center border border-border hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center">
                <Mail className="text-accent" size={32} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Email Us</h3>
            <p className="text-text-secondary mb-4">
              Send us an email and we&apos;ll respond within 24-48 hours
            </p>
            <a
              href="mailto:support@cookbook.com"
              className="text-accent hover:text-accent-hover font-medium"
            >
              support@cookbook.com
            </a>
          </div>

          {/* Community */}
          <div className="bg-bg-secondary rounded-lg shadow-md p-6 text-center border border-border hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-secondary-light rounded-full flex items-center justify-center">
                <MessageCircle className="text-secondary" size={32} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Community</h3>
            <p className="text-text-secondary mb-4">
              Join our community and connect with other home cooks
            </p>
            <span className="text-text-muted">
              Coming soon!
            </span>
          </div>

          {/* FAQ */}
          <div className="bg-bg-secondary rounded-lg shadow-md p-6 text-center border border-border hover:shadow-lg transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-accent-light rounded-full flex items-center justify-center">
                <HelpCircle className="text-accent" size={32} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">FAQ</h3>
            <p className="text-text-secondary mb-4">
              Check our FAQ for quick answers to common questions
            </p>
            <Link
              href="/faq"
              className="text-accent hover:text-accent-hover font-medium"
            >
              View FAQ
            </Link>
          </div>
        </div>

        {/* Contact Form Placeholder */}
        <div className="bg-bg-secondary rounded-lg shadow-md p-8 border border-border">
          <h2 className="text-2xl font-bold text-text mb-6">Send us a message</h2>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                Your Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-text-secondary mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                placeholder="Tell us more about your question or feedback..."
              />
            </div>

            <div className="bg-accent-light/50 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text">Note:</strong> This is a placeholder form. Form submission functionality will be implemented soon. 
                In the meantime, please reach out to us directly at{" "}
                <a href="mailto:support@cookbook.com" className="text-accent hover:text-accent-hover font-medium">
                  support@cookbook.com
                </a>
              </p>
            </div>

            <button
              type="button"
              disabled
              className="w-full px-6 py-3 bg-text-muted text-bg font-medium rounded-2xl cursor-not-allowed opacity-60"
            >
              Form Coming Soon
            </button>
          </form>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
