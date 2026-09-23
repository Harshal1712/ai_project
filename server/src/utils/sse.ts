import { Response } from 'express';

export interface SseChannel {
  send: (event: string, data: unknown) => void;
  close: () => void;
  // Aborted when the client disconnects, so in-flight LLM work can be cancelled.
  signal: AbortSignal;
}

const HEARTBEAT_MS = 15_000;

// Server-Sent Events over a regular POST response. Validation should happen
// BEFORE calling this, so ordinary JSON errors (400/403/404) still reach the
// client; once the stream is open, failures are reported as an `error` event.
export function openSse(res: Response): SseChannel {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // stop nginx-style proxies from buffering the stream
  res.flushHeaders();

  const controller = new AbortController();
  // Comment lines keep idle proxies/load balancers from closing the connection
  // during slow steps such as retrieval or a rate-limit wait.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);

  res.on('close', () => {
    clearInterval(heartbeat);
    if (!res.writableEnded) controller.abort();
  });

  return {
    send(event, data) {
      if (res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      clearInterval(heartbeat);
      if (!res.writableEnded) res.end();
    },
    signal: controller.signal,
  };
}
