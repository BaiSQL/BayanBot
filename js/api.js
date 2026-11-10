// Gemini API call with model fallback (used by Create image).

async function callGemini(system, contents, level){
  const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.8-flash"];
  const idxs = MODELS.map((m, i) => i);
  const order = idxs.slice(modelIdx).concat(idxs.slice(0, modelIdx));
  let response, data;
  for(const i of order){
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODELS[i] + ":generateContent", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "x-goog-api-key":apiKey },
      body:JSON.stringify({
        systemInstruction:{ parts:[{ text:system }] },
        contents,
        generationConfig:{ maxOutputTokens:16384, thinkingConfig:{ thinkingLevel:level } }
      })
    });
    data = await response.json();
    const errText = (data.error && data.error.message) || '';
    const skip = response.status === 404 || response.status === 429 || /no longer available|not found|not supported/i.test(errText);
    if(!skip){ modelIdx = i; break; }
  }
  return { response, data };
}
