(() => {
    'use strict';

    const nav = document.getElementById('siteNav');
    const progressLine = document.getElementById('progressLine');
    const menuToggle = document.getElementById('menuToggle');
    const sections = Array.from(document.querySelectorAll('.site-page[id]'));
    const sectionLinks = Array.from(document.querySelectorAll('[data-page-link]'));
    const primaryNavLinks = Array.from(document.querySelectorAll('.nav-links [data-page-link]'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const validSectionIds = new Set(sections.map(section => section.id));
    let scrollFrame = 0;
    let locationFrame = 0;
    let currentSectionId = '';

    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch (error) {
      // Scroll restoration is optional and may be unavailable in restricted browsers.
    }

    const getNavOffset = () => (nav ? nav.getBoundingClientRect().height + 24 : 24);
    const getSectionScrollAdjustment = () => 56;

    const getHashSection = () => {
      const id = decodeURIComponent(location.hash.replace(/^#/, '').trim());
      return validSectionIds.has(id) ? document.getElementById(id) : null;
    };

    function closeMobileMenu() {
      if (!nav || !menuToggle) return;
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    }

    function setActiveSection(id) {
      if (!validSectionIds.has(id) || currentSectionId === id) return;
      currentSectionId = id;
      document.body.dataset.activeSection = id;

      primaryNavLinks.forEach(link => {
        const active = link.dataset.pageLink === id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      document.title = id === 'home'
        ? 'Abdul Hadi Chowdhury — Research Profile'
        : `${id.charAt(0).toUpperCase() + id.slice(1)} — Abdul Hadi Chowdhury`;
    }

    function scrollToSection(section, smooth = true, updateHistory = false) {
      if (!section) return;
      const top = Math.max(
        0,
        window.scrollY + section.getBoundingClientRect().top - getNavOffset() + getSectionScrollAdjustment()
      );

      if (updateHistory && location.hash !== `#${section.id}`) {
        history.pushState(null, '', `#${section.id}`);
      }

      setActiveSection(section.id);
      window.scrollTo({
        top,
        left: 0,
        behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto'
      });
    }

    function handleSectionLink(event) {
      const link = event.currentTarget;
      const id = link.dataset.pageLink;
      const section = id ? document.getElementById(id) : null;
      if (!section) return;

      event.preventDefault();
      closeMobileMenu();
      scrollToSection(section, true, true);
    }

    sectionLinks.forEach(link => link.addEventListener('click', handleSectionLink));

    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.textContent = open ? '×' : '☰';
      });

      document.addEventListener('pointerdown', event => {
        if (nav.classList.contains('open') && !nav.contains(event.target)) closeMobileMenu();
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.classList.contains('open')) closeMobileMenu();
      });
    }

    function updateScrollState() {
      scrollFrame = 0;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

      if (progressLine) progressLine.style.width = `${Math.min((scrollTop / maxScroll) * 100, 100)}%`;
      if (nav) nav.classList.toggle('scrolled', scrollTop > 30);

      const marker = scrollTop + getNavOffset() + Math.min(window.innerHeight * 0.22, 180);
      let activeSection = sections[0];

      for (const section of sections) {
        if (section.offsetTop <= marker) activeSection = section;
        else break;
      }

      if (scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        activeSection = sections[sections.length - 1];
      }

      if (activeSection) setActiveSection(activeSection.id);
    }

    function requestScrollUpdate() {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollState);
    }

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);

    function handleLocationChange() {
      if (locationFrame) cancelAnimationFrame(locationFrame);
      locationFrame = requestAnimationFrame(() => {
        locationFrame = 0;
        const section = getHashSection();
        if (section) scrollToSection(section, false, false);
        else {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
          setActiveSection('home');
        }
      });
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Reveal elements as they enter the continuous page flow.
    const revealElements = Array.from(document.querySelectorAll('.reveal'));
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(element => element.classList.add('visible'));
    } else {
      const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.10, rootMargin: '0px 0px -7% 0px' });

      revealElements.forEach(element => revealObserver.observe(element));
    }

    // Animate counters once when they become visible.
    function animateCounter(element) {
      if (element.dataset.animated === 'true') return;
      const target = Number(element.dataset.target || 0);
      element.dataset.animated = 'true';

      if (!target || prefersReducedMotion) {
        element.textContent = target;
        return;
      }

      let startTime = 0;
      const duration = 700;
      function tick(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = String(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
        else element.textContent = String(target);
      }
      requestAnimationFrame(tick);
    }

    const counters = Array.from(document.querySelectorAll('.counter'));
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
    } else {
      const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.45 });
      counters.forEach(counter => counterObserver.observe(counter));
    }

    // Animate skill bars once when the Skills section enters view.
    const skillSection = document.getElementById('skills');
    const skillBars = Array.from(document.querySelectorAll('.bar-fill'));
    function animateSkillBars() {
      skillBars.forEach((bar, index) => {
        const width = `${bar.dataset.width || 0}%`;
        if (prefersReducedMotion) bar.style.width = width;
        else window.setTimeout(() => { bar.style.width = width; }, index * 70);
      });
    }

    if (skillSection && skillBars.length) {
      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        animateSkillBars();
      } else {
        const skillObserver = new IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting)) return;
          animateSkillBars();
          skillObserver.disconnect();
        }, { threshold: 0.20 });
        skillObserver.observe(skillSection);
      }
    }

    // Preserve the existing magnetic and tilt interactions.
    if (!prefersReducedMotion) {
      document.querySelectorAll('.magnetic').forEach(element => {
        element.addEventListener('pointermove', event => {
          const rect = element.getBoundingClientRect();
          const x = event.clientX - rect.left - rect.width / 2;
          const y = event.clientY - rect.top - rect.height / 2;
          element.style.transform = `translate3d(${x * 0.08}px, ${y * 0.12}px, 0)`;
        });
        element.addEventListener('pointerleave', () => { element.style.transform = ''; });
      });

      document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 5.5;
          const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -5.5;
          card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
        });
        card.addEventListener('pointerleave', () => { card.style.transform = ''; });
      });
    }

    // Faster, smoother and lightweight custom cursor for precise pointer devices.
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (dot && ring && precisePointer && !prefersReducedMotion) {
      document.body.classList.add('custom-cursor-enabled');
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let ringX = targetX;
      let ringY = targetY;
      let scale = 1;
      let targetScale = 1;
      let visible = false;

      function setCursorVisibility(show) {
        visible = show;
        dot.classList.toggle('cursor-visible', show);
        ring.classList.toggle('cursor-visible', show);
        if (!show) {
          targetScale = 1;
          ring.style.background = 'transparent';
          ring.style.borderColor = 'rgba(49, 92, 255, 0.52)';
        }
      }

      window.addEventListener('pointermove', event => {
        targetX = event.clientX;
        targetY = event.clientY;
        dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;

        if (!visible) {
          ringX = targetX;
          ringY = targetY;
          ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
          setCursorVisibility(true);
        }
      }, { passive: true });

      document.addEventListener('mouseout', event => {
        if (!event.relatedTarget && !event.toElement) setCursorVisibility(false);
      });
      window.addEventListener('blur', () => setCursorVisibility(false));

      function animateCursor() {
        if (visible) {
          ringX += (targetX - ringX) * 0.82;
          ringY += (targetY - ringY) * 0.82;
          scale += (targetScale - scale) * 0.72;

          if (Math.abs(targetX - ringX) < 0.02) ringX = targetX;
          if (Math.abs(targetY - ringY) < 0.02) ringY = targetY;
          if (Math.abs(targetScale - scale) < 0.002) scale = targetScale;

          ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
        }
        requestAnimationFrame(animateCursor);
      }
      requestAnimationFrame(animateCursor);

      document.querySelectorAll('a, button, .skill-pill, .project-card, .metric, .focus-item, .edu-card, .directory-card').forEach(item => {
        item.addEventListener('pointerenter', () => {
          targetScale = 1.62;
          ring.style.background = 'rgba(49, 92, 255, 0.07)';
          ring.style.borderColor = 'rgba(49, 92, 255, 0.68)';
        });
        item.addEventListener('pointerleave', () => {
          targetScale = 1;
          ring.style.background = 'transparent';
          ring.style.borderColor = 'rgba(49, 92, 255, 0.52)';
        });
      });
    }

    // Credential preview modal.
    const modal = document.getElementById('certModal');
    const modalImage = document.getElementById('certModalImage');
    let modalTrigger = null;

    function closeCertificateModal() {
      if (!modal || !modalImage) return;
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      modalImage.src = '';
      if (modalTrigger) modalTrigger.focus();
      modalTrigger = null;
    }

    if (modal && modalImage) {
      document.querySelectorAll('[data-cert-preview]').forEach(button => {
        button.addEventListener('click', () => {
          const image = button.closest('.credential-card')?.querySelector('.credential-media img');
          if (!image) return;
          modalTrigger = button;
          modalImage.src = image.src;
          modalImage.alt = image.alt || 'Credential preview';
          modal.classList.add('active');
          modal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          modal.querySelector('[data-cert-close]')?.focus();
        });
      });

      modal.querySelectorAll('[data-cert-close]').forEach(control => {
        control.addEventListener('click', closeCertificateModal);
      });

      document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('active')) closeCertificateModal();
      });
    }

    // Keep the one-time mobile Home intro from replaying after it settles.
    const mobileHomeQuery = window.matchMedia('(max-width: 980px)');
    if (mobileHomeQuery.matches) {
      window.setTimeout(() => document.body.classList.add('mobile-home-settled'), 2280);
    }

    // Preserve the existing mobile centre-focus effect for Experience and Research.
    const mobileFocusQuery = window.matchMedia('(max-width: 780px)');
    const focusSelector = '#experience .timeline-content, #research .project-card';
    let focusFrame = 0;

    const focusTargets = () => Array.from(document.querySelectorAll(focusSelector));
    const timelineItemFor = target => target.closest('.timeline-item');
    const timelinePinFor = target => timelineItemFor(target)?.querySelector('.timeline-pin') || null;

    function setFocusDefaults(target) {
      target.style.setProperty('--focus-scale', '0.965');
      target.style.setProperty('--focus-opacity', '0.84');
      target.style.setProperty('--focus-y', '8px');
      target.style.setProperty('--focus-blur', '20px');
      target.style.setProperty('--focus-alpha', '0.055');
      target.style.setProperty('--focus-border', '0.10');
      target.style.setProperty('--focus-bg', '0.74');
      target.style.setProperty('--focus-saturate', '0.97');
      target.style.setProperty('--focus-contrast', '0.985');
      target.classList.remove('mobile-center-focus');

      const item = timelineItemFor(target);
      const pin = timelinePinFor(target);
      item?.classList.remove('mobile-center-focus');

      if (pin) {
        pin.style.setProperty('--pin-scale', '0.92');
        pin.style.setProperty('--pin-opacity', '0.72');
        pin.style.setProperty('--pin-y', '6px');
        pin.style.setProperty('--pin-blur', '16px');
        pin.style.setProperty('--pin-alpha', '0.045');
        pin.style.setProperty('--pin-border', '0.14');
        pin.style.setProperty('--pin-bg', '0.74');
      }
    }

    function clearMobileFocus() {
      focusTargets().forEach(target => {
        ['--focus-scale', '--focus-opacity', '--focus-y', '--focus-blur', '--focus-alpha', '--focus-border', '--focus-bg', '--focus-saturate', '--focus-contrast']
          .forEach(name => target.style.removeProperty(name));
        target.classList.remove('mobile-center-focus');

        const item = timelineItemFor(target);
        const pin = timelinePinFor(target);
        item?.classList.remove('mobile-center-focus');
        if (pin) {
          ['--pin-scale', '--pin-opacity', '--pin-y', '--pin-blur', '--pin-alpha', '--pin-border', '--pin-bg']
            .forEach(name => pin.style.removeProperty(name));
        }
      });
    }

    function applyMobileFocus(target, eased, closest) {
      target.style.setProperty('--focus-scale', (0.965 + 0.050 * eased).toFixed(3));
      target.style.setProperty('--focus-opacity', (0.84 + 0.160 * eased).toFixed(3));
      target.style.setProperty('--focus-y', `${(8 + 16 * eased).toFixed(1)}px`);
      target.style.setProperty('--focus-blur', `${(20 + 38 * eased).toFixed(1)}px`);
      target.style.setProperty('--focus-alpha', (0.055 + 0.090 * eased).toFixed(3));
      target.style.setProperty('--focus-border', (0.10 + 0.145 * eased).toFixed(3));
      target.style.setProperty('--focus-bg', (0.74 + 0.16 * eased).toFixed(3));
      target.style.setProperty('--focus-saturate', (0.97 + 0.05 * eased).toFixed(3));
      target.style.setProperty('--focus-contrast', (0.985 + 0.025 * eased).toFixed(3));
      target.classList.toggle('mobile-center-focus', closest);

      const item = timelineItemFor(target);
      const pin = timelinePinFor(target);
      item?.classList.toggle('mobile-center-focus', closest);

      if (pin) {
        pin.style.setProperty('--pin-scale', (0.92 + 0.15 * eased).toFixed(3));
        pin.style.setProperty('--pin-opacity', (0.72 + 0.28 * eased).toFixed(3));
        pin.style.setProperty('--pin-y', `${(6 + 12 * eased).toFixed(1)}px`);
        pin.style.setProperty('--pin-blur', `${(16 + 22 * eased).toFixed(1)}px`);
        pin.style.setProperty('--pin-alpha', (0.045 + 0.11 * eased).toFixed(3));
        pin.style.setProperty('--pin-border', (0.14 + 0.16 * eased).toFixed(3));
        pin.style.setProperty('--pin-bg', (0.74 + 0.20 * eased).toFixed(3));
      }
    }

    function updateMobileFocus() {
      focusFrame = 0;
      const targets = focusTargets();
      if (!mobileFocusQuery.matches || !targets.length) {
        clearMobileFocus();
        return;
      }

      const viewportCentre = window.innerHeight * 0.50;
      const focusRange = Math.max(280, window.innerHeight * 0.58);
      let closestTarget = null;
      let closestDistance = Infinity;

      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        if (rect.bottom <= 80 || rect.top >= window.innerHeight - 70) return;
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCentre);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTarget = target;
        }
      });

      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        if (rect.bottom <= 80 || rect.top >= window.innerHeight - 70) {
          setFocusDefaults(target);
          return;
        }

        const distance = Math.abs(rect.top + rect.height / 2 - viewportCentre);
        const raw = 1 - Math.min(distance / focusRange, 1);
        const eased = raw * raw * (3 - 2 * raw);
        applyMobileFocus(target, eased, target === closestTarget);
      });
    }

    function requestMobileFocusUpdate() {
      if (!focusFrame) focusFrame = requestAnimationFrame(updateMobileFocus);
    }

    window.addEventListener('scroll', requestMobileFocusUpdate, { passive: true });
    window.addEventListener('resize', requestMobileFocusUpdate);
    if (mobileFocusQuery.addEventListener) mobileFocusQuery.addEventListener('change', requestMobileFocusUpdate);
    else mobileFocusQuery.addListener(requestMobileFocusUpdate);

    // Initialise once, respecting a valid direct section hash.
    const initialSection = getHashSection();
    if (initialSection) scrollToSection(initialSection, false, false);
    else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      setActiveSection('home');
    }

    requestScrollUpdate();
    requestMobileFocusUpdate();

    window.addEventListener('load', () => {
      const hashSection = getHashSection();
      if (hashSection) scrollToSection(hashSection, false, false);
      requestScrollUpdate();
      requestMobileFocusUpdate();
    }, { once: true });
  })();
