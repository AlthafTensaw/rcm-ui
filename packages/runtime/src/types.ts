/**
 * Shared platform state types.
 *
 * Each slice's state shape is defined here (not in the slice file) so that
 * cross-slice selectors and middleware can depend on these types without
 * creating circular module dependencies.
 *
 * The slice files import from here. The store's RootState is derived from the
 * root reducer.
 */

// -- Auth ---------------------------------------------------------------------

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  /**
   * Clinic IDs this user has access to. Empty for tenant-wide users
   * (TENSAW_ADMIN, TENANT_ADMIN, RCM_OPS_*) — those users see all
   * clinics in the tenant. Populated for clinic-scoped users
   * (CLINIC_ADMIN, CLINIC_USER) from Cognito groups starting with `clinic-`.
   *
   * Per backend ADR-OC-2 of the operations console backend tech spec.
   */
  clinicIds: string[];
}

export interface AuthState {
  status: 'unknown' | 'signed-out' | 'signed-in' | 'session-expired';
  user: AuthUser | null;
  /** Currently active clinic id. Multi-clinic users can switch. */
  clinicId: string | number | null;
  /** Timestamp of last successful auth activity. Used by idle timeout. */
  lastActivityAt: string | null;
}

// -- App ---------------------------------------------------------------------

export interface AppState {
  appId: string | null;
  moduleId: string | null;
  pageId: string | null;
  /** True after bootstrapApp() resolves. */
  initialized: boolean;
  /** Set on a fatal error that prevents the app from running. */
  globalFatalError: { code: string; message: string } | null;
}

// -- Context (selected entity ids per page) ----------------------------------

export interface ContextState {
  patientId: string | null;
  accountId: string | null;
  encounterId: string | null;
  claimId: string | null;
  appointmentId: string | null;
  remitId: string | null;
}

// -- UI (session-only panel/container state) ---------------------------------

export interface PanelWidthState {
  leftPanelWidth: number | null;
  rightPanelWidth: number | null;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
}

export interface ContainerUiState {
  expanded: boolean;
  activeTabId: string | null;
}

/**
 * Per-grid persisted ui state. Used for column-visibility, sort, and other
 * per-grid preferences that survive across sessions.
 */
export interface GridUiState {
  /** Column id → visible. Missing entries default to schema's defaultHidden flag. */
  columnVisibility: Record<string, boolean>;
  /** Sort column id and direction. Null when no sort applied. */
  sort: { columnId: string; direction: 'asc' | 'desc' } | null;
  /** Page size. Page index is NOT persisted — always returns to 0 on reload. */
  pageSize: number | null;
}

export interface UiState {
  /** Per-page panel widths. Key = pageId. */
  panelsByPage: Record<string, PanelWidthState>;
  /** Per-container ui. Key = `${pageId}:${containerId}`. */
  containersByKey: Record<string, ContainerUiState>;
  /** Per-grid ui. Key = `${pageId}:${gridId}`. */
  gridsByKey: Record<string, GridUiState>;
}

// -- Preferences (persisted) -------------------------------------------------

export interface PreferencesState {
  /** Density: 'comfortable' | 'compact'. Persisted. */
  density: 'comfortable' | 'compact';
  /** Persisted panel widths per page. Mirror of UiState.panelsByPage on save. */
  panelsByPage: Record<string, PanelWidthState>;
  /** Persisted container state. Mirror of UiState.containersByKey on save. */
  containersByKey: Record<string, ContainerUiState>;
  /** Persisted per-grid state. Mirror of UiState.gridsByKey on save. */
  gridsByKey: Record<string, GridUiState>;
  /** Saved view ids per page+domain. */
  savedViewByPage: Record<string, string>;
  loadStatus: 'idle' | 'loading' | 'loaded' | 'error';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;
  lastError: string | null;
}

// -- Events (recent ring buffer for debugging) -------------------------------

export interface RecordedEvent {
  eventName: string;
  category: string;
  correlationId: string;
  occurredAt: string;
}

export interface EventsState {
  recent: RecordedEvent[];
}

// -- Page runtime ------------------------------------------------------------

export interface PageRuntimeState {
  pageId: string | null;
  pageVersion: string | null;
  layoutArchetypeId: string | null;
  status: 'mounting' | 'loading-prefs' | 'ready' | 'fatal-error' | 'unmounting';
  visibleZones: string[];
  registeredContainerIds: string[];
  fatalError: { code: string; message: string } | null;
}

// -- Widgets -----------------------------------------------------------------

export type WidgetLifecycle = 'mounting' | 'loading' | 'ready' | 'error' | 'disposed';

export interface WidgetRuntimeState {
  instanceId: string;
  widgetId: string;
  containerId: string;
  pageId: string;
  lifecycle: WidgetLifecycle;
  errorCode: string | null;
  errorMessage: string | null;
  mountedAt: string;
  lastDataLoadedAt: string | null;
}

export interface WidgetsState {
  byInstanceId: Record<string, WidgetRuntimeState>;
}

// -- Surfaces (modals, drawers, popups) --------------------------------------

export type SurfaceKind = 'modal' | 'drawer' | 'popup' | 'fax' | 'email' | 'assistant';

export interface SurfaceInstance {
  surfaceId: string;
  kind: SurfaceKind;
  componentId: string;
  props: Record<string, unknown>;
  ownerWidgetInstanceId: string | null;
  openedAt: string;
}

export interface SurfacesState {
  /** Stack order: last entry is the top-most surface. */
  stack: SurfaceInstance[];
}

// -- Dirty state -------------------------------------------------------------

export interface DirtyEntry {
  instanceId: string;
  widgetId: string;
  pageId: string;
  markedAt: string;
}

export interface DirtyStateState {
  dirtyByInstanceId: Record<string, DirtyEntry>;
  /**
   * If non-null, a context-changing event was blocked by a dirty widget and is
   * waiting on user confirmation. The DirtyStateGuard surface resolves it.
   */
  pendingTransition: {
    eventName: string;
    payload: unknown;
    correlationId: string;
  } | null;
}

// -- Notifications / toasts (Phase 2) ----------------------------------------

export type ToastSeverity = 'info' | 'success' | 'warning' | 'error';

export interface ToastInstance {
  toastId: string;
  severity: ToastSeverity;
  title: string;
  body: string | null;
  /** ms until auto-dismiss. null = sticky. */
  durationMs: number | null;
  createdAt: string;
}

export interface NotificationsState {
  toasts: ToastInstance[];
}

// -- Polling (Phase 2) -------------------------------------------------------

export interface PollingJob {
  id: string;
  intervalMs: number;
  /** Action type to dispatch on each tick. */
  actionType: string;
  /** Optional payload for the dispatched action. */
  actionPayload?: unknown;
  registeredAt: string;
}

export interface PollingState {
  jobs: Record<string, PollingJob>;
}
