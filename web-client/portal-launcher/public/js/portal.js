/**
 * Portal Launcher Client-Side JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // ─── 1. User Dropdown Menu Popover ───
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');

  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      userDropdown.classList.add('hidden');
    });
  }

  // ─── 2. Horizontal Scroll Slider Controls ───
  const cardsTrack = document.getElementById('cardsTrack');
  const slideLeft = document.getElementById('slideLeft');
  const slideRight = document.getElementById('slideRight');
  const scrollIndicator = document.getElementById('scrollIndicator');

  const scrollAmount = 300;

  if (slideLeft && cardsTrack) {
    slideLeft.addEventListener('click', () => {
      cardsTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  if (slideRight && cardsTrack) {
    slideRight.addEventListener('click', () => {
      cardsTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // Bottom Scroll Progress Indicator Update
  if (cardsTrack && scrollIndicator) {
    cardsTrack.addEventListener('scroll', () => {
      const maxScroll = cardsTrack.scrollWidth - cardsTrack.clientWidth;
      if (maxScroll > 0) {
        const percentage = cardsTrack.scrollLeft / maxScroll;
        const indicatorWidth = 32; // px
        const trackWidth = 64; // px container
        const maxTranslate = trackWidth - indicatorWidth - 4;
        scrollIndicator.style.transform = `translateX(${percentage * maxTranslate}px)`;
      }
    });
  }

  // ─── 3. Mouse Drag to Scroll Left & Right ───
  if (cardsTrack) {
    let isDown = false;
    let startX;
    let scrollLeftPos;

    cardsTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - cardsTrack.offsetLeft;
      scrollLeftPos = cardsTrack.scrollLeft;
    });

    cardsTrack.addEventListener('mouseleave', () => { isDown = false; });
    cardsTrack.addEventListener('mouseup', () => { isDown = false; });
    cardsTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - cardsTrack.offsetLeft;
      const walk = (x - startX) * 2;
      cardsTrack.scrollLeft = scrollLeftPos - walk;
    });
  }

  // ─── 4. Live Search Filter & Ctrl+K Keyboard Shortcut ───
  const searchInput = document.getElementById('searchInput');
  const appCards = document.querySelectorAll('.app-card-item');

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (searchInput) searchInput.focus();
    }
  });

  if (searchInput && appCards.length > 0) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      appCards.forEach(card => {
        const title = card.getAttribute('data-title') || '';
        if (title.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // ─── 5. Filter Tabs (Website vs Mobile) ───
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active', 'bg-white/20', 'border', 'border-white/20', 'text-white');
        b.classList.add('text-slate-300');
      });
      btn.classList.add('active', 'bg-white/20', 'border', 'border-white/20', 'text-white');
      btn.classList.remove('text-slate-300');
    });
  });

  // ─── 6. Service Worker Registration ───
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.error('Service worker portal gagal didaftarkan:', error);
      });
    });
  }
});

// Fullscreen Toggle (Global)
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => console.log(err));
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
