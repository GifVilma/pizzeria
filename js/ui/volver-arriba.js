const instances = new WeakMap();

export function initBackToTop() {
  const button = document.getElementById('back-to-top');
  if (button?.tagName !== 'BUTTON') return;
  if (instances.has(button)) return instances.get(button);
  let frame = null;
  const obstacles = 'a[href], button, input, select, textarea, iframe, [tabindex]:not([tabindex="-1"]), [role="button"], form';

  const update = () => {
    frame = null;
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const threshold = Math.min(450, maximum);
    if (window.scrollY <= 0 || window.scrollY < threshold ||
        document.querySelector('#navbarResponsive.show, #navbarResponsive.collapsing')) {
      button.hidden = true;
      return;
    }
    button.hidden = false;
    const area = button.getBoundingClientRect();
    // Incluye el espacio del indicador de foco, sin mover otros controles.
    const overlaps = [...document.querySelectorAll(obstacles)].some(element => {
      if (element === button || element.contains(button)) return false;
      const style = window.getComputedStyle(element);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      return [...element.getClientRects()].some(rect => rect.width > 0 && rect.height > 0 &&
        rect.left < area.right + 8 && rect.right > area.left - 8 &&
        rect.top < area.bottom + 8 && rect.bottom > area.top - 8);
    });
    button.hidden = overlaps;
  };
  const schedule = () => {
    if (frame === null) frame = window.requestAnimationFrame(update);
  };
  const goUp = () => {
    // Evita perder el foco al ocultarse el botón durante el desplazamiento.
    document.getElementById('app-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  button.addEventListener('click', goUp);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('focusin', schedule);
  const resize = new ResizeObserver(schedule);
  resize.observe(document.body);
  const menu = document.getElementById('mainNav');
  const changes = new MutationObserver(schedule);
  if (menu) changes.observe(menu, { attributes: true, subtree: true, attributeFilter: ['class', 'aria-expanded'] });
  const cleanup = () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
    button.removeEventListener('click', goUp);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', schedule);
    document.removeEventListener('focusin', schedule);
    resize.disconnect(); changes.disconnect();
    button.hidden = true;
    instances.delete(button);
  };
  instances.set(button, cleanup);
  update();
  return cleanup;
}
