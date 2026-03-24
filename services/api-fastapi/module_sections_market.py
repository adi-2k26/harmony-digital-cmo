"""UK market–first module payloads: research_sources, application_note, peer SEO depth."""

from __future__ import annotations

_RS = lambda label, scope, kind, detail=None: {  # noqa: E731
    "label": label,
    "scope": scope,
    "kind": kind,
    **({"detail": detail} if detail else {}),
}

MARKET_MODULES: list[dict] = [
    {
        "key": "trend",
        "title": "UK Market Trends",
        "narrative": (
            "This module shows what is rising or slowing in UK luxury jewellery demand, so your team can "
            "time campaigns around real buyer interest instead of assumptions."
        ),
        "primary_metric": "uk_trend_momentum_index",
        "value": 82,
        "trend_percent": 14,
        "summary": (
            "Use this first to see market direction: what buyers are responding to now, what is flattening, "
            "and where momentum is building for the next campaign cycle."
        ),
        "user_value": (
            "Best for campaign timing, monthly planning, and budget focus."
        ),
        "primary_actions": [
            "Brief the creative team on top UK market story arcs (proposal journey, certification transparency)",
            "Align paid and organic tests to the same high-momentum themes identified here",
        ],
        "application_note": (
            "Map the strongest themes to your brand’s collections and proof points; adapt tone to your "
            "positioning without copying competitors verbatim."
        ),
        "purpose_note": (
            "This module studies UK-wide luxury jewellery trend signals (aggregated and modelled). "
            "It is not a live firehose from every network API; numbers are directional indices for planning."
        ),
        "metric_explanations": {
            "primary_metric": (
                "uk_trend_momentum_index is a 0–100 market momentum score vs a rolling UK category "
                "baseline for tracked themes—not your brand’s private revenue or share."
            ),
            "primary_value": (
                "82 indicates strong positive momentum in the tracked UK themes vs the prior baseline window."
            ),
            "trend_percent": (
                "+14% is the change in the index vs the prior comparable period—illustrative, not a forecast."
            ),
        },
        "research_sources": [
            _RS(
                "UK luxury social trend synthesis",
                "uk_market",
                "aggregated_signal",
                "Short-form and feed signals normalised to jewellery categories (illustrative composite).",
            ),
            _RS(
                "Search intent language clusters (UK)",
                "uk_market",
                "editorial_synthesis",
                "High-intent phrases (e.g. bespoke, engagement rings London) cross-referenced to creative hooks.",
            ),
            _RS(
                "Category editorial & trade notes",
                "category_benchmark",
                "editorial_synthesis",
                "Seasonal and category narratives from public marketing discourse.",
            ),
            _RS(
                "Optional: your connected exports",
                "connected_account",
                "connected_account",
                "When Meta/TikTok/Search Console exports are wired, scores can be grounded in your data.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Shapes and stories winning share of attention",
                "body": (
                    "Oval and radiant cuts paired with proposal-journey storytelling are outperforming "
                    "round-only hero grids in UK luxury feeds when CTAs lead to consultation, not price."
                ),
                "comparison": (
                    "Vs round-only and price-led posts, this cluster shows higher save/share velocity in "
                    "the same 90-day UK window in the model."
                ),
            },
            {
                "title": "Search–social language match",
                "body": (
                    "Hooks that echo how UK buyers search (bespoke, certification, local appointment) "
                    "align better with education-to-booking journeys than pure lifestyle imagery."
                ),
                "comparison": (
                    "Compared to generic luxury lifestyle creative, intent-aligned hooks correlate with "
                    "stronger downstream engagement in the snapshot."
                ),
            },
            {
                "title": "Adjacent categories to watch",
                "body": (
                    "Wedding bands and stackables often lag engagement-ring buzz; cross-promote from "
                    "high-momentum proposal content to lift adjacent demand."
                ),
                "comparison": (
                    "Wedding-band narratives are flatter vs engagement-ring momentum in the current window."
                ),
            },
        ],
        "links": [
            {"label": "How it works", "href": "/how-it-works"},
            {"label": "Agents", "href": "/agents"},
        ],
    },
    {
        "key": "audience",
        "title": "UK Audience Signals",
        "narrative": (
            "This module explains which audience groups show stronger buying intent and which are still "
            "in early research mode."
        ),
        "primary_metric": "uk_buyer_quality_index",
        "value": 76,
        "trend_percent": 9,
        "summary": (
            "Use this to decide who to target, what message to show each segment, and where to focus spend "
            "for higher-quality enquiries."
        ),
        "user_value": (
            "Best for audience targeting, persona focus, and channel-level messaging."
        ),
        "primary_actions": [
            "Rebuild retargeting pools around UK engagement-ring researchers and long-session readers",
            "Add trust and certification blocks on pages with high exit before enquiry",
        ],
        "application_note": (
            "Layer these patterns onto your CRM and analytics segments; treat this module as market "
            "structure, not PII."
        ),
        "purpose_note": (
            "Describes UK market audience structure in aggregate. It does not expose individual users "
            "or replace your first-party CDP."
        ),
        "metric_explanations": {
            "primary_metric": (
                "uk_buyer_quality_index is a 0–100 score for consultation-prone behaviour vs broad reach "
                "in the tracked UK sample."
            ),
            "primary_value": (
                "76 signals a strong share of sessions behaving like high-intent UK jewellery buyers vs "
                "mixed-traffic baselines."
            ),
            "trend_percent": (
                "+9% reflects improving quality of engagement vs the prior window in the model."
            ),
        },
        "metric_display_name": "UK buyer quality index",
        "research_sources": [
            _RS(
                "UK journey pattern synthesis",
                "uk_market",
                "aggregated_signal",
                "Session-shape patterns typical of luxury ecommerce and brochure sites.",
            ),
            _RS(
                "Category benchmark funnels",
                "category_benchmark",
                "category_benchmark",
                "Consultation-led vs browse-only paths common among UK independents and premium brands.",
            ),
            _RS(
                "Peer landing page behaviour (sample)",
                "peer_set",
                "serp_sample",
                "Representative UK jeweller sites reviewed for exit and content depth patterns.",
            ),
            _RS(
                "Your observation snapshots (when DB connected)",
                "connected_account",
                "connected_account",
                "May blend in when observation_snapshot data exists.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Education + appointment journeys",
                "body": (
                    "UK visitors who consume diamond education, certification, or workshop content before "
                    "booking show higher enquiry quality than click-only traffic."
                ),
                "comparison": (
                    "Vs browse-only jewellery interest, education-led paths show much higher qualified "
                    "enquiry rates in the modelled comparison."
                ),
            },
            {
                "title": "Trust gaps",
                "body": (
                    "Thin proof (reviews, credentials, process) correlates with exits before enquiry "
                    "across peer UK sites."
                ),
                "comparison": (
                    "Pages with strong trust modules retain researchers longer than thin category pages "
                    "in the same peer sample."
                ),
            },
            {
                "title": "Targeting efficiency",
                "body": (
                    "Narrow jewellery-intent pools often beat broad luxury audiences for cost per qualified lead."
                ),
                "comparison": (
                    "Broad luxury interest can win reach but loses on consultation CPA vs narrow pools."
                ),
            },
        ],
        "links": [
            {"label": "Report center", "href": "/report-center"},
            {"label": "How it works", "href": "/how-it-works"},
        ],
    },
    {
        "key": "content",
        "title": "Category Content",
        "narrative": (
            "This module shows which content styles, hooks, and calls-to-action are working best in your "
            "category right now."
        ),
        "primary_metric": "category_engagement_rate_proxy",
        "value": 7.9,
        "trend_percent": 11,
        "summary": (
            "Use it to choose what to create more of, what to stop, and how to brief content with clearer "
            "creative direction."
        ),
        "user_value": (
            "Best for content planning, campaign briefs, and improving creative consistency."
        ),
        "primary_actions": [
            "Repurpose top-performing hooks across Stories, statics, and email using one narrative spine",
            "Run A/B tests on CTA placement on posts that already match UK intent language",
        ],
        "application_note": (
            "Translate winning patterns into your brand voice and approval workflow; keep disclosure "
            "and pricing claims compliant with your policies."
        ),
        "purpose_note": (
            "Focuses on **category-level** content performance patterns in the UK luxury jewellery space, "
            "not a replacement for each platform’s native analytics."
        ),
        "metric_explanations": {
            "primary_metric": (
                "category_engagement_rate_proxy blends meaningful engagement vs reach for the tracked "
                "UK-relevant content set."
            ),
            "primary_value": (
                "7.9% is a strong illustrative benchmark for depth-of-engagement vs reach in this snapshot."
            ),
            "trend_percent": (
                "+11% is movement vs the prior comparable window—validate with your top-performing assets."
            ),
        },
        "research_sources": [
            _RS(
                "UK luxury social content sample",
                "uk_market",
                "aggregated_signal",
                "Representative brand and creator patterns in jewellery and bridal luxury.",
            ),
            _RS(
                "Format effectiveness synthesis",
                "category_benchmark",
                "editorial_synthesis",
                "Editorial review of hook types (transparency, craft, proposal story).",
            ),
            _RS(
                "Platform export hooks (optional)",
                "connected_account",
                "connected_account",
                "When connected, your posts can ground the benchmark in your own library.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Proposal journey vs catalogue",
                "body": (
                    "Story-led reels and carousels beat static product grids for saves and shares in "
                    "UK luxury jewellery feeds."
                ),
                "comparison": (
                    "Vs catalogue-only posts, journey-led formats show higher meaningful engagement per "
                    "1k impressions in the sample."
                ),
            },
            {
                "title": "Transparency hooks",
                "body": (
                    "Certification, sourcing, and workshop transparency outperform price-first hooks "
                    "for consultation-quality clicks."
                ),
                "comparison": (
                    "Price-led hooks may spike reach but underperform on enquiry quality vs transparency-led."
                ),
            },
            {
                "title": "Series vs one-offs",
                "body": (
                    "Consistent series sustain intent better than one-off viral spikes that decay after 48 hours."
                ),
                "comparison": (
                    "Serial content maintains steadier engagement than single viral outliers in the window."
                ),
            },
        ],
        "links": [
            {"label": "Agents", "href": "/agents"},
            {"label": "How it works", "href": "/how-it-works"},
        ],
    },
    {
        "key": "competitor",
        "title": "Peers & Competitors",
        "narrative": (
            "This module tracks visible peer patterns so you can see what competitors are pushing and where "
            "you can stand out."
        ),
        "primary_metric": "peer_pressure_index",
        "value": 68,
        "trend_percent": 6,
        "summary": (
            "Use this to identify competitor messaging trends, spot market gaps, and avoid copying tactics "
            "that do not fit your positioning."
        ),
        "user_value": (
            "Best for positioning decisions, offer framing, and competitive strategy checks."
        ),
        "primary_actions": [
            "Maintain a monthly peer landing-page review (offers, hero, proof, schema)",
            "Stress-test messaging: craft-led vs discount-led framing in paid and organic tests",
        ],
        "application_note": (
            "Use peer insights to sharpen your value story and on-site proof; do not copy claims "
            "you cannot substantiate."
        ),
        "purpose_note": (
            "Summarises public-facing peer moves (messaging, offers, page types). No scraping of "
            "non-public or personally identifiable data."
        ),
        "metric_explanations": {
            "primary_metric": (
                "peer_pressure_index measures how aggressively the tracked UK peer set pushes speed, "
                "price, and education—higher means more crowded tactics."
            ),
            "primary_value": (
                "68 indicates elevated but manageable competitive noise: education and booking speed are "
                "common, not only discount wars."
            ),
            "trend_percent": (
                "+6% means peer pressure ticked up vs the prior review window."
            ),
        },
        "metric_display_name": "Peer pressure index",
        "research_sources": [
            _RS(
                "Representative UK jeweller peer set",
                "peer_set",
                "serp_sample",
                "Manual or tool-assisted review of public landing pages and offers.",
            ),
            _RS(
                "Category promotional cycles",
                "uk_market",
                "editorial_synthesis",
                "Seasonal sale and event patterns in UK jewellery retail.",
            ),
            _RS(
                "Search visibility notes (sample queries)",
                "uk_market",
                "serp_sample",
                "High-intent UK queries sampled for title/meta and SERP feature patterns.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Lab-grown education arms race",
                "body": (
                    "Many peers foreground lab-grown education and comparison; your brand can win on "
                    "natural diamond expertise and bespoke process without mirroring commodity framing."
                ),
                "comparison": (
                    "Vs last quarter, more peer homepages hero lab-grown or hybrid education modules."
                ),
            },
            {
                "title": "Speed vs depth",
                "body": (
                    "Fast-book CTAs are widespread; fewer peers surface workshop, certification, and "
                    "design depth above the fold."
                ),
                "comparison": (
                    "Mass-market brands emphasise speed; premium independents can own craft and transparency."
                ),
            },
            {
                "title": "Review cadence",
                "body": (
                    "Monthly reviews catch short promotional tests; quarterly misses many peer A/B cycles."
                ),
                "comparison": (
                    "4–6 week promotional experiments are common in paid social and landing tests."
                ),
            },
        ],
        "links": [
            {"label": "Agents", "href": "/agents"},
            {"label": "How it works", "href": "/how-it-works"},
        ],
    },
    {
        "key": "opportunity",
        "title": "Market Opportunities",
        "narrative": (
            "This module turns all signals into a practical priority list of where to act first for the "
            "highest return on effort."
        ),
        "primary_metric": "market_opportunity_score",
        "value": 88,
        "trend_percent": 18,
        "summary": (
            "Use it to separate quick wins from longer strategic plays and build a clear order of action "
            "for the team."
        ),
        "user_value": (
            "Best for planning next actions, assigning owners, and sequencing delivery."
        ),
        "primary_actions": [
            "Ship FAQ + Product/Local schema on URLs targeting top UK intent clusters",
            "Align paid search messaging with organic page intent for the same keyword groups",
        ],
        "application_note": (
            "Validate priority URLs in your Search Console and analytics; adjust for stock, margin, "
            "and production capacity."
        ),
        "purpose_note": (
            "Scores are modelled opportunity maps for the UK jewellery category—not guaranteed "
            "rank outcomes."
        ),
        "metric_explanations": {
            "primary_metric": (
                "market_opportunity_score blends rank gap, demand, and content depth potential vs effort."
            ),
            "primary_value": (
                "88 indicates a concentrated set of high-upside UK intents in the tracked map."
            ),
            "trend_percent": (
                "+18% reflects a richer or clearer opportunity set vs the prior window."
            ),
        },
        "metric_display_name": "Market opportunity score",
        "research_sources": [
            _RS(
                "UK intent volume & rank-gap model",
                "uk_market",
                "aggregated_signal",
                "Keyword clusters and illustrative rank positions for planning.",
            ),
            _RS(
                "Peer content depth benchmark",
                "peer_set",
                "serp_sample",
                "How thoroughly peers cover FAQs and education on top URLs.",
            ),
            _RS(
                "Implementation effort norms",
                "category_benchmark",
                "editorial_synthesis",
                "Typical time to ship schema, FAQ blocks, and internal links.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Local intent still dominates",
                "body": (
                    "Queries like engagement rings London and nearby variants reward depth, schema, and "
                    "local proof more than thin category shells."
                ),
                "comparison": (
                    "Vs generic jewellery head terms, local intent URLs drive stronger enquiry value when "
                    "they reach page one."
                ),
            },
            {
                "title": "Quick wins vs long plays",
                "body": (
                    "Title alignment, FAQ blocks, and schema often move needle faster than net-new hubs."
                ),
                "comparison": (
                    "Net-new collection pages typically take longer to earn trust and links than upgrading "
                    "existing high-intent URLs."
                ),
            },
            {
                "title": "Paid + organic synergy",
                "body": (
                    "Consistent messaging across paid and organic for the same clusters improves quality "
                    "and on-site engagement."
                ),
                "comparison": (
                    "Siloed campaigns often show higher CPC and weaker session quality than aligned clusters."
                ),
            },
        ],
        "links": [
            {"label": "SEO module", "href": "/seo"},
            {"label": "How it works", "href": "/how-it-works"},
        ],
    },
    {
        "key": "seo",
        "title": "UK SEO & Peer Search Patterns",
        "narrative": (
            "Peers cluster on local intent titles, FAQ and Product schema, and education pages; gaps "
            "remain in E-E-A-T depth and internal linking on high-value UK queries."
        ),
        "primary_metric": "peer_adjusted_avg_rank_proxy",
        "value": 13.2,
        "trend_percent": 25,
        "summary": (
            "What UK competitors optimise for in organic search and how to refine your SEO: intents, "
            "on-page patterns, schema, and measurement."
        ),
        "user_value": (
            "Steal-with-pride from peer SERP patterns, then out-educate and out-trust on your own site."
        ),
        "primary_actions": [
            "Audit top UK intent URLs against peer title/meta/FAQ coverage; close gaps with unique expertise",
            "Implement LocalBusiness, Product, FAQ schema where eligible; validate in Rich Results Test",
        ],
        "application_note": (
            "Use Search Console for URL-level queries and clicks; this module informs **strategy and peer "
            "patterns**, not live rankings for every page."
        ),
        "purpose_note": (
            "Combines **UK peer SERP patterns** and category SEO best practice. Live ranks vary by day; "
            "wire Search Console for ground truth."
        ),
        "metric_explanations": {
            "primary_metric": (
                "peer_adjusted_avg_rank_proxy is an illustrative mean rank across a tracked UK priority "
                "query set—lower is better. It summarises visibility shape, not every keyword."
            ),
            "primary_value": (
                "13.2 represents mid page-one toward page-two average in the illustrative set—use as "
                "direction vs your own GSC."
            ),
            "trend_percent": (
                "+25% encodes improvement momentum in the proxy toward better ranks—read next to "
                "the numeric average (lower average is better)."
            ),
        },
        "metric_display_name": "Peer-adjusted average rank proxy",
        "research_sources": [
            _RS(
                "UK peer SERP sample (titles, meta, schema)",
                "peer_set",
                "serp_sample",
                "Representative independents and premium chains for high-intent jewellery queries.",
            ),
            _RS(
                "Search intent clusters (UK)",
                "uk_market",
                "aggregated_signal",
                "Grouped intents: local, education, comparison, transactional.",
            ),
            _RS(
                "Technical SEO baseline",
                "category_benchmark",
                "editorial_synthesis",
                "Core Web Vitals, crawl hygiene, and schema patterns considered table stakes.",
            ),
            _RS(
                "Google Search Console (recommended connection)",
                "connected_account",
                "connected_account",
                "Connect for queries, pages, and CTR—this module does not replace GSC.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Peer on-page patterns",
                "body": (
                    "Peers often use city + intent in titles, FAQ blocks for objections, and Product schema "
                    "on bestsellers; many under-invest in long-form education that earns links."
                ),
                "comparison": (
                    "Thin category pages rank weaker than education hubs for comparison and certification "
                    "queries in competitive UK SERPs."
                ),
            },
            {
                "title": "Schema and rich results",
                "body": (
                    "LocalBusiness + Product + FAQ improve eligibility for rich results and trust; pair "
                    "with fast, stable pages."
                ),
                "comparison": (
                    "URLs without eligible schema often see lower CTR at the same average position vs "
                    "rich-result-ready peers."
                ),
            },
            {
                "title": "Refinement playbook",
                "body": (
                    "Gap analysis: for each priority intent, compare your depth vs peer coverage; add "
                    "unique expertise (process, certification, bespoke). Strengthen internal links from "
                    "education to money pages. Measure in GSC: impressions, position, CTR, and enquiries—not "
                    "rank alone."
                ),
                "comparison": (
                    "Teams that iterate titles and FAQs on 30-day cycles from GSC data outperform "
                    "one-off optimisations in competitive London intents."
                ),
            },
        ],
        "links": [
            {"label": "How it works", "href": "/how-it-works"},
            {"label": "Competitive benchmark", "href": "/brand-benchmark"},
        ],
    },
    {
        "key": "brand_benchmark",
        "title": "Competitive benchmark",
        "narrative": (
            "Benchmark Harmony Jewels against Queensmith, Flawless Fine Jewellery, and 77 Diamonds across "
            "brand, content, SEO, trust, and journey—so leadership can see clear gaps and differentiation plays."
        ),
        "primary_metric": "harmony_competitive_index",
        "value": 74.0,
        "trend_percent": 12.0,
        "summary": (
            "A CMO-wide view of how Harmony compares to three named UK peers on strategy-ready criteria, "
            "with scored dashboards and ranked initiatives after each full analysis run."
        ),
        "user_value": (
            "Use this to decide what to do differently next quarter: positioning, creative, SEO, trust, "
            "and experience—without guessing."
        ),
        "primary_actions": [
            "Run full analysis and review the benchmark dashboards with marketing and creative leads",
            "Align the top initiatives with your analytics and Search Console validation plan",
        ],
        "application_note": (
            "Scores are directional and modelled unless you connect first-party data; use this as a "
            "decision brief, not a financial audit."
        ),
        "purpose_note": (
            "Monitors only the four named brands in this module. Output refreshes when you run full analysis."
        ),
        "metric_explanations": {
            "primary_metric": (
                "harmony_competitive_index summarises Harmony’s relative position vs the three peers in "
                "this snapshot—use with the criterion breakdown, not as a single KPI for bonuses."
            ),
            "primary_value": (
                "Illustrative composite for planning; each run may shift as Trends and synthesis update."
            ),
            "trend_percent": (
                "Movement vs the prior comparable window in the model—confirm with your own benchmarks."
            ),
        },
        "metric_display_name": "Harmony competitive index",
        "research_sources": [
            _RS(
                "Google Trends (UK) brand and category terms",
                "uk_market",
                "live_signal",
                "Interest-over-time where available; may be partial if rate-limited.",
            ),
            _RS(
                "Public brand positioning synthesis",
                "category_benchmark",
                "editorial_synthesis",
                "Typical luxury jewellery marketing patterns for the named peers—labelled as synthesis.",
            ),
            _RS(
                "Harmony Jewels context (module snapshot)",
                "client_context",
                "snapshot",
                "Curated module framing for Harmony Jewels London.",
            ),
        ],
        "detailed_insights": [
            {
                "title": "Why named peers",
                "body": (
                    "Queensmith, Flawless Fine Jewellery, and 77 Diamonds are fixed for consistent "
                    "comparison; change requests need a product update."
                ),
                "comparison": (
                    "Broader peer sets are covered in other modules; this one is for focused benchmarking."
                ),
            },
        ],
        "links": [
            {"label": "How it works", "href": "/how-it-works"},
            {"label": "Peers & competitors", "href": "/competitor"},
        ],
    },
]
