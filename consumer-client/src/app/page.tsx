"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark, Ic } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { env } from "@/lib/env";

const steps = [
  ["01", "Request", "Send your request to the outlet."],
  ["02", "Accepted", "Your place is confirmed."],
  ["03", "Called", "Go to the counter when called."],
] as const;

const questions = [
  [
    "Is my place confirmed immediately?",
    "Only after the business accepts your request.",
  ],
  [
    "Will I get an exact wait time?",
    "Not currently. Spotly shows the confirmed queue state instead.",
  ],
  [
    "How do I follow my turn?",
    "Keep the queue page open and reconnect if updates pause.",
  ],
] as const;

const categories = [
  ["Coffee", Ic.Clock, "Coffee shops and quick service"],
  ["Health", Ic.Activity, "Clinics and personal care"],
  ["Dining", Ic.Store, "Restaurants and walk-ins"],
  ["Services", Ic.Grid, "Everyday appointments and errands"],
] as const;

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) router.replace("/home");
  }, [loading, router, user]);

  const start = () =>
    user ? router.push("/home") : router.push("/auth/sign-in?returnTo=%2Fhome");

  return (
    <div className="marketing-page">
      <header className="marketing-header">
        <a href="#top" className="brand-lockup" aria-label="Spotly home">
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-name">spotly.</span>
        </a>
        <nav className="marketing-nav" aria-label="Primary navigation">
          <a href="#how">How it works</a>
          <a href="#categories">Explore</a>
          <a href={env.NEXT_PUBLIC_MERCHANT_URL}>For businesses</a>
        </nav>
        <div className="marketing-actions">
          <button
            className="button-secondary"
            onClick={() => router.push("/auth/sign-in?returnTo=%2Fhome")}
          >
            Sign in
          </button>
        </div>
      </header>

      <main id="top" className="marketing-main">
        <section className="marketing-hero" aria-labelledby="consumer-title">
          <div>
            <div className="eyebrow">For your everyday places</div>
            <h1 id="consumer-title" className="consumer-editorial">
              Your place in line.
              <br />A clearer kind of day.
            </h1>
            <p>Find a local business, request a spot, and follow your turn.</p>
            <div className="marketing-cta">
              <button className="button-primary" onClick={start}>
                Find a place <Ic.Arrow />
              </button>
              <a
                className="button-secondary"
                href={env.NEXT_PUBLIC_MERCHANT_URL}
              >
                For businesses <Ic.Arrow />
              </a>
            </div>
          </div>
          <QueuePreview />
        </section>

        <section
          id="how"
          className="marketing-section"
          aria-labelledby="how-title"
        >
          <div className="section-kicker">Three clear steps</div>
          <h2 id="how-title">More time for what you came to do.</h2>
          <div className="steps-grid">
            {steps.map(([number, title, copy]) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="categories"
          className="marketing-section"
          aria-labelledby="category-title"
        >
          <div className="section-kicker">Find a real place</div>
          <h2 id="category-title">Start with what you need.</h2>
          <div className="categories-grid">
            {categories.map(([label, Icon, copy]) => (
              <button className="category-card" key={label} onClick={start}>
                <Icon size={20} />
                <span>
                  <h3>{label}</h3>
                  <p>{copy}</p>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="marketing-section"
          aria-labelledby="questions-title"
        >
          <div className="section-kicker">Three useful questions</div>
          <h2 id="questions-title">Know what the queue means.</h2>
          <div className="steps-grid questions-grid">
            {questions.map(([question, answer]) => (
              <article className="step-card" key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-section">
          <div className="marketing-callout">
            <div>
              <div className="section-kicker">For walk-in businesses</div>
              <h2>Run a better queue.</h2>
              <p>
                Accept requests, call the next customer, and keep your front
                desk focused.
              </p>
            </div>
            <a className="button-primary" href={env.NEXT_PUBLIC_MERCHANT_URL}>
              For businesses <Ic.Arrow />
            </a>
          </div>
        </section>

        <footer className="marketing-footer">
          <span>spotly. © {new Date().getFullYear()}</span>
          <nav>
            <a href="#how">How it works</a>
            <a href={env.NEXT_PUBLIC_MERCHANT_URL}>For businesses</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

function QueuePreview() {
  const [stage, setStage] = useState(0);
  const states = [
    ["Request sent", "The business has received your request."],
    ["Place confirmed", "Your spot is confirmed."],
    ["Your turn", "Go to the counter when called."],
  ] as const;
  const [status, detail] = states[stage];
  return (
    <div className="queue-demo" aria-label="Example journey, sample data">
      <div className="queue-demo-head">
        <div>
          <div className="queue-demo-title">Example journey · Sample data</div>
          <div className="queue-demo-meta">Corner House · Main outlet</div>
        </div>
        <span className="status-chip">{status}</span>
      </div>
      <div className="queue-demo-ticket">
        <div className="queue-demo-meta">Your number</div>
        <strong>045</strong>
        <div className="queue-demo-status">{status}</div>
        <p>{detail}</p>
      </div>
      <button
        className="button-secondary queue-demo-action"
        onClick={() =>
          setStage((value) => (value === states.length - 1 ? 0 : value + 1))
        }
      >
        {stage === states.length - 1
          ? "Replay example"
          : `Show ${stage === 0 ? "accepted" : "called"} state`}{" "}
        <Ic.Arrow />
      </button>
      <div className="queue-demo-meta" style={{ marginTop: 18 }}>
        This is illustrative sample data. It never changes a real queue.
      </div>
    </div>
  );
}
