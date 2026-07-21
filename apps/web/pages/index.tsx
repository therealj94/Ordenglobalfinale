import React from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { FiCheckCircle, FiShield, FiZap, FiUsers } from 'react-icons/fi';

export default function HomePage() {
  const features = [
    {
      icon: FiCheckCircle,
      title: 'Fast Verification',
      description: 'Complete your identity verification in minutes with our advanced facial recognition.'
    },
    {
      icon: FiShield,
      title: 'Secure & Private',
      description: 'Your data is encrypted end-to-end. We comply with GDPR and international data protection standards.'
    },
    {
      icon: FiZap,
      title: 'Instant Access',
      description: 'Once verified, get instant access to all Orden Global ecosystem applications.'
    },
    {
      icon: FiUsers,
      title: 'One Account',
      description: 'Single identity for your entire Orden Global experience. No need to verify multiple times.'
    }
  ];

  return (
    <Layout>
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 min-h-screen text-white overflow-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6">
              GENESIS ID
              <span className="block text-3xl sm:text-4xl text-blue-400 mt-2">
                Unified Identity Verification
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Secure facial verification powered by advanced AI. One verification. Access to everything.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
              >
                Get Started Now
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 border-2 border-blue-400 text-blue-400 rounded-lg font-semibold hover:bg-blue-400 hover:text-white transition"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="mt-16 relative h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-10 blur-3xl rounded-full"></div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mx-auto flex items-center justify-center">
                <FiShield size={48} />
              </div>
              <p className="mt-8 text-gray-300">Trusted by thousands of users worldwide</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-800 bg-opacity-50 backdrop-blur py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-16">Why Choose GENESIS ID?</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-lg p-6 border border-slate-600 hover:border-blue-400 transition">
                    <Icon size={32} className="text-blue-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-blue-400 mb-2">50K+</p>
              <p className="text-xl text-gray-300">Users Verified</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-blue-400 mb-2">99.9%</p>
              <p className="text-xl text-gray-300">Uptime Guarantee</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-blue-400 mb-2">24/7</p>
              <p className="text-xl text-gray-300">Support Available</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Verify Your Identity?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of verified users in the Orden Global ecosystem.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
            >
              Start Verification Now
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-700 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-xl mb-4">GENESIS ID</h3>
                <p className="text-gray-400 text-sm">
                  Unified identity verification for Orden Global ecosystem.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="#features" className="hover:text-white">Features</Link></li>
                  <li><Link href="#" className="hover:text-white">Pricing</Link></li>
                  <li><Link href="#" className="hover:text-white">Security</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="#" className="hover:text-white">Privacy</Link></li>
                  <li><Link href="#" className="hover:text-white">Terms</Link></li>
                  <li><Link href="#" className="hover:text-white">Cookies</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                  <li><Link href="#" className="hover:text-white">Contact</Link></li>
                  <li><Link href="#" className="hover:text-white">Status</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-8 text-center text-gray-400 text-sm">
              <p>&copy; 2024 Orden Global. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
