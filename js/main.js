/* ==========================================================================
   Serendib Software Solutions: site interactions
   ========================================================================== */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const supportsIO = 'IntersectionObserver' in window;

  /* Logo fallback ----------------------------------------------------------
     Until assets/logo.png is added, show a monogram instead of a broken image. */
  function initLogoFallback() {
    document.querySelectorAll('img[data-logo]').forEach((img) => {
      const swap = () => {
        const fallback = document.createElement('span');
        fallback.className = 'logo-fallback';
        fallback.setAttribute('aria-hidden', 'true');
        fallback.textContent = 'S';
        img.replaceWith(fallback);
      };

      if (img.complete && img.naturalWidth === 0) swap();
      else img.addEventListener('error', swap, { once: true });
    });
  }

  /* Header: scrolled state, mobile menu, active section -------------------- */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    const toggle = header.querySelector('[data-nav-toggle]');
    const menu = header.querySelector('[data-nav-menu]');
    const desktop = window.matchMedia('(min-width: 901px)');

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const isOpen = () => header.classList.contains('is-open');
    const setOpen = (open) => {
      header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });
    desktop.addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });

    // Highlight the nav link for the section crossing the middle of the viewport
    if (!supportsIO) return;
    const links = [...menu.querySelectorAll('.nav-links a')];
    const linkFor = new Map(links.map((link) => [link.hash.slice(1), link]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const active = linkFor.get(entry.target.id);
        links.forEach((link) => link.classList.toggle('is-active', link === active));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('main section[id]').forEach((section) => spy.observe(section));
  }

  /* Scroll reveal ---------------------------------------------------------- */
  function initReveal() {
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      [...group.children].forEach((child, index) => {
        child.style.setProperty('--delay', `${index * 80}ms`);
      });
    });

    const items = document.querySelectorAll('[data-reveal]');
    if (!supportsIO) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    items.forEach((el) => observer.observe(el));
  }

  /* Hero starfield ----------------------------------------------------------
     A light canvas starfield with a gentle twinkle. Draws a single static frame
     for reduced-motion users and pauses while off-screen or in a hidden tab. */
  function initStarfield() {
    const canvas = document.querySelector('[data-starfield]');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const palette = ['#EDF1FA', '#EDF1FA', '#EDF1FA', '#9FD3F5', '#9FD3F5', '#2FD9A0'];
    let stars = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let onScreen = true;

    const seed = () => {
      const count = Math.round((width * height) / 2400);
      stars = Array.from({ length: count }, () => {
        const bright = Math.random() > 0.9;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: bright ? 0.9 + Math.random() * 0.9 : 0.3 + Math.random() * 0.7,
          alpha: bright ? 0.7 + Math.random() * 0.3 : 0.2 + Math.random() * 0.5,
          speed: 0.0004 + Math.random() * 0.0014,
          phase: Math.random() * Math.PI * 2,
          color: palette[Math.floor(Math.random() * palette.length)],
        };
      });
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const twinkle = reduceMotion.matches ? 1 : 0.6 + 0.4 * Math.sin(time * star.speed + star.phase);
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (time) => {
      draw(time);
      frame = requestAnimationFrame(loop);
    };

    const update = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reduceMotion.matches || !onScreen || document.hidden) draw(performance.now());
      else frame = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      update();
    };

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();

    if (supportsIO) {
      new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        update();
      }).observe(canvas);
    }
    document.addEventListener('visibilitychange', update);
    reduceMotion.addEventListener('change', update);
  }

  /* Contact form -----------------------------------------------------------
     Client-side validation with inline, accessible error messages.
     There is no backend yet: replace submitContactForm() with a real request
     (e.g. fetch to your API, Formspree or Netlify Forms). */
  function submitContactForm(data) {
    // TODO: send `data` ({ name, email, message }) to a real endpoint.
    return Promise.resolve(data);
  }

  function initContactForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;

    form.noValidate = true;
    const fields = [...form.querySelectorAll('input, textarea')];
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('[type="submit"]');

    const messages = {
      name: 'Please enter your name.',
      email: 'Please enter your email address.',
      message: 'Please tell us a little about your project.',
    };

    // Every field is required; whitespace-only input counts as empty
    const errorFor = (field) => {
      if (!field.value.trim()) return messages[field.name];
      if (field.validity.typeMismatch) return 'Please enter a valid email address, like name@company.com.';
      return '';
    };

    const validate = (field) => {
      const error = errorFor(field);
      document.getElementById(`${field.id}-error`).textContent = error;
      if (error) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      return !error;
    };

    fields.forEach((field) => {
      field.addEventListener('blur', () => {
        if (field.value.trim()) validate(field);
      });
      field.addEventListener('input', () => {
        if (field.hasAttribute('aria-invalid')) validate(field);
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '';
      status.classList.remove('is-success');

      const invalid = fields.filter((field) => !validate(field));
      if (invalid.length) {
        invalid[0].focus();
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      submit.disabled = true;

      try {
        await submitContactForm(data);
        const firstName = data.name.trim().split(/\s+/)[0];
        status.textContent = `Thanks, ${firstName}. Your message is on its way, and we’ll be in touch soon.`;
        status.classList.add('is-success');
        form.reset();
      } catch {
        status.textContent = 'Sorry, something went wrong. Please try again, or email us directly.';
      } finally {
        submit.disabled = false;
      }
    });
  }

  /* Footer year ------------------------------------------------------------ */
  function initYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = year; });
  }

  initLogoFallback();
  initHeader();
  initReveal();
  initStarfield();
  initContactForm();
  initYear();
})();
