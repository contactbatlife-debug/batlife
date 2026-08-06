// ============================================================
// BatLife — useSwipe.js
// Hook de détection de swipe horizontal pour navigation
// ============================================================
import { useRef, useCallback } from "react";

const SWIPE_MIN_DISTANCE = 60;  // px minimum pour valider un swipe
const SWIPE_MAX_VERTICAL = 80;  // px max vertical (évite les scroll)
const SWIPE_MAX_DURATION = 500; // ms max pour un swipe rapide

export default function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchStart = useRef(null);

  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.t;

    touchStart.current = null;

    // Ignore si trop lent, trop vertical, ou trop court
    if (dt > SWIPE_MAX_DURATION) return;
    if (Math.abs(dy) > SWIPE_MAX_VERTICAL) return;
    if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return;

    if (dx < 0) onSwipeLeft?.();   // ← swipe gauche = page suivante
    else         onSwipeRight?.();  // → swipe droite = page précédente
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}
