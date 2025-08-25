import gsap from 'gsap';

// Modal state
export let ModalOpen = false;

// Modal navigation state
let currentWork = 1;
const totalWorks = 5;

// Modal references - initialized after DOM loads
let Modals = {};

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

/**
 * Open a modal with animation
 * @param {string} modalClass - CSS class of the modal to open
 */
export const openModal = (modalClass) => {
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

    // Update current work index if it's a work modal
    if (modal.classList.contains('work1')) currentWork = 1;
    else if (modal.classList.contains('work2')) currentWork = 2;
    else if (modal.classList.contains('work3')) currentWork = 3;
    else if (modal.classList.contains('work4')) currentWork = 4;
    else if (modal.classList.contains('work5')) currentWork = 5;

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
        duration: 0.5,
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
export const closeModal = (navigate = false, direction = 1) => {
  const activeModal = document.querySelector('.modal.active');
  if (activeModal) {

    if (navigate) {
      //if navigate is tro modelas animation should be sliding isnted of scale
      gsap.to(activeModal, {
        x: direction * 100,
        duration: 0.5,
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
          console.log('Modal closed - notebook and camera remain positioned');
        }
      });
      return;
    }
    gsap.to(activeModal, {
      opacity: 0,
      scale: 0,
      duration: 0.5,
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
        console.log('Modal closed - notebook and camera remain positioned');
      }
    });
  } else {
    // If no active modal, just reset the state
    ModalOpen = false;
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
  let newWork;

  if (direction === 'next') {
    newWork = currentWork < totalWorks ? currentWork + 1 : 1;
  } else {
    newWork = currentWork > 1 ? currentWork - 1 : totalWorks;
  }

  // Close current modal and open new one
  closeModal(true, direction === 'next' ? 1 : -1);
  setTimeout(() => {
    openModal('work' + newWork);
  }, 100);
}

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
    contact: document.querySelector('.modal.contact')
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
    }
  });

  console.log('Modal system initialized');
}

/**
 * Test function to open modals from console
 * @param {number} workNumber - Work number to test (1-5)
 */
export const testModal = (workNumber) => {
  console.log(`Testing modal work${workNumber}`);
  openModal(`work${workNumber}`);
};

/**
 * Debug function to check modal states
 */
export const checkModalStates = () => {
  console.log('Current modal states:');
  for (let i = 1; i <= 5; i++) {
    const modal = document.querySelector(`.modal.work${i}`);
    if (modal) {
      console.log(`work${i}:`, {
        display: modal.style.display,
        opacity: modal.style.opacity,
        hasActive: modal.classList.contains('active'),
        computedDisplay: window.getComputedStyle(modal).display,
        computedOpacity: window.getComputedStyle(modal).opacity
      });
    }
  }
};

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
