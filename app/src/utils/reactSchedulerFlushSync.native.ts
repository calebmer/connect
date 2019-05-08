export function reactSchedulerFlushSync(action: () => void) {
  action();
}
