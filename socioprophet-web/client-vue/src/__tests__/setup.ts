/**
 * Vitest global setup for the /map smoke-test suite.
 *
 * Stubs maplibre-gl so tests run in happy-dom without WebGL.
 */
import { vi } from 'vitest';

class MapStub {
  addControl() {}
  easeTo() {}
  remove() {}
}

class MarkerStub {
  setLngLat() { return this; }
  setPopup() { return this; }
  addTo() { return this; }
  remove() {}
}

class PopupStub {
  setText() { return this; }
}

class NavigationControlStub {}

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MapStub,
    Marker: MarkerStub,
    Popup: PopupStub,
    NavigationControl: NavigationControlStub,
  },
  Map: MapStub,
  Marker: MarkerStub,
  Popup: PopupStub,
  NavigationControl: NavigationControlStub,
}));
