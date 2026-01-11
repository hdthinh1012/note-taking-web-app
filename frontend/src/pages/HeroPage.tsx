import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    {/* Content Section */}
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <img src="/ntwa-logo.svg" alt="NTWA Logo" className="w-12 h-12" />
              <h1 className="text-4xl font-bold text-slate-900">Note-taking web app</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/auth/login"
                className="px-6 py-2 text-slate-900 font-semibold hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/auth/signup"
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed">
            This is a Figma design file for a Frontend Mentor challenge. Figma is a design tool
            professional teams use to collaborate on projects. Need help using Figma?{' '}
            <a href="#" className="font-semibold text-slate-900 hover:underline">
              Read our Figma for developers article
            </a>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overview Section */}
        <div className="lg:col-span-3 mt-8">
          <img
            src="/homeview-laptop.jpg"
            alt="Laptop mockup"
            className="w-full rounded-lg shadow-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Design System Card */}
        <div className="bg-white rounded-lg shadow-md p-8 h-fit">
          <div className="flex items-start gap-4 mb-6">
            <img src="/homeview-design-system.svg" alt="Design System" className="w-8 h-8" />
            <h3 className="text-xl font-bold text-slate-900">
              Design System <span className="text-blue-600 ml-2">→</span>
            </h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            The design system contains all the information for reusable components and styles. It
            shows colors, typography styles, and components, including various states of some of
            the key interactive components.
          </p>
        </div>

        {/* Prototype Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-start gap-4 mb-6">
            <img src="/homeview-prototype.svg" alt="Prototype" className="w-8 h-8" />
            <h3 className="text-xl font-bold text-slate-900">
              Prototype <span className="text-blue-600 ml-2">→</span>
            </h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            The prototype illustrates project navigation and user journeys, linking design elements
            to show screen flow and interactions. Prototypes are often used in professional teams
            to improve understanding.
          </p>
        </div>

        {/* Designs Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-start gap-4 mb-6">
            <img src="/homeview-designs.svg" alt="Designs" className="w-8 h-8" />
            <h3 className="text-xl font-bold text-slate-900">
              Designs <span className="text-blue-600 ml-2">→</span>
            </h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            The high-fidelity designs help you build responsive, accessible projects. Aim for
            precision rather than pixel-perfect replicas. For guidance, see Josh Comeau's{' '}
            <span className="font-semibold">"Chasing the Pixel-Perfect Dream."</span>
          </p>
        </div>
      </div>
    </div>
  </main>
);

export default HomePage;
