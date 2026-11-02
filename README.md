# MyMindTherapyFriend (MMTF)

India's AI-Powered Mental Health Platform with Manas AI companion, CBT self-help tools, mood tracking, verified online counsellor booking, and 52-day live mental health skills courses.

---

## What changed in the files
- **1-head-tags.html**: The home title is now “MyMindTherapyFriend (MMTF): AI Mental Health App, India”, with a platform-first description.
- **1b-course-page-heads.html (new)**: Head tags for the three course pages.
- **2-jsonld-schema.html**: Organization, WebSite and a WebApplication with your free and ₹499 offers, with no duplicate FAQ.
- **2b-jsonld-courses.html (new)**: Course schema for each course page, with all three batches.
- **4-cro-tracking.html**: Platform-first buttons and sign-up events. The footer has two safety lines, one for the platform (“not an emergency service, call 112 or Tele-MANAS 14416”) and one for the courses (“not a licence”). Please verify the helpline numbers.
- **6-brand-visibility.html**: A platform-first hero, the clean-up of the repeated brand text, a note on the testimonial, and a list of the new pages to build.
- **5-seo-ppc-plan.md**: A keyword map per page, four Google Ads campaigns, brand-search tactics, CRO, MEO, GEO and a 90-day content plan.
- **robots.txt, sitemap.xml, llms.txt and README.md are updated too.**

---

## Live Structure & Architecture
- **Web App**: Vite + React 19 + TanStack Router & Query + TailwindCSS + Clerk Auth
- **Backend**: Express + TypeScript + MongoDB + LiveKit
- **Mobile App**: Expo / React Native
- **SEO & AI Search (GEO)**:
  - `frontend/public/robots.txt`: Search and AI crawler directives (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot)
  - `frontend/public/sitemap.xml`: Live canonical routes and course pages
  - `frontend/public/llms.txt`: Structured platform and citation manifest for LLM answer engines
  - Microdata / JSON-LD: Schema.org Organization, WebSite, WebApplication, and Course instances
