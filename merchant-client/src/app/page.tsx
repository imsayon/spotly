"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import { BrandMark, Ic } from "@spotly/ui";
import { useAuthStore } from "@/store/auth.store";
import { env } from "@/lib/env";

const steps = [
  [
    "01",
    "Set up your outlet",
    "Add your business, hours and the services customers come in for.",
  ],
  [
    "02",
    "Accept requests",
    "Review incoming requests and decide who is ready to join the live queue.",
  ],
  [
    "03",
    "Call and complete",
    "Call the next customer, mark the visit complete, and keep the room moving.",
  ],
] as const;

const questions = [
  [
    "Do customers enter immediately?",
    "No. You accept each request before it joins the waiting line.",
  ],
  [
    "How do customers follow updates?",
    "They keep their ticket page open while the server confirms each state.",
  ],
  [
    "Can I run more than one outlet?",
    "Yes. Each outlet has its own queue, share link and working context.",
  ],
] as const;

export default function MerchantLandingPage() {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, router, user]);

  return (
    <div className="marketing-page">
      <header className="marketing-header">
        <a
          href="#top"
          className="brand-lockup"
          aria-label="Spotly for businesses home"
        >
          <span className="brand-mark">
            <BrandMark />
          </span>
          <span className="brand-name">spotly. / business</span>
        </a>
        <nav className="marketing-nav" aria-label="Primary navigation">
          <a href="#how">How it works</a>
          <a href="#capabilities">Capabilities</a>
          <a href={env.NEXT_PUBLIC_CONSUMER_URL}>For customers</a>
        </nav>
        <div className="marketing-actions">
          <button
            className="button-secondary"
            onClick={() => router.push("/auth/sign-in?returnTo=%2Fdashboard")}
          >
            Sign in
          </button>
        </div>
      </header>

      <main id="top" className="marketing-main">
        <section className="marketing-hero" aria-labelledby="merchant-title">
          <div>
            <div className="eyebrow">A clearer front desk</div>
            <h1 id="merchant-title">A calmer front desk.</h1>
            <p>
              Accept requests. Call the next customer. Keep every visit clear.
            </p>
            <div className="marketing-cta">
              <button
                className="button-primary"
                onClick={() =>
                  router.push("/auth/sign-up?returnTo=%2Fdashboard")
                }
              >
                Set up your business <Ic.Arrow />
              </button>
              <button
                className="button-secondary"
                onClick={() =>
                  router.push("/auth/sign-in?returnTo=%2Fdashboard")
                }
              >
                Already registered? Sign in
              </button>
            </div>
          </div>
          <OperatorPreview />
        </section>

        <section
          id="how"
          className="marketing-section"
          aria-labelledby="merchant-how-title"
        >
          <div className="section-kicker">Built for the operator</div>
          <h2 id="merchant-how-title">
            A short line is a better experience for everyone.
          </h2>
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
          id="capabilities"
          className="marketing-section"
          aria-labelledby="capabilities-title"
        >
          <div className="section-kicker">One working surface</div>
          <h2 id="capabilities-title">The tools your team uses every day.</h2>
          <div className="categories-grid">
            <Capability
              icon={Ic.Clock}
              title="Outlet hours"
              copy="Keep availability and open or closed state visible."
            />
            <Capability
              icon={Ic.Tag}
              title="Services"
              copy="Organize the menu or services customers request."
            />
            <Capability
              icon={Ic.Activity}
              title="Live queue"
              copy="See pending, waiting and called customers as they change."
            />
            <Capability
              icon={Ic.Bar}
              title="Daily analytics"
              copy="Review served, missed and waiting activity by outlet."
            />
          </div>
        </section>

        <section
          className="marketing-section"
          aria-labelledby="merchant-questions-title"
        >
          <div className="section-kicker">Three useful questions</div>
          <h2 id="merchant-questions-title">Keep the next decision clear.</h2>
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
              <div className="section-kicker">Ready when you are</div>
              <h2>Make the next visit easier.</h2>
              <p>
                Create your business profile and invite customers to use a queue
                they can understand.
              </p>
            </div>
            <button
              className="button-primary"
              onClick={() => router.push("/auth/sign-up?returnTo=%2Fdashboard")}
            >
              Create your profile <Ic.Arrow />
            </button>
          </div>
        </section>
        <footer className="marketing-footer">
          <span>spotly. / business © {new Date().getFullYear()}</span>
          <nav>
            <a href="#how">How it works</a>
            <a href={env.NEXT_PUBLIC_CONSUMER_URL}>For customers</a>
          </nav>
        </footer>
      </main>
    </div>
  );
}

function OperatorPreview() {
  const [stage, setStage] = useState(0);
  const state =
    stage === 0
      ? {
          title: "Currently called",
          token: "041",
          detail: "Finish this visit before calling the next customer.",
          action: "Mark served",
        }
      : stage === 1
        ? {
            title: "Ready for the next visit",
            token: "—",
            detail: "Call the first accepted customer when you are ready.",
            action: "Call next",
          }
        : {
            title: "Currently called",
            token: "042",
            detail: "Finish this visit before calling the next customer.",
            action: "Mark served",
          };
  return (
    <div className="queue-demo" aria-label="Example queue, sample data">
      <div className="queue-demo-head">
        <div>
          <div className="queue-demo-title">Example queue · Sample data</div>
          <div className="queue-demo-meta">Corner House · Main outlet</div>
        </div>
        <span className="status-chip">{stage === 1 ? "Ready" : "Called"}</span>
      </div>
      <div className="queue-demo-call">
        <div>
          <div className="queue-demo-meta">{state.title}</div>
          <strong>{state.token}</strong>
        </div>
        <div>
          <p>{state.detail}</p>
          <button
            className="button-primary"
            onClick={() => setStage((value) => (value === 2 ? 0 : value + 1))}
          >
            {state.action} <Ic.Arrow />
          </button>
        </div>
      </div>
      <div className="queue-demo-list">
        <QueueRow
          token="046"
          name="New request"
          detail="Requested 1 min ago"
          status="Accept"
        />
        <QueueRow
          token="042"
          name="Next in line"
          detail="Waiting · server order"
          status="Waiting"
        />
      </div>
      <div className="queue-demo-meta" style={{ marginTop: 18 }}>
        This is illustrative sample data. It never changes a real queue.
      </div>
    </div>
  );
}

function QueueRow({
  token,
  name,
  detail,
  status,
  live = false,
}: {
  token: string;
  name: string;
  detail: string;
  status: string;
  live?: boolean;
}) {
  return (
    <div className="queue-demo-row">
      <span className="queue-token">{token}</span>
      <span className="queue-person">
        <strong>{name}</strong>
        <small>{detail}</small>
      </span>
      <span className={`status-chip${live ? " is-live" : ""}`}>{status}</span>
    </div>
  );
}

function Capability({
  icon: Icon,
  title,
  copy,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  copy: string;
}) {
  return (
    <article className="category-card">
      <Icon size={20} />
      <span>
        <h3>{title}</h3>
        <p>{copy}</p>
      </span>
    </article>
  );
}
