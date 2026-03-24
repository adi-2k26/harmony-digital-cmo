import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="container proseBlock">
      <p className="muted">
        <Link href="/">Home</Link> / How it works
      </p>
      <h1>How it works</h1>
      <p>
        Harmony Jewels brings market signals together so your team can make clear decisions and track progress. Each step
        has a clear owner (see{" "}
        <Link href="/agents">Specialists</Link>
        ).
      </p>

      <h2>1. Gather signals</h2>
      <p>We pull in fresh, relevant information—search interest, market moves, and anything you’ve shared—so we’re not guessing.</p>

      <h2>2. Check quality</h2>
      <p>We filter out noise and keep only what matters for luxury jewellery in the UK, with notes on how trustworthy each piece of information is.</p>

      <h2>3. Spot patterns</h2>
      <p>We compare recent weeks with what came before—trends, search behaviour, and where peers are investing effort.</p>

      <h2>4. Create with care</h2>
      <p>Drafts and ideas are checked against your brand voice and transparency rules before anything is suggested for publication.</p>

      <h2>5. Decide together</h2>
      <p>Insights roll up into clear next steps. You can move tasks through review and approval so everyone knows the status.</p>

      <h2>6. Review progress</h2>
      <p>After each module run, your team reviews visual insights directly in that module and agrees the next actions.</p>

      <section className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0 }}>Where to go</h3>
        <ul>
          <li>
            <Link href="/agents">Specialists</Link> — who does what
          </li>
          <li>
            <Link href="/seo">SEO &amp; search</Link> — organic growth ideas
          </li>
        </ul>
      </section>
    </main>
  );
}
