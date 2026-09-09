(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  const header = document.querySelector('.site-header');
  if (menu && nav && header) {
    const setMenu = (open, restoreFocus = false) => {
      menu.setAttribute('aria-expanded', String(open));
      menu.querySelector('.menu-label').textContent = open ? '닫기' : '메뉴';
      nav.classList.toggle('is-open', open);
      if (restoreFocus) menu.focus();
    };
    menu.hidden = false;
    document.documentElement.classList.add('menu-ready');
    menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link) return;
      const isMobile = matchMedia('(max-width: 760px)').matches;
      setMenu(false);
      if (isMobile && link.hash) {
        const target = document.querySelector(link.hash);
        if (target) {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
        }
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', (event) => {
      if (!header.contains(event.target)) setMenu(false);
    });
    header.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
    });
    matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
      if (event.matches) setMenu(false);
    });
  }
  const year = document.querySelector('#copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());
  const links = [...document.querySelectorAll('.nav-links a')];
  const sections = [...document.querySelectorAll('main > section[id]')];
  let queued = false;
  const updateNavigation = () => {
    let active = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 165) active = section.id;
    }
    for (const link of links) {
      if (link.hash === '#' + active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    queued = false;
  };
  addEventListener('scroll', () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });
  updateNavigation();
})();
