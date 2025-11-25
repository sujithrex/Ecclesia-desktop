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
          width: 148.00mm;
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
        left: 12.70mm;
        top: 144.53mm;
        width: 37.05mm;
        height: 6.53mm;
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
        ">Date  : </div>
      </div>
      <div class="text-frame" style="
        left: 12.70mm;
        top: 138.00mm;
        width: 37.05mm;
        height: 6.53mm;
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
        ">Place : </div>
      </div>
      <div class="text-frame" style="
        left: 98.25mm;
        top: 145.00mm;
        width: 37.05mm;
        height: 6.53mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 0.00mm 0.00mm 0.00mm 0.00mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-end;
          font-size: 12.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: right;
        ">Presbyter – in charge</div>
      </div>
      <div class="text-frame" style="
        left: 12.50mm;
        top: 51.00mm;
        width: 122.60mm;
        height: 76.00mm;
        border: 0.35mm solid #000000;
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
          text-align: justify;
        ">	A Marriage has been proposed between
        
    Mr. Sujith S., bachelor, born on 13-10-1997 (age 25), Catechist, son of Mr. Selvaraj and Mrs. Rajini of C.S.I. St. Peter’s Church, Tenkasi, North Zion Nagar Pastorate; and Miss S. Remina, spinster, born on 17-04-2000 (age 22), Engineer, daughter of Mr. Thomas and Mrs. Megala of C.S.I. St. Paul’s Church, Nallur Pastorate.

	The Bridegroom and Bride are of proper age and are regular members of our Church.
	
	I am arranging to Call Banns on 13-12-2025, 15-12-2025 and 18-12-2025   and request you to do the same provided there is no impediment on Bridegrooms/Bride side. 

Date of marriage 20-12-2025
</div>
      </div>
      <div class="text-frame" style="
        left: 5.00mm;
        top: 31.47mm;
        width: 138.00mm;
        height: 6.53mm;
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
        ">MARRIAGE BANNS NOTICE</div>
      </div>
      <div class="text-frame" style="
        left: 7.00mm;
        top: 15.65mm;
        width: 138.00mm;
        height: 6.53mm;
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
          font-size: 11.2pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">Tenkasi North Zion Nagar Pastorate</div>
      </div>
      <div class="text-frame" style="
        left: 6.25mm;
        top: 10.13mm;
        width: 138.00mm;
        height: 4.09mm;
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
          font-size: 9.0pt;
          font-family: 'Vijaya';
          color: #000000;
          text-align: center;
        ">Church of South India - Tirunelveli Diocese</div>
      </div>
      <div class="shape" style="
        left: 41.25mm;
        top: 28.50mm;
        width: 65.25mm;
        height: 9.00mm;
        border: 0.35mm solid #000000;
      "></div>
      <div class="shape" style="
        left: 126.39mm;
        top: 5.89mm;
        width: 10.11mm;
        height: 17.11mm;
      "></div>
      <div class="shape" style="
        left: 11.25mm;
        top: 6.46mm;
        width: 15.96mm;
        height: 15.96mm;
      "></div>
      <div class="image-frame" style="
        left: 126.39mm;
        top: 5.89mm;
        width: 10.11mm;
        height: 17.11mm;
        overflow: hidden;
      ">
        <img src="D:/Ecclesia/frontend/src/assets/CSI_Tirunelveli_Diocese_Logo.png" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div class="image-frame" style="
        left: 11.25mm;
        top: 6.46mm;
        width: 15.96mm;
        height: 15.96mm;
        overflow: hidden;
      ">
        <img src="D:/Ecclesia/frontend/src/assets/Church_of_South_India.png" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'tamil-output.pdf',
    width: '148.00mm',
    height: '210.00mm',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });

  await browser.close();
  console.log('PDF generated successfully!');
}

generateTamilPDF().catch(console.error);