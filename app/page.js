'use client';

import { SkyButton } from '@sky-ui/react';

export default function HomePage() {

  return (
    <main className="homepage">
      {/* Hero Section */}
      <section className="section hero">
        <div className="container">
          <h1 className="headline">Empower Your Business</h1>
          <p className="subtext">
            A modern solution for inventory, billing, and business insights — all in one platform.
          </p>
          <SkyButton size="lg">Get Started</SkyButton>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="section features">
        <div className="container">
          <h2 className="section-title">What You Get</h2>
          <ul className="feature-list">
            <li>📦 Inventory tracking in real time</li>
            <li>🧾 Fast & accurate billing</li>
            <li>📊 Smart reports & analytics</li>
            <li>🔒 Secure multi-user access</li>
          </ul>
        </div>
      </section>

      {/* About Platform */}
      <section className="section about">
        <div className="container">
          <h2 className="section-title">Built for Growing Businesses</h2>
          <p>
            Whether you're a local retailer or a scaling distributor, our platform adapts to your needs —
            saving time, reducing errors, and increasing transparency.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials">
        <div className="container">
          <h2 className="section-title">What People Say</h2>
          <blockquote>
            “This tool changed the way we run our store. It’s intuitive, fast, and saves us hours every week.”
          </blockquote>
          <cite>– A Happy Customer</cite>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section cta">
        <div className="container">
          <h2 className="section-title">Start Your Journey</h2>
          <p>Sign up in under 2 minutes. No setup fee. Cancel anytime.</p>
          <SkyButton variant="default" size="lg">Create Free Account</SkyButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="section footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Inventory & Billing. All rights reserved.</p>
          <p>Contact: <a href="mailto:support@example.com">support@example.com</a></p>
        </div>
      </footer>
    </main>
  );
}
