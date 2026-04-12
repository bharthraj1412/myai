import { NextResponse } from "next/server"

/**
 * POST /api/models/validate
 *
 * Validates a custom model endpoint by sending a minimal chat completion
 * request. Supports OpenAI-compatible APIs (vLLM, Ollama, LiteLLM, etc.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { baseUrl, apiKey, modelName } = body

    if (!baseUrl || !modelName) {
      return NextResponse.json(
        { valid: false, error: "Base URL and model name are required" },
        { status: 400 },
      )
    }

    // Normalize the base URL
    let url = baseUrl.trim().replace(/\/+$/, "")
    // If it doesn't end with /chat/completions, add it
    const completionsUrl = url.endsWith("/chat/completions")
      ? url
      : `${url}/chat/completions`

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }

    // Minimal test payload
    const payload = {
      model: modelName,
      messages: [{ role: "user", content: "Say hi" }],
      max_tokens: 5,
      temperature: 0,
    }

    const startTime = performance.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    try {
      const response = await fetch(completionsUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeout)
      const latencyMs = Math.round(performance.now() - startTime)

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}`
        try {
          const errBody = await response.json()
          errorDetail =
            errBody?.error?.message || errBody?.detail || errBody?.error || errorDetail
        } catch {
          // Could not parse error body
        }
        return NextResponse.json({
          valid: false,
          error: `Model endpoint returned ${errorDetail}`,
          latency_ms: latencyMs,
        })
      }

      // Validate response structure
      const data = await response.json()
      const hasChoices =
        data?.choices && Array.isArray(data.choices) && data.choices.length > 0
      const hasContent =
        hasChoices &&
        (data.choices[0]?.message?.content || data.choices[0]?.delta?.content)

      if (!hasChoices) {
        return NextResponse.json({
          valid: false,
          error:
            "Endpoint responded but the response format is not OpenAI-compatible (missing 'choices')",
          latency_ms: latencyMs,
        })
      }

      return NextResponse.json({
        valid: true,
        latency_ms: latencyMs,
        model: data?.model || modelName,
        has_content: !!hasContent,
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const latencyMs = Math.round(performance.now() - startTime)

      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json({
          valid: false,
          error: "Connection timed out after 15 seconds",
          latency_ms: latencyMs,
        })
      }

      return NextResponse.json({
        valid: false,
        error: `Connection failed: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`,
        latency_ms: latencyMs,
      })
    }
  } catch (err) {
    return NextResponse.json(
      {
        valid: false,
        error: `Invalid request: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 400 },
    )
  }
}
