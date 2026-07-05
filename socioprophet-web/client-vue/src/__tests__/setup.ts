/**
 * Vitest global setup for the /map smoke-test suite.
 *
 * Stubs maplibre-gl so tests run in happy-dom without WebGL.
 */
import { vi } from 'vitest';

class MapStub {
  addControl() {}
  easeTo() {}
  flyTo() {}
  fitBounds() {}
  on() {}
  getSource(): undefined { return undefined; }
  addSource() {}
  addLayer() {}
  getZoom() { return 1; }
  remove() {}
}

class MarkerStub {
  setLngLat() { return this; }
  setPopup() { return this; }
  addTo() { return this; }
  getElement() { return document.createElement('div'); }
  remove() {}
}

class PopupStub {
  setText() { return this; }
}

class NavigationControlStub {}

class LngLatBoundsStub {
  extend() { return this; }
  isEmpty() { return true; }
}

vi.mock('maplibre-gl', () => ({
  default: {
    Map: MapStub,
    Marker: MarkerStub,
    Popup: PopupStub,
    NavigationControl: NavigationControlStub,
    LngLatBounds: LngLatBoundsStub,
  },
  Map: MapStub,
  Marker: MarkerStub,
  Popup: PopupStub,
  NavigationControl: NavigationControlStub,
  LngLatBounds: LngLatBoundsStub,
}));
