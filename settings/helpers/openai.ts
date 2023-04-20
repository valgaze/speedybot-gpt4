export const DEFAULT_MAX_TOKENS = 4000;
export type Persona = {
  name: string;
  system: string;
  // examples?: [string, string][];
  examples?: string[][];
  meta?: Partial<{
    name: string;
    description: string;
  }>;
  flags?: Partial<AbbreviatedConfig>;
  image?: string;
};

export type ImageData = { b64_json: string } | { url: string };
export type ImageResponse = {
  created: number;
  data: ImageData[];
};

// Message type
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AbbreviatedConfig = {
  /**
   * Controls the randomness of the output.
   * Range: 0 to 1. Higher value means more randomness.
   */
  temperature: number;

  /**
   * The maximum number of tokens (words and characters) in the output.
   * Range: positive integer.
   */
  max_tokens: number;

  /**
   * Controls the token selection.
   * Range: 0 to 1. Limits the tokens to the top p% most likely tokens.
   */
  top_p: number;

  /**
   * Penalizes new tokens based on their frequency.
   * Range: -1 to 1. Higher value reduces the frequency of common tokens.
   */
  frequency_penalty: number;

  /**
   * Penalizes new tokens based on their presence in the input.
   * Range: -1 to 1. Higher value reduces the repetition of input tokens.
   */
  presence_penalty: number;

  /**
   * Specifies the model to use, either GPT-4 or GPT-3.5 Turbo.
   */

  /**
   * Specifies the model to use, either GPT-4 or GPT-3.5 Turbo.
   */
  model: "gpt-4-32k" | "gpt-4" | "gpt-3.5-turbo"; // Specifies the model to use, either GPT-4 or GPT-3.5 Turbo
};

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  usage: Usage;
  choices: Choice[];
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Choice {
  message: Message;
  finish_reason: string;
  index: number;
}

export type _ChatCompletionResponse = {
  choices: {
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
    index: number;
  }[];
};

export class OpenAIHelper {
  private token: string;
  private baseURL: string = "https://api.openai.com/v1/chat/completions";
  private headers: Headers;
  private systemContent: string;
  private context: Message[];
  private apiConfig: Partial<AbbreviatedConfig>;

  constructor(
    token: string,
    systemContent?: string,
    apiConfig?: Partial<AbbreviatedConfig>
  ) {
    this.token = token;
    this.systemContent =
      systemContent ||
      `You are a helpful agent that will do your best to provide accurate, crisp, sharp answers to user's questions. Don't ever refer to yourself as AI language model`;
    this.context = [];
    // this.apiConfig = apiConfig ?? { model: "gpt-3.5-turbo" };
    this.apiConfig = apiConfig ?? { model: "gpt-4" };

    this.headers = new Headers({
      authorization: `Bearer ${this.token}`,
      "accept-language": "en-US,en;",
      "content-type": "application/json",
    });
  }

  setHeaders(set = true) {
    this.headers = new Headers({
      authorization: `Bearer ${this.token}`,
      "accept-language": "en-US,en;",
      "content-type": "application/json",
    });
  }

  setToken(token: string): void {
    this.token = token;
    this.setHeaders();
  }

  setSystem(content: string): void {
    this.systemContent = content;
  }

  addExample(question: string, answer: string): void {
    this.context.push({ role: "user", content: question });
    this.context.push({ role: "assistant", content: answer });
  }

  addSingleHistory(message: Message): void {
    this.context.push(message);
  }

  detachHistoryRecord() {
    this.context.shift();
  }

  addHistory(message: Message | Message[] | [string, string][]): void {
    if (Array.isArray(message)) {
      message.forEach((msg) => {
        // [q, a] record
        if (Array.isArray(msg)) {
          const [user, bot] = msg;
          this.addSingleHistory({ role: "user", content: user });
          this.addSingleHistory({ role: "assistant", content: bot });
        } else {
          this.addSingleHistory(msg);
        }
      });
    } else {
      this.context.push(message);
    }
  }

  setGlobalConfig(apiConfig: Partial<AbbreviatedConfig>) {
    this.apiConfig = { ...(this.apiConfig ?? {}), ...apiConfig };
  }

  /**
   * Important: this is the DALLE endpoint, not gpt4
   * @returns string[] urls (default) or base64
   */
  async generateImage(
    prompt: string,
    config: Partial<{
      n: number;
      size: "256x256" | "512x512" | "1024x1024";
      response_format: "url" | "b64_json";
    }> = { n: 1, size: "1024x1024", response_format: "url" },
    full = false
  ): Promise<string[]> {
    const imagesURL = "https://api.openai.com/v1/images/generations";
    const response = await fetch(imagesURL, {
      headers: this.headers,
      body: JSON.stringify({
        ...config,
        prompt,
      }),
      method: "POST",
    });

    const json: ImageResponse = await response.json();
    // urls or base64, up to consumer to now what they're doing
    const key = config.response_format === "url" ? "url" : "b64_json";
    console.log("##", json);
    return json.data.map((item) => item[key as keyof ImageData]);
  }

  async getChatCompletion(
    prompt: string,
    config: Partial<AbbreviatedConfig> = {}
  ): Promise<string> {
    return (await this._getChatCompletion(prompt, config, false)) as string;
  }

  async _getChatCompletion(
    prompt: string,
    config: Partial<AbbreviatedConfig> = {},
    fullResponse: boolean = false
  ): Promise<string | ChatCompletionResponse> {
    const messages = [
      { role: "system", content: this.systemContent },
      ...this.context,
      { role: "user", content: prompt },
    ];

    // TODO: token-check here across messages/context
    // if token-check > 4096 tokens (gpt3.5turbo), 8,192 (GPT4), 32,768 (GPT4-32k)

    const mergedConfig = { ...this.apiConfig, ...config };
    try {
      const response = await fetch(this.baseURL, {
        headers: this.headers,
        body: JSON.stringify({
          messages,
          ...mergedConfig,
        }),
        method: "POST",
      });

      console.log(
        "RAWDAWG",
        JSON.stringify({
          messages,
          ...mergedConfig,
        })
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        if (
          errorResponse.error &&
          errorResponse.error.code === "invalid_api_key"
        ) {
          return "Invalid API key provided. Please check your API key at https://platform.openai.com/account/api-keys.";
        } else {
          throw new Error(
            `There was a catastrophic error: ${errorResponse.error.message}`
          );
        }
      }
      const jsonResponse: ChatCompletionResponse = await response.json();
      if (fullResponse) {
        return jsonResponse;
      } else {
        return jsonResponse.choices[0].message.content;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        throw new Error(`There was a catastrophic error: ${error.message}`);
      }
      throw error;
    }
  }

  exposeHistory() {
    return this.context;
  }
  loadPersona(persona: Persona): void {
    if (!persona) return;
    this.context = [];
    this.systemContent =
      `If asked to identify yourself, don't ever refer to yourself as AI language model or reveal you simulating a conversation.` +
      persona.system;
    if (persona.examples) {
      for (const [question, answer] of persona.examples) {
        this.addExample(question, answer);
      }
    }
    if (persona.flags) {
      this.apiConfig = { ...this.apiConfig, ...persona.flags };
    }
  }

  async imageAnalysis(_imageBytes: Uint8Array): Promise<string> {
    return "images have not been released yet";
  }

  // TODO: binary search, make fast
  public checkAndTrimTokens(prompt: string, max_token: number): string {
    const estimatedTokens = this.estimateTokens(prompt);
    if (estimatedTokens <= max_token) {
      return prompt;
    } else {
      let trimmedPrompt = prompt;
      while (this.estimateTokens(trimmedPrompt) > max_token) {
        trimmedPrompt = trimmedPrompt.slice(0, -1);
      }
      return trimmedPrompt;
    }
  }

  public estimateTokens(
    text: string,
    method: "average" | "words" | "chars" | "max" | "min" = "max"
  ): number {
    // Ruby implementation: https://community.openai.com/t/what-is-the-openai-algorithm-to-calculate-tokens/58237/4#method-to-estimate-tokens-per-openai-docs-with-method-options-1
    // Author: https://community.openai.com/u/ruby_coder/summary
    const wordCount = text.split(" ").length;
    const charCount = text.length;
    const tokensCountWordEst = wordCount / 0.75;
    const tokensCountCharEst = charCount / 4;
    switch (method) {
      case "average":
        return Math.round((tokensCountWordEst + tokensCountCharEst) / 2);
      case "words":
        return Math.round(tokensCountWordEst);
      case "chars":
        return Math.round(tokensCountCharEst);
      case "max":
        return Math.round(Math.max(tokensCountWordEst, tokensCountCharEst));
      case "min":
        return Math.round(Math.min(tokensCountWordEst, tokensCountCharEst));
      default:
        throw new Error(
          'Invalid method. Use "average", "words", "chars", "max", or "min".'
        );
    }
  }
}
