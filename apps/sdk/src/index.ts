interface StreamKitConfig {
  apiKey: string;
  endpoint?: string;
}

interface StreamKitEvent {
  id?: string;
  event: string;
  payload: unknown;
  timestamp?: string;
}

type EventCallback = (event: StreamKitEvent) => void;

const DEFAULT_ENDPOINT = "http://localhost:3000";
const MAX_RECONNECT_DELAY = 30000;

export class StreamKit {
  private readonly apiKey: string;
  private readonly endpoint: string;

  private constructor(config: StreamKitConfig) {
    this.apiKey = config.apiKey;
    this.endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, "");
  }

  static init(config: StreamKitConfig): StreamKit {
    if (!config.apiKey) {
      throw new Error("StreamKit: apiKey is required");
    }
    return new StreamKit(config);
  }

  subscribe(channelId: string, callback: EventCallback): () => void {
    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    let disposed = false;

    const connect = (): void => {
      if (disposed) return;

      const url = `${this.endpoint}/api/v1/stream/${channelId}`;
      eventSource = new EventSource(url, {
        // @ts-expect-error - headers not in standard spec but supported by polyfills
        headers: { "X-StreamKit-Key": this.apiKey },
      });

      eventSource.onmessage = (e: MessageEvent): void => {
        try {
          const data = JSON.parse(e.data as string) as StreamKitEvent & { type?: string };
          if (data.type === "heartbeat") return;
          reconnectAttempts = 0;
          callback(data);
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = (): void => {
        if (disposed) return;
        eventSource?.close();
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts),
          MAX_RECONNECT_DELAY
        );
        reconnectAttempts++;
        setTimeout(connect, delay);
      };

      eventSource.onopen = (): void => {
        reconnectAttempts = 0;
      };
    };

    connect();

    return (): void => {
      disposed = true;
      eventSource?.close();
    };
  }

  async publish(
    channelId: string,
    event: string,
    payload: unknown
  ): Promise<void> {
    const response = await fetch(`${this.endpoint}/api/v1/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-StreamKit-Key": this.apiKey,
      },
      body: JSON.stringify({ channelId, event, payload }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(
        `StreamKit publish failed: ${body.message ?? response.statusText}`
      );
    }
  }
}

export default StreamKit;
