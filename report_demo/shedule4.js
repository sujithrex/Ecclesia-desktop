// Install: npm install puppeteer

const puppeteer = require('puppeteer');
const fs = require('fs');

async function generateTamilPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @font-face {
          font-family: 'Vijaya';
          src: url('./Vijaya.ttf') format('truetype');
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          width: 297.00mm;
          height: 210.00mm;
          position: relative;
          overflow: hidden;
        }
        .text-frame {
          position: absolute;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .text-content {
          width: 100%;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .shape {
          position: absolute;
        }
        .line {
          position: absolute;
        }
        .table-cell {
          position: absolute;
          overflow: hidden;
        }
        .image-frame {
          position: absolute;
        }
      </style>
    </head>
    <body>
      <div class="text-frame" style="
        left: 280.00mm;
        top: 92.27mm;
        margin-left: -34.88mm;
        margin-top: -7.00mm;
        width: 69.75mm;
        height: 14.00mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">FATHER 2</div>
      </div>
      <div class="text-frame" style="
        left: 247.20mm;
        top: 92.27mm;
        margin-left: -34.88mm;
        margin-top: -8.00mm;
        width: 69.75mm;
        height: 16.00mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">NALLUR</div>
      </div>
      <div class="text-frame" style="
        left: 211.15mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -6.40mm;
        width: 69.75mm;
        height: 12.80mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">PRIVATE</div>
      </div>
      <div class="text-frame" style="
        left: 182.80mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -6.40mm;
        width: 69.75mm;
        height: 12.80mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">SPINSTER</div>
      </div>
      <div class="text-frame" style="
        left: 154.87mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -4.67mm;
        width: 69.75mm;
        height: 9.35mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">22 (22-09-2022)</div>
      </div>
      <div class="text-frame" style="
        left: 131.27mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -5.53mm;
        width: 69.75mm;
        height: 11.05mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">-</div>
      </div>
      <div class="text-frame" style="
        left: 68.45mm;
        top: 144.00mm;
        width: 93.87mm;
        height: 7.40mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: left;
        ">REV. JEBARATHINAM</div>
      </div>
      <div class="text-frame" style="
        left: 105.00mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -7.00mm;
        width: 69.75mm;
        height: 14.00mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">Remina S</div>
      </div>
      <div class="text-frame" style="
        left: 263.20mm;
        top: 92.27mm;
        margin-left: -34.88mm;
        margin-top: -8.00mm;
        width: 69.75mm;
        height: 16.00mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">FATHER 1</div>
      </div>
      <div class="text-frame" style="
        left: 227.98mm;
        top: 92.27mm;
        margin-left: -34.88mm;
        margin-top: -10.43mm;
        width: 69.75mm;
        height: 20.85mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">TENKASI</div>
      </div>
      <div class="text-frame" style="
        left: 196.43mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -6.88mm;
        width: 69.75mm;
        height: 13.75mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">GOVERNMENT</div>
      </div>
      <div class="text-frame" style="
        left: 168.08mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -6.88mm;
        width: 69.75mm;
        height: 13.75mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">BACHELOR</div>
      </div>
      <div class="text-frame" style="
        left: 142.65mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -5.85mm;
        width: 69.75mm;
        height: 11.70mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">29 (13-10-1997</div>
      </div>
      <div class="text-frame" style="
        left: 118.87mm;
        top: 93.48mm;
        margin-left: -34.88mm;
        margin-top: -6.88mm;
        width: 69.75mm;
        height: 13.75mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">-</div>
      </div>
      <div class="text-frame" style="
        left: 86.87mm;
        top: 93.13mm;
        margin-left: -34.88mm;
        margin-top: -8.88mm;
        width: 69.75mm;
        height: 17.75mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">Sujith S</div>
      </div>
      <div class="text-frame" style="
        left: 68.45mm;
        top: 93.13mm;
        margin-left: -34.88mm;
        margin-top: -9.05mm;
        width: 69.75mm;
        height: 18.10mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">2025</div>
      </div>
      <div class="text-frame" style="
        left: 50.35mm;
        top: 93.13mm;
        margin-left: -34.88mm;
        margin-top: -9.05mm;
        width: 69.75mm;
        height: 18.10mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">05 (May)</div>
      </div>
      <div class="text-frame" style="
        left: 33.88mm;
        top: 93.12mm;
        margin-left: -34.88mm;
        margin-top: -6.88mm;
        width: 69.75mm;
        height: 13.75mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">22 (Monday)</div>
      </div>
      <div class="text-frame" style="
        left: 18.00mm;
        top: 93.12mm;
        margin-left: -34.88mm;
        margin-top: -8.00mm;
        width: 69.75mm;
        height: 16.00mm;
        transform: rotate(-90.0deg);
        transform-origin: center center;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">12</div>
      </div>
      <div class="text-frame" style="
        left: 96.00mm;
        top: 31.95mm;
        width: 191.00mm;
        height: 8.38mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: left;
        ">St. Thomas Church, Nallur during the month ending of May 2025</div>
      </div>
      <div class="text-frame" style="
        left: 244.10mm;
        top: 24.20mm;
        width: 38.90mm;
        height: 5.30mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: left;
        ">09-05-2025</div>
      </div>
      <div class="text-frame" style="
        left: 244.10mm;
        top: 17.10mm;
        width: 38.90mm;
        height: 5.30mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: left;
        ">08-05-2025</div>
      </div>
      <div class="text-frame" style="
        left: 244.10mm;
        top: 10.00mm;
        width: 38.90mm;
        height: 5.30mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: left;
        ">07-05-2025</div>
      </div>
      <div class="shape" style="
        left: 0.00mm;
        top: 0.00mm;
        width: 297.00mm;
        height: 209.97mm;
      "></div>
      <div class="image-frame" style="
        left: 0.00mm;
        top: 0.00mm;
        width: 297.00mm;
        height: 209.97mm;
        overflow: hidden;
      ">
        <img src="D:/Reports/shedule4.png" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'tamil-output.pdf',
    width: '297.00mm',
    height: '210.00mm',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });

  await browser.close();
  console.log('PDF generated successfully!');
}

generateTamilPDF().catch(console.error);