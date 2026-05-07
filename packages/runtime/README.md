# @tensaw/runtime

Platform runtime: Redux store, middleware, event bus, hooks, authenticated API client.

Implements **Phase 1 (Runtime Gap Closure)** and **Phase 2 (Runtime Completion)** of the v3 plan.

## Scope

- Redux Toolkit store with all platform slices
- RTK Query base configuration with JWT injection
- Event bus middleware with full catalog wiring
- Preference persistence with debounce
- Dirty state guard
- Polling middleware
- Notification/toast slice
- Idle timeout middleware (HIPAA)
- PHI scrubber utility (HIPAA)
- App bootstrap thunk

## Status

Phase 1 implementation in progress.

## Adding a new store

Stores follow a strict shape. See `packages/runtime/src/stores/authStore.ts`
as the canonical example. Pattern:

1. Define an `INITIAL` state object as a `const`.
2. Define a `Store` type that extends the state with method signatures.
3. Call `create<Store>()((set, get) => ({ ...INITIAL, ...methods }))`.
4. Export `useXStore` and `_resetXStore`.
5. Wire `_resetXStore` into the central `resetAllStoresForTesting()`.

### `setState` reset gotcha

Reset functions **must** use merge mode:

```typescript
export function _resetAuthStore(): void {
  useAuthStore.setState({ ...INITIAL });    // ✅ merge — keeps methods
}
```

NOT replace mode:

```typescript
export function _resetAuthStore(): void {
  useAuthStore.setState({ ...INITIAL }, true);   // ❌ replace — wipes methods
}
```

Zustand's `setState(partial, replace)` second argument, when `true`,
replaces the entire state object including the action methods. Tests
that call `_resetAuthStore()` followed by `useAuthStore.getState().signIn(...)`
will fail with `signIn is not a function`. Documented here so it doesn't
bite again.

### Subscribe-with-selector

If your store needs subscription from outside React, wrap with `subscribeWithSelector`:

```typescript
import { subscribeWithSelector } from 'zustand/middleware';

export const useMyStore = create<MyStore>()(
  subscribeWithSelector((set) => ({ ...INITIAL, ...methods })),
);
```
