// src/services/anthropicService.js
// ------------------------------------------------------------
// All Anthropic API calls live here. Swap out the model or
// add extra tools (web_search etc.) in one place.
// ------------------------------------------------------------

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL   = "claude-sonnet-4-20250514";

/**
 * Detect groceries in a base64-encoded image.
 * @param {string} base64Image  - raw base64 string (no data-URI prefix)
 * @param {string} mediaType    - e.g. "image/jpeg"
 * @returns {Promise<DetectionResult>}
 */
export async function detectGroceries(base64Image, mediaType = "image/jpeg") {
  const prompt = `Analyze this image and identify every grocery / food item visible.
Return ONLY a valid JSON object — no markdown fences, no extra text — with this exact shape:
{
  "items": [
    {
      "name": "string",
      "category": "Produce | Meat & Seafood | Dairy | Pantry | Beverages | Bakery | Frozen | Herbs & Spices | Other",
      "confidence": "high | medium | low",
      "quantity": "string or null"
    }
  ],
  "summary": "one sentence description of what you see",
  "totalItems": number
}`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

/**
 * Suggest recipes based on a list of ingredient names.
 * @param {string[]} ingredients
 * @returns {Promise<RecipeSuggestion[]>}
 */
export async function suggestRecipes(ingredients) {
  const prompt = `Given these ingredients: ${ingredients.join(", ")}
Suggest 3 simple recipes I can make.
Return ONLY valid JSON — no markdown — with this shape:
{
  "recipes": [
    {
      "name": "string",
      "time": "e.g. 20 mins",
      "difficulty": "Easy | Medium | Hard",
      "usesIngredients": ["list of matching ingredients"],
      "steps": ["step 1", "step 2"]
    }
  ]
}`;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || "").join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
