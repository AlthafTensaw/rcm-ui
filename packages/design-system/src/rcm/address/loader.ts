/**
 * Lazy Google Maps loader.
 *
 * Loads the Maps JS API only when an AddressField is first focused. The script
 * is added to <head> exactly once; subsequent calls return the same Promise.
 *
 * Why not use @googlemaps/js-api-loader? The official loader is fine but
 * adds a dependency for ~60 lines of work. This implementation is small enough
 * to keep in-tree and easy to audit for HIPAA review.
 *
 * If the API key is missing or the script fails to load, the returned Promise
 * rejects. The AddressField catches the rejection and falls back to manual
 * entry.
 */

interface PlacesLibrary {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteService: new () => {
    getPlacePredictions(
      request: {
        input: string;
        sessionToken?: unknown;
        componentRestrictions?: { country: string | string[] };
        types?: string[];
      },
      callback: (predictions: PlacePrediction[] | null, status: string) => void,
    ): void;
  };
  PlacesService: new (attributionsContainer: HTMLElement) => {
    getDetails(
      request: { placeId: string; fields: string[]; sessionToken?: unknown },
      callback: (result: unknown, status: string) => void,
    ): void;
  };
  PlacesServiceStatus: { OK: string };
}

export interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoogleMapsRoot {
  maps: {
    places: PlacesLibrary;
  };
}

declare global {
  interface Window {
    google?: GoogleMapsRoot;
    /** Internal callback name used by the loader. Multi-instance safe. */
    __tensaw_gmaps_cb__?: () => void;
  }
}

let loadPromise: Promise<PlacesLibrary> | null = null;

/**
 * Load the Google Maps JavaScript API + Places library.
 *
 * Subsequent calls return the same Promise — the script is loaded exactly once
 * regardless of how many AddressFields exist on the page.
 */
export function loadPlacesLibrary(apiKey: string | null): Promise<PlacesLibrary> {
  if (loadPromise) return loadPromise;

  if (!apiKey) {
    loadPromise = Promise.reject(
      new Error(
        'Google Maps API key not configured. Set VITE_GOOGLE_MAPS_API_KEY or AddressField will fall back to manual entry.',
      ),
    );
    // Reset so a subsequent attempt with a key can retry.
    void loadPromise.catch(() => {
      loadPromise = null;
    });
    return loadPromise;
  }

  loadPromise = new Promise<PlacesLibrary>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('loadPlacesLibrary called outside a browser environment'));
      return;
    }

    // Already loaded by a previous call or by another bundle on the page?
    if (window.google?.maps.places) {
      resolve(window.google.maps.places);
      return;
    }

    const callbackName = '__tensaw_gmaps_cb__';
    window[callbackName] = () => {
      if (window.google?.maps.places) {
        resolve(window.google.maps.places);
      } else {
        reject(new Error('Google Maps loaded but Places library is missing'));
      }
      Reflect.deleteProperty(window, callbackName);
    };

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      libraries: 'places',
      v: 'weekly',
      callback: callbackName,
      loading: 'async',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      Reflect.deleteProperty(window, callbackName);
      reject(new Error('Failed to load Google Maps script (network error)'));
    };

    document.head.appendChild(script);
  });

  // Reset on failure so the user can retry (e.g. after fixing network).
  void loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

/**
 * Test helper — clears the cached Promise. Use only in tests.
 */
export function _resetPlacesLoader(): void {
  loadPromise = null;
  if (typeof window !== 'undefined') {
    delete window.__tensaw_gmaps_cb__;
  }
}
