const { test, expect } = require('@playwright/test');

const ASSETS = {
  lv1: '/experiences/founders-plot/assets/buildings/hq-lv1.webp',
  lv3: '/experiences/founders-plot/assets/buildings/hq-lv3.webp',
  lv5: '/experiences/founders-plot/assets/buildings/hq-lv5.webp'
};

async function injectGallery(page, { hideLabels = false } = {}) {
  await page.goto('/start.html');
  await page.evaluate(({ assets, hideLabels: shouldHideLabels }) => {
    document.body.innerHTML = `
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 18% 12%, rgba(255,247,230,0.92), rgba(255,247,230,0) 34%),
            linear-gradient(180deg, rgba(246,211,145,0.86), rgba(244,229,200,0.94));
          font-family: Wellfleet, serif;
          color: #2e1b0e;
        }
        .hqGallery {
          width: min(1180px, calc(100vw - 64px));
          display: grid;
          gap: 24px;
          padding: 28px 32px 36px;
          border-radius: 30px;
          background: rgba(255, 247, 230, 0.74);
          box-shadow: 0 20px 48px rgba(61,32,15,0.18);
        }
        .hqGalleryRow {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          align-items: end;
        }
        .hqCard {
          display: grid;
          gap: 12px;
          justify-items: center;
        }
        .hqStage {
          width: 100%;
          min-height: 300px;
          display: grid;
          place-items: end center;
          border-radius: 26px;
          background:
            radial-gradient(circle at center bottom, rgba(196,136,58,0.20), rgba(196,136,58,0) 52%),
            linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0));
          overflow: hidden;
        }
        .hqStage img {
          width: min(280px, 82%);
          height: auto;
          filter: drop-shadow(0 18px 28px rgba(61,32,15,0.22));
        }
        .hqCard figcaption {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hqGallery[data-hide-labels="true"] figcaption {
          display: none;
        }
      </style>
      <section class="hqGallery" id="hqGallery" data-hide-labels="${shouldHideLabels ? 'true' : 'false'}">
        <div>
          <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.72;">Patch 2 HQ Progression</div>
          <h1 style="margin:6px 0 0;font-family:Smokum,serif;font-size:48px;line-height:0.95;">Headquarters Ladder</h1>
        </div>
        <div class="hqGalleryRow">
          <figure class="hqCard"><div class="hqStage"><img src="${assets.lv1}" alt="HQ level 1" /></div><figcaption>Level 1</figcaption></figure>
          <figure class="hqCard"><div class="hqStage"><img src="${assets.lv3}" alt="HQ level 3" /></div><figcaption>Level 3</figcaption></figure>
          <figure class="hqCard"><div class="hqStage"><img src="${assets.lv5}" alt="HQ level 5" /></div><figcaption>Level 5</figcaption></figure>
        </div>
      </section>
    `;
  }, { assets: ASSETS, hideLabels });
}

test('Patch 2 HQ milestone assets have visible gameplay-scale deltas', async ({ page }) => {
  await injectGallery(page, { hideLabels: false });

  const deltas = await page.evaluate(async ({ assets }) => {
    async function load(src) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);
      return ctx.getImageData(0, 0, 256, 256).data;
    }
    function rmsDelta(a, b) {
      let sum = 0;
      let n = 0;
      for (let index = 0; index < a.length; index += 4) {
        const alphaWeight = Math.max(a[index + 3], b[index + 3]) / 255;
        if (alphaWeight < 0.05) continue;
        for (let channel = 0; channel < 3; channel += 1) {
          const delta = (a[index + channel] - b[index + channel]) / 255;
          sum += delta * delta * alphaWeight;
          n += alphaWeight;
        }
      }
      return Math.sqrt(sum / Math.max(n, 1));
    }
    const [lv1, lv3, lv5] = await Promise.all([load(assets.lv1), load(assets.lv3), load(assets.lv5)]);
    return {
      lv1Lv3: rmsDelta(lv1, lv3),
      lv3Lv5: rmsDelta(lv3, lv5),
      lv1Lv5: rmsDelta(lv1, lv5)
    };
  }, { assets: ASSETS });

  expect(deltas.lv1Lv3).toBeGreaterThanOrEqual(0.08);
  expect(deltas.lv3Lv5).toBeGreaterThanOrEqual(0.08);
  expect(deltas.lv1Lv5).toBeGreaterThanOrEqual(0.12);

  await expect(page.locator('#hqGallery')).toHaveScreenshot('founders-v1-4-2-patch2-hq-progression-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });

  await injectGallery(page, { hideLabels: true });
  await expect(page.locator('#hqGallery')).toHaveScreenshot('founders-v1-4-2-patch2-hq-progression-no-labels-1280.png', {
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.03
  });
});
