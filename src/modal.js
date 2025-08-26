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
const totalWorks = 5;

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
    const speed = parseFloat(image.dataset.speed-0.1) || 1;
    
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
  const modal = typeof modalClass === 'string' ?
    document.querySelector('.modal.' + modalClass) : modalClass;

  if (modal) {
    // Clear any previous GSAP properties and reset modal state
    gsap.killTweensOf(modal);
    gsap.set(modal, { clearProps: "all" });
    modal.style.opacity = '';
    modal.style.display = 'block';

    ModalOpen = true;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    
    // Hide UI controls when modal opens
    hideUIControls();

    // Update current work index if it's a work modal
    if (modal.classList.contains('work1')) currentWork = 1;
    else if (modal.classList.contains('work2')) currentWork = 2;
    else if (modal.classList.contains('work3')) currentWork = 3;
    else if (modal.classList.contains('work4')) currentWork = 4;
    else if (modal.classList.contains('work5')) currentWork = 5;
    
    // Special handling for about modal
    if (modal.classList.contains('about')) {
      aboutModal = modal;
      console.log('About modal opened, setting up floating effects');
      
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        startFloatingAnimation();
        // Add mouse movement listener
        document.addEventListener('mousemove', handleMouseMove);
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
        // Clear any GSAP properties that might interfere
        gsap.set(activeModal, { clearProps: "all" });
        activeModal.style.display = 'none';
        activeModal.style.opacity = '';
        document.body.style.overflow = 'auto'; // Restore body scroll

        // DON'T reset notebook and camera - keep them as they are
        // Users can continue clicking work buttons without reopening notebook

        // Reset modal state AFTER all animations are complete
        ModalOpen = false;
        
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

  // Close current modal and open new one
  closeModal(true, direction === 'next' ? 1 : -1);
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

  // Modal exit button listeners
  document.querySelectorAll('.modal-exit-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  });

  // Navigation button listeners
  document.querySelectorAll('.nav-arrow').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('🔄 Navigation arrow clicked:', button.textContent.trim());
      const direction = button.textContent.trim() === '←' ? 'prev' : 'next';
      console.log('🔄 Direction determined:', direction);
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
    }
  });

  console.log('Modal system initialized');
}

// =============================================================================
// LOADING MODAL SYSTEM
// =============================================================================

/**
 * Hide the loading modal with animation
 * @param {number} messageInterval - Optional message interval to clear
 */
export function hideLoadingModal(messageInterval = null) {
  const loadingModal = document.getElementById('loading-modal');
  if (!loadingModal) {
    console.error('Loading modal element not found');
    return;
  }
  
  console.log('🔄 Hiding loading modal');
  
  // Clear message interval if provided
  if (messageInterval) {
    clearInterval(messageInterval);
  }
  
  // Fade out the loading modal
  loadingModal.style.opacity = '0';
  loadingModal.style.display = 'none';

}

// =============================================================================
// ENTER MODAL SYSTEM
// =============================================================================

/**
 * Show the enter modal with animation
 */
export function showEnterModal() {
  // Quick modal system initialization (workaround)
  openModal("about");
  openModal("enter");
 
}
export function closeEnterModal() {
  closeModal();
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
    hideHomeButton();
     
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
    
    console.log('Dark mode button initialized');
  }
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
