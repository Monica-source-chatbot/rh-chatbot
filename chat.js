// Fonction serveur (Vercel) — c'est ELLE, et seulement elle, qui détient la clé API.
// Le navigateur du client ne voit jamais cette clé.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { system, messages } = req.body;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY, // stockée dans Vercel, jamais dans le code
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        // Le system prompt (FAQ incluse) est mis en cache côté Anthropic :
        // les appels suivants qui le réutilisent coûtent ~90% moins cher.
        system: [
          { type: 'text', text: system, cache_control: { type: 'ephemeral' } }
        ],
        messages,
      }),
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      console.error('Erreur API Anthropic:', anthropicRes.status, JSON.stringify(data));
    }
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error('Erreur serveur /api/chat:', err);
    res.status(500).json({ error: err.message });
  }
}
