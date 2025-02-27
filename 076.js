// lazy-load.js
class LazyLoader {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.1;
    this.rootMargin = options.rootMargin || '0px';
    this.placeholder = options.placeholder || '/placeholder.jpg';
    this.images = document.querySelectorAll('img[data-src]');
    this.observer = null;

    this.init();
  }

  init() {
    this.observer = new IntersectionObserver(this.handleIntersect.bind(this), {
      root: null,
      rootMargin: this.rootMargin,
      threshold: this.threshold
    });

    this.images.forEach(img => {
      this.observer.observe(img);
    });
  }

  handleIntersect(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
      }
    });
  }

  async loadImage(img) {
    const highResSrc = img.dataset.src;
    const placeholderSrc = img.src;

    try {
      // Create a temporary image object to load the high-res image
      const tempImg = new Image();
      tempImg.src = highResSrc;

      // Wait for the high-res image to load
      await new Promise((resolve, reject) => {
        tempImg.onload = resolve;
        tempImg.onerror = reject;
      });

      // Smooth transition from placeholder to high-res
      img.style.transition = 'opacity 0.3s ease-in-out';
      img.style.opacity = '0';
      
      // Update the image source and restore opacity
      img.src = highResSrc;
      setTimeout(() => {
        img.style.opacity = '1';
      }, 300);

      // Remove the image from the observer
      this.observer.unobserve(img);
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const lazyLoader = new LazyLoader({
    threshold: 0.1,
    rootMargin: '0px',
    placeholder: '/low-res-placeholder.jpg'
  });

  // Clean up when the page is about to unload
  window.addEventListener('beforeunload', () => {
    lazyLoader.destroy();
  });
});