const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://propcinity.in'

export async function GET() {
  const body = `# Propcinity

> Propcinity is a buyer-side real estate channel partner for Pune, India. We are not a listings site — we use AI to curate a shortlist of properties that actually fit a buyer's budget and preferences, verify RERA status, score builder trust, and negotiate with developers on the buyer's behalf. The service is free for buyers; developers pay us, not the other way around.

## Key facts
- Zero brokerage for buyers — Propcinity is compensated by developers, not homebuyers.
- AI Match % scoring narrows thousands of listings down to a relevant shortlist based on stated budget, purpose, and preferences.
- Every listed project is RERA-verified.
- Propcinity acts as the buyer's channel partner through to possession, not just at the point of sale.
- Operating market: Pune, Maharashtra, India.

## Key pages
- [Homepage](${BASE_URL}/): Overview of the Propcinity model.
- [Explore](${BASE_URL}/explore): AI-curated property shortlist and search.
- [Compare](${BASE_URL}/compare): Side-by-side comparison of shortlisted properties.
- [Blog](${BASE_URL}/blogs): Guides and neighborhood insights for Pune homebuyers.
- [About](${BASE_URL}/about): How the channel-partner model works.
- [FAQ](${BASE_URL}/faq): Common questions about pricing, Match %, and the buying process.
- [Contact](${BASE_URL}/contact): Get in touch with the Propcinity team.

## Sitemap
${BASE_URL}/sitemap.xml
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
