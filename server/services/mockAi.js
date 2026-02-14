
export const myMockModel = {
  specificationVersion: 'v1',
  provider: 'cookwire-mock',
  modelId: 'mock-1',
  defaultObjectGenerationMode: 'json',
  doStream: async () => {
    return {
      stream: new ReadableStream({
        async start(controller) {
          const text = "This is a simulated response from CookWire AI. Real AI integration requires an API Key."
          for (let i = 0; i < text.length; i++) {
            controller.enqueue({ type: 'text-delta', textDelta: text[i] })
            await new Promise(r => setTimeout(r, 30))
          }
          controller.enqueue({ type: 'finish', finishReason: 'stop' })
          controller.close()
        }
      })
    }
  }
}
