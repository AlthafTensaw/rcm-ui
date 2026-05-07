/**
 * Inline replacement for `@storybook/addon-actions`.
 *
 * Storybook 8's preferred pattern is to use `args: { onClick: fn() }` from
 * `@storybook/test`, but a number of stories still use the legacy `action()`
 * import. To keep the storybook package dependency surface tight (the
 * addon-actions package isn't a direct dep), we inline a minimal compatible
 * shim here.
 *
 * The signature mirrors the real addon: `action(name)(...args)` logs the
 * call. In the rendered Storybook the call shows in the browser console
 * rather than the Actions panel; that's an acceptable trade given how
 * rarely this is exercised.
 */
export function action(
  name: string,
): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    console.log(`[action] ${name}`, ...args);
  };
}
