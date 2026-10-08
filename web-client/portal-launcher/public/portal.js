// User Menu Popover Toggle
document.addEventListener('DOMContentLoaded', () => {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      userDropdown.classList.add('hidden');
    });

    // Fullscreen Toggle
    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.log(err));
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }

    // Horizontal Scroll Slider (Left / Right Arrow Navigation)
    const cardsTrack = document.getElementById('cardsTrack');
    const slideLeft = document.getElementById('slideLeft');
    const slideRight = document.getElementById('slideRight');
    const scrollIndicator = document.getElementById('scrollIndicator');

    const scrollAmount = () => Math.max(cardsTrack.clientWidth * 0.85, 240);
    slideLeft.addEventListener('click', () => {
      cardsTrack.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
    });
    slideRight.addEventListener('click', () => {
      cardsTrack.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
    });

    const updateSliderState = () => {
      const maxScroll = cardsTrack.scrollWidth - cardsTrack.clientWidth;
      const canScroll = maxScroll > 1;
      const percentage = canScroll ? cardsTrack.scrollLeft / maxScroll : 0;
      const maxTranslate = 28;
      cardsTrack.classList.toggle('justify-center', !canScroll);
      cardsTrack.classList.toggle('justify-start', canScroll);
      scrollIndicator.style.transform = `translateX(${percentage * maxTranslate}px)`;
      scrollIndicator.parentElement.parentElement.classList.toggle('hidden', !canScroll);
      slideLeft.disabled = !canScroll || cardsTrack.scrollLeft <= 1;
      slideRight.disabled = !canScroll || cardsTrack.scrollLeft >= maxScroll - 1;
    };
    cardsTrack.addEventListener('scroll', updateSliderState, { passive: true });
    window.addEventListener('resize', updateSliderState);

    // Live Search Filter & Ctrl+K Shortcut
    const searchInput = document.getElementById('searchInput');
    const appCards = [...document.querySelectorAll('.app-card-item')];

    document.addEventListener('click', (event) => {
      const launchLink = event.target.closest('.app-launch');
      if (!launchLink) return;
      window.location.assign(launchLink.href);
    }, true);

    const updateCards = () => {
      const query = searchInput.value.toLowerCase().trim();
      let visibleCount = 0;
      appCards.forEach(card => {
        const matchesSearch = card.dataset.title.includes(query);
        const visible = matchesSearch;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      cardsTrack.scrollTo({ left: 0, behavior: 'auto' });
      updateSliderState();
      searchInput.setAttribute('aria-label', `${visibleCount} aplikasi ditemukan`);
    };

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', () => {
      updateCards();
    });

    cardsTrack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        cardsTrack.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        cardsTrack.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
      }
    });

    updateCards();

    // Service Worker Registration
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch((error) => {
          console.error("Service worker portal gagal didaftarkan:", error);
        });
      });
    }
});