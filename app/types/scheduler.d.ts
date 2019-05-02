import "scheduler";

declare module "scheduler" {
  export function unstable_scheduleCallback(
    priorityLevel: number,
    callback: FrameCallbackType,
  ): CallbackNode;
}
