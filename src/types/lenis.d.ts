declare module "lenis" {
  export default class Lenis {
    constructor(opts?: {
      duration?: number;
      easing?: (t: number) => number;
      smoothWheel?: boolean;
      smoothTouch?: boolean;
      wheelMultiplier?: number;
      touchMultiplier?: number;
      gestureDirection?: "vertical" | "horizontal";
    });
    raf(time: number): void;
    on(event: "scroll", cb: () => void): void;
    off(event: "scroll", cb: () => void): void;
    destroy(): void;
    stop(): void;
    start(): void;
    scrollTo(target: number | string | HTMLElement, opts?: any): void;
  }
}