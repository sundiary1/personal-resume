import React from 'react';
import { createRoot } from 'react-dom/client';
import ShapeGrid from './ShapeGrid';
import Lanyard from './Lanyard';

/* ShapeGrid — 仅 Hero 区域 */
function mountShapeGrid() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.style.position = 'relative';
  hero.style.isolation = 'isolate';

  const mount = document.createElement('div');
  mount.style.cssText = 'position:absolute;inset:0;z-index:0;pointer-events:auto;';
  mount.setAttribute('aria-hidden', 'true');
  hero.insertBefore(mount, hero.firstChild);

  createRoot(mount).render(
    React.createElement(ShapeGrid, {
      direction: 'diagonal',
      speed: 0.2,
      borderColor: 'rgba(26, 25, 23, 0.05)',
      squareSize: 40,
      hoverFillColor: 'rgba(200, 90, 30, 0.28)',
      shape: 'square',
      hoverTrailAmount: 15,
    })
  );
}

/* Lanyard — 右上角工牌，拉动返回顶部 */
function mountLanyard() {
  const mount = document.createElement('div');
  mount.style.cssText = 'position:fixed;top:0;right:0;z-index:30;';
  document.body.appendChild(mount);

  createRoot(mount).render(
    React.createElement(Lanyard, {
      position: [0, 0, 15],
      gravity: [0, -15, 0],
      fov: 26,
      frontImage: './assets/profile/zhou-tian-profile.jpg',
      imageFit: 'cover',
      lanyardWidth: 0.8,
      onPull: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    })
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mountShapeGrid();
    mountLanyard();
  });
} else {
  mountShapeGrid();
  mountLanyard();
}
