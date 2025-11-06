/**
 * Prevent layout shift when dropdowns open by locking viewport width
 * This is necessary because some mobile browsers add/remove scrollbar causing layout shift
 */

let originalWidth: string | null = null;
let originalBodyWidth: string | null = null;
let originalOverflowX: string | null = null;
let scrollPosition = 0;

export function lockViewportWidth() {
  if (typeof window === 'undefined') return;
  
  // Store original values if not already stored
  if (!originalWidth) {
    originalWidth = document.documentElement.style.width;
    originalBodyWidth = document.body.style.width;
    originalOverflowX = document.documentElement.style.overflowX;
    scrollPosition = window.scrollY;
  }
  
  // Get current viewport width (account for scrollbar)
  const currentWidth = document.documentElement.clientWidth;
  
  // Lock the width on both html and body
  document.documentElement.style.width = `${currentWidth}px`;
  document.documentElement.style.overflowX = 'hidden';
  document.documentElement.style.overflowY = 'scroll';
  
  document.body.style.width = `${currentWidth}px`;
  document.body.style.overflowX = 'hidden';
  document.body.style.position = 'relative';
  
  // Prevent scroll jump
  window.scrollTo(0, scrollPosition);
}

export function unlockViewportWidth() {
  if (typeof window === 'undefined') return;
  
  // Restore original values
  document.documentElement.style.width = originalWidth || '';
  document.documentElement.style.overflowX = originalOverflowX || '';
  document.documentElement.style.overflowY = '';
  
  document.body.style.width = originalBodyWidth || '';
  document.body.style.overflowX = '';
  document.body.style.position = '';
  
  // Restore scroll position
  window.scrollTo(0, scrollPosition);
  
  // Reset stored values
  originalWidth = null;
  originalBodyWidth = null;
  originalOverflowX = null;
  scrollPosition = 0;
}
