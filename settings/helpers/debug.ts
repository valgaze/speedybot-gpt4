import { red, yellow, blue, magenta, reset } from "colorette";

export interface DebugConfig {
  enabled?: boolean;
}

/**
 * 
 * 
```ts
const debug = new Debug({ enabled: true });

debug.info("Info message", { key: "value" }, [1, 2, 3]);
debug.warning("Warning message", { key: "value" }, [1, 2, 3]);
debug.danger("Danger message", { key: "value" }, [1, 2, 3]);
debug.debug("Debug message", { key: "value" }, [1, 2, 3]);

debug.setEnabled(false);
debug.info("This message will not be logged");
```
 * 
 * 
 */
export class Debug {
  private enabled: boolean;

  constructor(config?: DebugConfig) {
    this.enabled = config?.enabled ?? true;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private log(colorFn: (s: string) => string, ...args: unknown[]): void {
    if (this.enabled) {
      console.log(
        colorFn(`[${new Date().toISOString()}]`),
        ...args.map((arg) => reset(String(arg)))
      );
    }
  }

  info(...args: unknown[]): void {
    this.log(blue, "[INFO]", ...args);
  }

  warning(...args: unknown[]): void {
    this.log(yellow, "⚠️[WARNING]⚠️", ...args);
  }

  danger(...args: unknown[]): void {
    this.log(red, "🚨[RUH-ROH]👹", ...args);
  }

  debug(...args: unknown[]): void {
    this.log(magenta, "\n\n####\n", ...args, "\n");
  }
}
