import gsap from 'gsap';

// =============================================================================
// MODAL SYSTEM STATE AND CONFIGURATION
// =============================================================================

// Global modal state
export let ModalOpen = false;

// Home button reference
let homeButton = null;

// Dark mode button reference and state
let darkModeButton = null;
let isDarkMode = true; // Start in dark mode

// Modal navigation state for work modals
let currentWork = 1;
let totalWorks = 5;

// Work configuration (title, descriptions, credits, media)
const workConfig = [
  {
    id: 1,
    title: 'N26\nbanking you way',
    descriptions: [
      'N26 is a digital bank that offers a seamless banking experience. It\'s a bank that you can use to manage your money, pay your bills, and invest your money.',
      'N26 is a digital bank that offers a seamless banking experience. It\'s a bank that you can use to manage your money, pay your bills, and invest your money.'
    ],
    credits: [
      'Copywriter: Natia Kalandia',
      'Art Director: Anya Zainieva',
      'Creative Director: luca pristerbach, passcal momper',
      'Agency: Potvis'
    ],
    media: [
      '/works/Work1_P1.png','/works/Work1_P2.png','/works/Work1_P3.png','/works/Work1_P4.png','/works/Work1_P5.png','/works/Work1_P6.png'
    ]
  },
  {
    id: 2,
    title: 'PLASTIC FISCHER',
    descriptions: [
      'This campaign tells the story of an environmental hero pushed to his breaking point. Through a staged viral video, the CEO of Plastic Fischer appears to sabotage his own mission, fed up with public apathy.',
      'This provocative narrative is designed to shatter indifference and drive donations by asking one simple question: what will it take to finally clean the rivers?'
    ],
    credits: [
      'Copywriter: Natia Kalandia',
      'Art Director: Anya Zainieva',
      'Creative Director: luca pristerbach, passcal momper',
      'Agency: Potvis'
    ],
    media: ['/works/Work2_P1.png','/works/Work2_P2.png']
  },
  {
    id: 3,
    title: 'NORSE PROJECT',
    descriptions: [
      'Through shifting seasons and changing skies. From a breezy spring walk to a sudden autumn downpour or the first snow of winter, a Norse Projects hat is your constant companion. Designed for life\'s moments, no matter the weather.'
    ],
    credits: [
      'Copywriter: Natia Kalandia',
      'Art Director: Anya Zainieva',
      'Creative Director: luca pristerbach, passcal momper',
      'Agency: Potvis'
    ],
    media: ['/works/Work3_P1.png','/works/Work3_P2.png','/works/Work3_P3.png','/works/Work3_P4.png','/works/Work3_P5.png','/works/Work3_P6.png']
  },
  {
    id: 4,
    title: 'DR. Martens\nIt\'s just gonna hurt a little',
    descriptions: [
      'Dr. Martens 1460 is one of the iconic shoes there is. It comes with instant recognition and style approval as well. That’s why it’s worn equally successfully by almost every demographic representative. You either own one or want to own one. But what I’m gonna say next is gonna hurt a little.'
    ],
    credits: [
      'Copywriter: Natia Kalandia'
    ],
    media: ['/works/Work4_P1.png','/works/Work4_P2.png']
  },
  {
    id: 5,
    title: 'IKEA\nBeyond trends',
    descriptions: [
      'Great design transcends trends. To prove the enduring versatility of IKEA\'s most beloved products, our "Beyond Trends" project used Midjourney to filter them through history\'s greatest art styles. This visual experiment confirms that IKEA\'s design doesn\'t just cater to one aesthetic—it can embody them all.'
    ],
    credits: [
      'Copywriter: Natia Kalandia'
    ],
    media: ['/works/Work5_P2.png','/works/Work5_P3.png','/works/Work5_P4.png']
  }
];
totalWorks = workConfig.length;

// Create work modal from template
function createWorkModal(workId) {
  const config = workConfig.find(w => w.id === workId);
  if (!config) return null;
  const tpl = document.getElementById('work-modal-template');
  if (!tpl) return null;
  const node = tpl.content.firstElementChild.cloneNode(true);

  node.classList.add('work' + workId);
  node.setAttribute('id', 'work' + workId);
  node.setAttribute('aria-labelledby', 'work' + workId + '-title');

  const title = node.querySelector('.project-title');
  if (title) {
    title.id = 'work' + workId + '-title';
    title.innerHTML = config.title.replace(/\n/g, '<br>');
  }

  const descGroup = node.querySelector('.project-description-group');
  if (descGroup) {
    descGroup.innerHTML = '';
    config.descriptions.forEach(text => {
      const p = document.createElement('p');
      p.className = 'project-description';
      p.textContent = text;
      descGroup.appendChild(p);
    });
  }

  const credits = node.querySelector('.credits');
  if (credits) {
    credits.innerHTML = '';
    config.credits.forEach(text => {
      const div = document.createElement('div');
      div.className = 'credit-item';
      div.textContent = text;
      credits.appendChild(div);
    });
  }

  const grid = node.querySelector('.media-grid');
  if (grid) {
    grid.innerHTML = '';
    config.media.forEach(src => {
      const item = document.createElement('div');
      item.className = 'media-item';
      const img = document.createElement('img');
      img.src = src;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = '';
      item.appendChild(img);
      grid.appendChild(item);
    });
  }

  // Wire up buttons inside the new modal
  const closeBtn = node.querySelector('.modal-exit-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
  }
  node.querySelectorAll('.nav-arrow').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const direction = button.textContent.trim() === '←' ? 'prev' : 'next';
      navigateWork(direction);
    });
  });

  document.body.appendChild(node);
  return node;
}

// Modal DOM references - populated during initialization
let Modals = {};

// =============================================================================
// FLOATING ANIMATION SYSTEM (for About modal)
// =============================================================================

// Mouse position tracking for parallax effects
let mouseX = 0;
let mouseY = 0;
let aboutModal = null;
let animationId = null;
let startTime = Date.now();

/**
 * Mouse movement handler for parallax effects
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseMove(e) {
  if (!aboutModal || !aboutModal.classList.contains('active')) return;
  
  const rect = aboutModal.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width;
  mouseY = (e.clientY - rect.top) / rect.height;
  
  // No need to call updateFloatingImages here since it's handled by the animation loop
}

/**
 * Update floating images with both mouse movement and floating animation
 */
function updateFloatingImages() {
  if (!aboutModal) return;
  
  const floatingImages = aboutModal.querySelectorAll('.floating-image');
  const currentTime = Date.now();
  const elapsed = (currentTime - startTime) / 1000; // Time in seconds
  
  floatingImages.forEach((image, index) => {
    const speed = (parseFloat(image.dataset.speed) || 1) - 0.1;
    
    // Mouse movement parallax
    const moveX = (mouseX - 0.5) * speed * 50; // Max 50px movement
    const moveY = (mouseY - 0.5) * speed * 30; // Max 30px movement
    
    // Floating animation with different phases for each image
    const floatSpeed = 0.5 + index * 0.1; // Different speeds for variety
    const floatAmplitude = 10 + index * 3; // Different amplitudes
    const floatX = Math.sin(elapsed * floatSpeed + index) * (floatAmplitude * 0.5);
    const floatY = Math.cos(elapsed * floatSpeed * 0.7 + index) * floatAmplitude;
    
    // Combine both movements
    const totalX = moveX + floatX;
    const totalY = moveY + floatY;
    
    // Apply transform
    image.style.transform = `translate(${totalX}px, ${totalY}px)`;
  });
}

/**
 * Start the floating animation loop
 */
function startFloatingAnimation() {
  if (!aboutModal) return;
  
  const floatingImages = aboutModal.querySelectorAll('.floating-image');
  console.log('Starting floating animation for', floatingImages.length, 'images');
  
  // Reset start time
  startTime = Date.now();
  
  function animateFrame() {
    if (!aboutModal || !aboutModal.classList.contains('active')) {
      animationId = null;
      return;
    }
    
    updateFloatingImages();
    animationId = requestAnimationFrame(animateFrame);
  }
  
  // Start the animation loop
  animationId = requestAnimationFrame(animateFrame);
}

// =============================================================================
// MODAL STATE MANAGEMENT
// =============================================================================

/**
 * Get current modal open state
 * @returns {boolean} - Whether a modal is currently open
 */
export function isModalOpen() {
  return ModalOpen;
}

/**
 * Set modal open state
 * @param {boolean} state - Modal open state
 */
export function setModalOpen(state) {
  ModalOpen = state;
}

// =============================================================================
// CORE MODAL FUNCTIONS
// =============================================================================

/**
 * Open a modal with animation
 * @param {string} modalClass - CSS class of the modal to open
 */
export const openModal = (modalClass, isNavigating = false) => {
  // Check if any modal is currently open
  const currentActiveModal = document.querySelector('.modal.active');
  const isAnotherModalOpen = currentActiveModal && !currentActiveModal.classList.contains(modalClass);
 
  // Close any open modals first (but don't wait for animation)
  if (isAnotherModalOpen) {
    currentActiveModal.classList.remove('active');
    currentActiveModal.style.display = 'none';
  }

  // Open the requested modal
  let modal = typeof modalClass === 'string' ?
    document.querySelector('.modal.' + modalClass) : modalClass;

  // If work modal not present in DOM yet, create it on-demand
  if (!modal && typeof modalClass === 'string' && /^work[1-9]\d*$/.test(modalClass)) {
    const workId = parseInt(modalClass.replace('work',''), 10);
    modal = createWorkModal(workId);
  }

  if (modal) {
    // Clear any previous GSAP properties and reset modal state
    gsap.killTweensOf(modal);
    // Only clear specific properties instead of all to avoid global interference
    gsap.set(modal, { clearProps: "scale,transform,transformOrigin,opacity" });
    modal.style.opacity = '';
    modal.style.display = 'block';

    ModalOpen = true;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    
    // Hide UI controls when modal opens
    hideUIControls();

    // Update current work index if it's a work modal
    const workMatch = Array.from(modal.classList).find(c => /^work[1-9]\d*$/.test(c));
    if (workMatch) {
      currentWork = parseInt(workMatch.replace('work',''), 10);
    }
    
    // Special handling for about modal
    if (modal.classList.contains('about')) {
      aboutModal = modal;
      console.log('About modal opened, setting up floating effects');
      
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        startFloatingAnimation();
        // Add mouse movement listener with passive option to avoid interference
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        console.log('Floating effects initialized');
      }, 100);
    }

    // Choose animation based on whether another modal was open
    if (isAnotherModalOpen) {
      // Instant switch - no animation
      gsap.set(modal, { 
        opacity: 1,
        scale: 1,
        transformOrigin: "center center"
      });
      console.log(`Modal switched instantly: ${modalClass}`);
    } else {
      // Scale up animation from 0 to fill screen
      gsap.set(modal, { 
        opacity: 1,
        scale: 0,
        transformOrigin: "center center"
      });
      gsap.to(modal, {
        scale: 1,
        duration: (isNavigating) ? 0 : 0.5,
        ease: "back.out(1.7)"
      });
      console.log(`Modal opened with scale animation: ${modalClass}`);
    }

    // Trap focus inside modal
    trapFocus(modal);
    console.log(`Modal opened successfully: ${modalClass}`);
  } else {
    console.error(`Modal not found for class: .modal.${modalClass}`);
  }
}

/**
 * Close the currently active modal with animation
 */
export const closeModal = (navigate = false, direction = 1, onComplete = null) => {
  const activeModal = document.querySelector('.modal.active');
  if (activeModal) {
    console.log('🔄 Closing modal:', activeModal.className);
  
    gsap.to(activeModal, {
      opacity: 0,
      scale: 0,
      duration: (navigate) ? 0 : 0.5,
      ease: "back.in(1.7)",
      onComplete: () => {
        activeModal.classList.remove('active');
        // Clear GSAP properties that might interfere with event handling
        gsap.set(activeModal, {
          clearProps: "scale,transform,transformOrigin",
          // Ensure modal doesn't interfere with global event handling
          pointerEvents: "none"
        });
        // Re-enable pointer events after a brief delay to ensure clean state
        setTimeout(() => {
          activeModal.style.pointerEvents = '';
        }, 10);
        activeModal.style.display = 'none';
        activeModal.style.opacity = '';
        document.body.style.overflow = 'auto'; // Restore body scroll

        // Ensure canvas can receive events after modal closes
        const canvas = document.querySelector('#experience-canvas');
        if (canvas) {
          canvas.style.pointerEvents = 'auto';
          canvas.style.zIndex = '1';
        }

        // DON'T reset notebook and camera - keep them as they are
        // Users can continue clicking work buttons without reopening notebook

        // Reset modal state AFTER all animations are complete
        ModalOpen = false;
        releaseFocus();
        
        // Show UI controls when modal closes
        showUIControls();
        
        // Remove mouse movement listener and stop animation if about modal is closed
        if (activeModal.classList.contains('about')) {
          document.removeEventListener('mousemove', handleMouseMove);
          if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
          }
          aboutModal = null;
        }
        
        console.log('🔄 Modal closed - notebook and camera remain positioned');
        
        // Call the completion callback if provided
        if (onComplete && typeof onComplete === 'function') {
          onComplete();
        }
      }
    });
  } else {
    // If no active modal, just reset the state
    ModalOpen = false;
    // Show UI controls when no modal is active
    showUIControls();
    // Still call the callback if provided
    if (onComplete && typeof onComplete === 'function') {
      onComplete();
    }
  }
}

/**
 * Show a modal (wrapper for openModal)
 * @param {string|Element} modal - Modal class string or DOM element
 */
export const showModal = (modal) => {
  if (typeof modal === 'string') {
    openModal(modal);
  } else {
    openModal(modal.classList[0]); // Get first class name
  }
}

/**
 * Hide a modal (wrapper for closeModal)
 * @param {string|Element} modal - Modal to hide (parameter is ignored, always closes active modal)
 */
export const hideModal = (modal) => {
  closeModal();
}

/**
 * Navigate between work modals
 * @param {string} direction - 'next' or 'prev'
 */
export const navigateWork = (direction) => {
  console.log(`🔄 NavigateWork called with direction: ${direction}`);
  console.log(`🔄 Current work: ${currentWork}, Total works: ${totalWorks}`);
  
  let newWork;

  if (direction === 'next') {
    console.log('🔄 Navigating to next work');
    newWork = currentWork < totalWorks ? currentWork + 1 : 1;
  } else {
    console.log('🔄 Navigating to previous work');
    newWork = currentWork > 1 ? currentWork - 1 : totalWorks;
  }

  console.log(`🔄 New work will be: ${newWork}`);

  // Switch directly using openModal (handles instant switch if another is open)
  openModal('work' + newWork, true);
}

// =============================================================================
// MODAL SYSTEM INITIALIZATION
// =============================================================================

/**
 * Initialize modal system and event listeners
 * Should be called when DOM is ready
 */
export function initializeModals() {
  // Initialize modal references
  Modals = {
    work1: document.querySelector('.modal.work1'),
    work2: document.querySelector('.modal.work2'),
    work3: document.querySelector('.modal.work3'),
    work4: document.querySelector('.modal.work4'),
    work5: document.querySelector('.modal.work5'),
    about: document.querySelector('.modal.about'),
    contact: document.querySelector('.modal.contact'),
    enter: document.querySelector('.modal.enter'),
    gallery: document.querySelector('.modal.gallery')
  };

  // Delegate listeners will be attached on dynamic creation; attach fallback for any pre-existing modals
  document.querySelectorAll('.modal-exit-button').forEach(button => {
    button.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
  });
  document.querySelectorAll('.nav-arrow').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const direction = button.textContent.trim() === '←' ? 'prev' : 'next';
      navigateWork(direction);
    });
  });

  // Close modal when clicking outside content
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Prevent clicks inside modal content from closing modal
  document.addEventListener('click', function (e) {
    if (e.target.closest('.work-modal-container, .about h1, .about h2, .about p, .contact h1, .contact h2, .contact p')) {
      e.stopPropagation();
      return; // Early return to prevent further processing
    }
  });

  console.log('Modal system initialized');
}

// =============================================================================
// LOADING MODAL SYSTEM
// =============================================================================

/**
 * Hide the loading modal with animation
 * add loading bar 
 * @param {number} messageInterval - Optional message interval to clear
 */
export function hideLoadingModal(messageInterval = null) {
  const loadingModal = document.getElementById('loading-modal');
  if (!loadingModal) {
    console.error('Loading modal element not found');
    return;
  }
  
  
  // Clear message interval if provided
  if (messageInterval) {
    clearInterval(messageInterval);
  }
  
  // Fade out the loading modal
  loadingModal.style.opacity = '0';
  loadingModal.style.display = 'none';

}


// =============================================================================
// UI CONTROLS SYSTEM (HOME BUTTON & DARK MODE)
// =============================================================================

/**
 * Show the home button
 */
export function showHomeButton() {
  if (homeButton) {
    homeButton.classList.add('visible');
  }
}

/**
 * Hide the home button
 */
export function hideHomeButton() {
  if (homeButton) {
    homeButton.classList.remove('visible');
  }
}

/**
 * Show the dark mode button
 */
export function showDarkModeButton() {
  if (darkModeButton) {
    darkModeButton.classList.add('visible');
  }
}

/**
 * Hide the dark mode button
 */
export function hideDarkModeButton() {
  if (darkModeButton) {
    darkModeButton.classList.remove('visible');
  }
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  
  if (isDarkMode) {
    // Switch to dark mode
    document.body.style.filter = 'none';
    darkModeButton.innerHTML = '<img src="https://img.icons8.com/ios-filled/24/000000/light-off.png" alt="Theme Toggle" />';
    console.log('🌙 Switched to dark mode');
  } else {
    // Switch to light mode
    document.body.style.filter = 'invert(1) hue-rotate(180deg)';
    darkModeButton.innerHTML = '<img src="https://img.icons8.com/ios-filled/24/000000/light-on.png" alt="Theme Toggle" />';
    console.log('☀️ Switched to light mode');
  }
}

/**
 * Initialize home button functionality
 */
export function initializeHomeButton(resetCameraFunction) {
  homeButton = document.getElementById('home-button');
  
  if (homeButton) {
    homeButton.addEventListener('click', () => {
      console.log('🏠 Home button clicked - resetting camera');
      resetCameraFunction();
    });
    // Don't hide the home button initially - show it by default
    showHomeButton();
  }
}

/**
 * Initialize dark mode button functionality
 */
export function initializeDarkModeButton() {
  darkModeButton = document.getElementById('dark-mode-button');
  
  if (darkModeButton) {
    // Set initial state
    darkModeButton.innerHTML = isDarkMode ?'<img src="https://img.icons8.com/ios-filled/24/000000/light-off.png" alt="Theme Toggle" />' : '<img src="https://img.icons8.com/ios-filled/24/000000/light-on.png" alt="Theme Toggle" />';
    
    darkModeButton.addEventListener('click', () => {
      console.log('🌙/☀️ Dark mode button clicked - toggling mode');
      toggleDarkMode();
    });

    // Show the dark mode button by default
    showDarkModeButton();
    
    console.log('Dark mode button initialized');
  }
}

// =============================================================================
// FOCUS TRAP
// =============================================================================
let lastFocusedElement = null;
let focusTrapHandler = null;

function getFocusable(modal) {
  return modal.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
}

export function trapFocus(modal) {
  try {
    lastFocusedElement = document.activeElement;
    const focusables = Array.from(getFocusable(modal));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (first) first.focus();

    focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', focusTrapHandler);
  } catch (err) {
    console.warn('Focus trap initialization failed:', err);
  }
}

export function releaseFocus() {
  if (focusTrapHandler) {
    document.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    try { lastFocusedElement.focus(); } catch {}
  }
  lastFocusedElement = null;
}

/**
 * Show all UI controls
 */
export function showUIControls() {
  showHomeButton();
  showDarkModeButton();
}

/**
 * Hide all UI controls
 */
export function hideUIControls() {
  hideHomeButton();
  hideDarkModeButton();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get current work number
 * @returns {number} - Current work number (1-5)
 */
export function getCurrentWork() {
  return currentWork;
}

/**
 * Get total works count
 * @returns {number} - Total number of works
 */
export function getTotalWorks() {
  return totalWorks;
}
