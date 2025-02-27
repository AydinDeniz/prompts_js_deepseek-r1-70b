// URL redirect based on query parameters

function redirectBasedOnQueryParams() {
  const validSections = ['dashboard', 'analytics', 'settings', 'profile'];
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get('section');

  if (!section || !validSections.includes(section)) {
    // Handle invalid or missing section
    console.error('Invalid or missing section in URL.');
    window.location.href = '/dashboard'; // Default redirect
    return;
  }

  try {
    // Validate section exists in DOM
    const sectionElement = document.getElementById(section);
    if (!sectionElement) {
      throw new Error(`Section '${section}' not found in DOM.`);
    }

    // Smooth scroll to section
    sectionElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    // Highlight the active section
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === section) {
        link.classList.add('active');
      }
    });

  } catch (error) {
    console.error('Error redirecting to section:', error);
    window.location.href = '/dashboard'; // Fallback redirect
  }
}

// Add event listener for URL changes
window.addEventListener('load', redirectBasedOnQueryParams);
window.addEventListener('popstate', redirectBasedOnQueryParams);

// Example HTML structure:
/*
<nav>
  <a href="?section=dashboard" class="nav-link" data-section="dashboard">Dashboard</a>
  <a href="?section=analytics" class="nav-link" data-section="analytics">Analytics</a>
  <a href="?section=settings" class="nav-link" data-section="settings">Settings</a>
  <a href="?section=profile" class="nav-link" data-section="profile">Profile</a>
</nav>

<section id="dashboard">Dashboard content</section>
<section id="analytics">Analytics content</section>
<section id="settings">Settings content</section>
<section id="profile">Profile content</section>
*/

// CSS for smooth scrolling:
/*
html {
  scroll-behavior: smooth;
}

.nav-link.active {
  color: #007bff;
}
*/