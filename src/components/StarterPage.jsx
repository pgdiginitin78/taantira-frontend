import { useState } from 'react';
import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.png';
import reactLogo from '../assets/react.svg';
import viteLogo from '../assets/vite.svg';
import '../App.css';

export default function StarterPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="vite-starter-root">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D9A0A9]/40 bg-[#FFF9F2] px-6 py-3 text-left text-sm text-[#3D1023]">
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#641B32]" />
          <span>Taantira Workspace — Existing Vite Starter Preserved at /</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/store"
            className="rounded-md bg-[#641B32] px-3.5 py-1.5 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#3D1023]"
          >
            Open Taantira Storefront (/store)
          </Link>
          <Link
            to="/account"
            className="rounded-md border border-[#641B32]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#641B32] transition hover:bg-[#F5E7E8]"
          >
            Customer Portal
          </Link>
          <Link
            to="/admin"
            className="rounded-md border border-[#641B32]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#641B32] transition hover:bg-[#F5E7E8]"
          >
            Admin Portal
          </Link>
          <Link
            to="/delivery"
            className="rounded-md border border-[#641B32]/30 bg-white px-3 py-1.5 text-xs font-medium text-[#641B32] transition hover:bg-[#F5E7E8]"
          >
            Delivery Partner
          </Link>
        </div>
      </div>

      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((c) => c + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks" />

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon" />
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon" />
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon" />
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon" />
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon" />
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon" />
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks" />
      <section id="spacer" />
    </div>
  );
}
