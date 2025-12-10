const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

/**
 * Generate Infant Baptism Certificate PDF
 * @param {Object} certificateData - Certificate data from database
 * @param {Object} churchData - Church data (optional)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateInfantBaptismPDF(certificateData, churchData = null) {
  let browser = null;
  
  try {
    // Paths
    const templatePath = path.join(__dirname, 'templates/infant_baptism_certificate.ejs');
    const fontPath = path.join(__dirname, 'assets/fonts/Vijaya.ttf');
    const imagePath = path.join(__dirname, 'assets/images/baptsm_infant.png');
    
    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'infant_baptism');
    await fs.mkdir(pdfsDir, { recursive: true });
    
    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `infant_baptism_${certificateData.certificate_number}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);
    
    // Read template
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Read and convert background image to base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // Prepare template data
    const templateData = {
      certificate: certificateData,
      church: churchData || { church_name: 'Church' },
      pastorate: certificateData.pastorate_name ? { pastorate_name: certificateData.pastorate_name } : null,
      fontPath: fontPath,
      imageBase64: imageBase64
    };
    
    // Render HTML from EJS template
    const html = ejs.render(templateContent, templateData);
    
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF with landscape A4 format
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
    
    await browser.close();
    browser = null;
    
    return pdfPath;
    
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate Adult Baptism Certificate PDF
 * @param {Object} certificateData - Certificate data from database
 * @param {Object} churchData - Church data (optional)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateAdultBaptismPDF(certificateData, churchData = null) {
  let browser = null;

  try {
    // Paths
    const templatePath = path.join(__dirname, 'templates/adult_baptism_certificate.ejs');
    const fontPath = path.join(__dirname, 'assets/fonts/Vijaya.ttf');
    const imagePath = path.join(__dirname, 'assets/images/baptsm_adult.png');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'adult_baptism');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `adult_baptism_${certificateData.certificate_number}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Read template
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Read and convert background image to base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Prepare template data
    const templateData = {
      certificate: certificateData,
      church: churchData || { church_name: 'Church' },
      pastorate: certificateData.pastorate_name ? { pastorate_name: certificateData.pastorate_name } : null,
      fontPath: fontPath,
      imageBase64: imageBase64
    };

    // Render HTML from EJS template
    const html = ejs.render(templateContent, templateData);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set content and wait for fonts to load
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with landscape A4 format (297mm x 210mm)
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();
    browser = null;

    console.log('Adult Baptism PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Adult Baptism PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate Burial Register PDF
 * @param {Object} registerData - Register data from database
 * @param {Object} churchData - Church data (optional)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateBurialRegisterPDF(registerData, churchData = null) {
  let browser = null;

  try {
    // Paths
    const templatePath = path.join(__dirname, 'templates/burial_register.ejs');
    const fontPath = path.join(__dirname, 'assets/fonts/Vijaya.ttf');
    const imagePath = path.join(__dirname, 'assets/images/burial_reg.png');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'burial_register');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `burial_register_${registerData.certificate_number}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Read template
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Read and convert background image to base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Prepare template data
    const templateData = {
      register: registerData,
      church: churchData || { church_name: 'Church' },
      pastorate: registerData.pastorate_name ? { pastorate_name: registerData.pastorate_name } : null,
      fontPath: fontPath,
      imageBase64: imageBase64
    };

    // Render HTML from EJS template
    const html = ejs.render(templateContent, templateData);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set content and wait for fonts to load
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with landscape A4 format (297mm x 210mm)
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();
    browser = null;

    console.log('Burial Register PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Burial Register PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate Marriage Bans PDF
 * @param {Object} bansData - Marriage bans data from database
 * @param {Object} churchData - Church data (optional)
 * @param {Object} additionalData - Additional data from modal (place, date)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateMarriageBansPDF(bansData, churchData = null, additionalData = {}) {
  let browser = null;

  try {
    // Paths - use correct assets folder
    const csiLogoPath = path.join(__dirname, 'assets/images/Church_of_South_India.png');
    const dioceseLogoPath = path.join(__dirname, 'assets/images/CSI_Tirunelveli_Diocese_Logo.png');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'marriage_bans');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `marriage_bans_${bansData.id}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Verify logo files exist and read them
    let csiLogoBase64 = '';
    let dioceseLogoBase64 = '';
    
    try {
      const csiLogoBuffer = await fs.readFile(csiLogoPath);
      csiLogoBase64 = `data:image/png;base64,${csiLogoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('CSI Logo not found:', csiLogoPath);
    }

    try {
      const dioceseLogoBuffer = await fs.readFile(dioceseLogoPath);
      dioceseLogoBase64 = `data:image/png;base64,${dioceseLogoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Diocese Logo not found:', dioceseLogoPath);
    }

    // Calculate ages from DOB
    const calculateAge = (dob) => {
      if (!dob) return '';
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Prepare dynamic content from marriage record data
    const groomName = bansData.groomName || '';
    const groomStatus = bansData.isGroomBachelor === 'Yes' ? 'bachelor' : 'widower';
    const groomDob = bansData.groomDOB ? new Date(bansData.groomDOB).toLocaleDateString('en-GB') : '';
    const groomAge = calculateAge(bansData.groomDOB);
    const groomProfession = bansData.groomProfession || '';
    const groomFatherName = bansData.groomFatherName || '';
    const groomMotherName = bansData.groomMotherName || '';
    const groomChurch = bansData.groomChurchName || '';
    const groomPastorate = bansData.groomPastorateName || '';

    const brideName = bansData.brideName || '';
    const brideStatus = bansData.isBrideSpinster === 'Yes' ? 'spinster' : 'widow';
    const brideDob = bansData.brideDOB ? new Date(bansData.brideDOB).toLocaleDateString('en-GB') : '';
    const brideAge = calculateAge(bansData.brideDOB);
    const brideProfession = bansData.brideProfession || '';
    const brideFatherName = bansData.brideFatherName || '';
    const brideMotherName = bansData.brideMotherName || '';
    const brideChurch = bansData.brideChurchName || '';
    const bridePastorate = bansData.bridePastorateName || '';

    // Format bans dates
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const firstBansDate = formatDate(bansData.firstBansDate);
    const secondBansDate = formatDate(bansData.secondBansDate);
    const thirdBansDate = formatDate(bansData.thirdBansDate);
    const marriageDate = formatDate(bansData.marriageDate);

    // Church data from church table (for header)
    const dioceseName = 'Church of South India - Tirunelveli Diocese'; // Hardcoded as not in church table
    const pastorateName = churchData?.pastorateName || '';

    // Document date and place from modal
    const documentDate = additionalData.date ? formatDate(additionalData.date) : '';
    const documentPlace = additionalData.place || '';

    // Congregation-based text
    const congregation = bansData.congregation || '';
    console.log('Congregation value:', congregation); // Debug log
    let membershipText = '';
    let impedimentText = '';
    
    if (congregation === 'Bride') {
      membershipText = 'The Bride is of proper age and is a regular member of our Church.';
      impedimentText = 'Bride side';
    } else if (congregation === 'Groom') {
      membershipText = 'The Bridegroom is of proper age and is a regular member of our Church.';
      impedimentText = 'Bridegroom side';
    } else {
      membershipText = 'The Bridegroom and Bride are of proper age and are regular members of our Church.';
      impedimentText = 'Bridegrooms/Bride side';
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
          font-family: 'Times New Roman', serif;
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
      <!-- Main Content Box -->
      <div style="
        position: absolute;
        left: 12.50mm;
        top: 44.00mm;
        width: 122.60mm;
        padding: 3.00mm;
        box-sizing: border-box;
      ">
        <div style="
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: justify;
          line-height: 1.5;
        ">
          <p style="margin-bottom: 8pt; text-indent: 20pt;">A Marriage has been proposed between</p>
          
          <p style="margin-bottom: 8pt; text-indent: 20pt;">Mr. ${groomName}, ${groomStatus}, born on ${groomDob} (age ${groomAge}), ${groomProfession}, son of Mr. ${groomFatherName} and Mrs. ${groomMotherName} of ${groomChurch}, ${groomPastorate}; and Miss ${brideName}, ${brideStatus}, born on ${brideDob} (age ${brideAge}), ${brideProfession}, daughter of Mr. ${brideFatherName} and Mrs. ${brideMotherName} of ${brideChurch}, ${bridePastorate}.</p>

          <p style="margin-bottom: 8pt; text-indent: 20pt;">${membershipText}</p>
          
          <p style="margin-bottom: 8pt; text-indent: 20pt;">I am arranging to Call Banns on <strong>${firstBansDate}</strong>, <strong>${secondBansDate}</strong> and <strong>${thirdBansDate}</strong> and request you to do the same provided there is no impediment on ${impedimentText}.</p>

          <p style="margin-bottom: 12pt;">Date of marriage <strong>${marriageDate}</strong></p>
          
          <!-- Place, Date and Presbyter in same row -->
          <div style="margin-top: 37.5pt; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="flex: 1;">
              <p style="margin-bottom: 4pt;">Place : ${documentPlace}</p>
              <p style="margin-bottom: 0pt;">Date  : ${documentDate}</p>
            </div>
            <div style="flex: 1; text-align: right;">
              <p style="margin-bottom: 0pt;">Presbyter – in charge</p>
            </div>
          </div>
        </div>
      </div>

      <!-- MARRIAGE BANNS NOTICE -->
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
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          color: #FF0000;
          text-align: center;
          text-decoration: underline;
        ">MARRIAGE BANNS NOTICE</div>
      </div>

      <!-- Pastorate Name -->
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
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          color: #FF0000;
          text-align: center;
          text-transform: uppercase;
        ">${pastorateName}</div>
      </div>

      <!-- Diocese Name -->
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
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          color: #00B050;
          text-align: center;
          text-transform: uppercase;
        ">${dioceseName}</div>
      </div>

      ${dioceseLogoBase64 ? `
      <!-- Diocese Logo -->
      <div class="image-frame" style="
        left: 126.39mm;
        top: 5.89mm;
        width: 10.11mm;
        height: 17.11mm;
        overflow: hidden;
      ">
        <img src="${dioceseLogoBase64}" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      ` : ''}

      ${csiLogoBase64 ? `
      <!-- CSI Logo -->
      <div class="image-frame" style="
        left: 11.25mm;
        top: 6.46mm;
        width: 15.96mm;
        height: 15.96mm;
        overflow: hidden;
      ">
        <img src="${csiLogoBase64}" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      ` : ''}
    </body>
    </html>
    `;

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with A5 portrait format (148mm x 210mm)
    await page.pdf({
      path: pdfPath,
      width: '148.00mm',
      height: '210.00mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();
    browser = null;

    console.log('Marriage Bans PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Marriage Bans PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`Marriage Bans PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate Marriage Certificate PDF
 * @param {Object} recordData - Marriage record data from database
 * @param {Object} churchData - Church data (optional)
 * @param {Object} additionalData - Additional data from modal (place, date)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateMarriageCertificatePDF(recordData, churchData = null, additionalData = {}) {
  let browser = null;

  try {
    // Paths - use correct assets folder
    const csiLogoPath = path.join(__dirname, 'assets/images/Church_of_South_India.png');
    const dioceseLogoPath = path.join(__dirname, 'assets/images/CSI_Tirunelveli_Diocese_Logo.png');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'marriage_certificate');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `marriage_certificate_${recordData.id}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Verify logo files exist and read them
    let csiLogoBase64 = '';
    let dioceseLogoBase64 = '';
    
    try {
      const csiLogoBuffer = await fs.readFile(csiLogoPath);
      csiLogoBase64 = `data:image/png;base64,${csiLogoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('CSI Logo not found:', csiLogoPath);
    }

    try {
      const dioceseLogoBuffer = await fs.readFile(dioceseLogoPath);
      dioceseLogoBase64 = `data:image/png;base64,${dioceseLogoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('Diocese Logo not found:', dioceseLogoPath);
    }

    // Calculate ages from DOB
    const calculateAge = (dob) => {
      if (!dob) return '';
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Prepare data
    const groomName = recordData.groomName || '';
    const groomStatus = recordData.isGroomBachelor === 'Yes' ? 'Bachelor' : 'Widower';
    const groomDob = formatDate(recordData.groomDOB);
    const groomAge = calculateAge(recordData.groomDOB);
    const groomProfession = recordData.groomProfession || '';
    const groomFatherName = recordData.groomFatherName || '';
    const groomMotherName = recordData.groomMotherName || '';
    const groomChurch = recordData.groomChurchName || '';
    const groomPastorate = recordData.groomPastorateName || '';

    const brideName = recordData.brideName || '';
    const brideStatus = recordData.isBrideSpinster === 'Yes' ? 'Spinster' : 'Widow';
    const brideDob = formatDate(recordData.brideDOB);
    const brideAge = calculateAge(recordData.brideDOB);
    const brideProfession = recordData.brideProfession || '';
    const brideFatherName = recordData.brideFatherName || '';
    const brideMotherName = recordData.brideMotherName || '';
    const brideChurch = recordData.brideChurchName || '';
    const bridePastorate = recordData.bridePastorateName || '';

    const firstBansDate = formatDate(recordData.firstBansDate);
    const secondBansDate = formatDate(recordData.secondBansDate);
    const thirdBansDate = formatDate(recordData.thirdBansDate);

    // Church data from church table (for header)
    const dioceseName = 'Church of South India - Tirunelveli Diocese'; // Hardcoded as not in church table
    const pastorateName = churchData?.pastorateName || '';

    // Document date and place from modal
    const documentDate = formatDate(additionalData.date);
    const documentPlace = additionalData.place || '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
          font-family: 'Times New Roman', serif;
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
        .image-frame {
          position: absolute;
        }
      </style>
    </head>
    <body>
      <!-- Diocese Name -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 9.0pt;
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          color: #00B050;
          text-align: center;
          text-transform: uppercase;
        ">${dioceseName}</div>
      </div>

      <!-- Pastorate Name -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 11.2pt;
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          color: #FF0000;
          text-align: center;
          text-transform: uppercase;
        ">${pastorateName}</div>
      </div>

      <!-- MARRIAGE CERTIFICATE -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          color: #FF0000;
          text-align: center;
          text-decoration: underline;
        ">MARRIAGE CERTIFICATE</div>
      </div>

      <!-- Main Content -->
      <div style="
        position: absolute;
        left: 12.50mm;
        top: 44.00mm;
        width: 122.60mm;
        padding: 3.00mm;
        box-sizing: border-box;
      ">
        <div style="
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: justify;
          line-height: 1.5;
        ">
          <p style="margin-bottom: 10pt; text-indent: 20pt;">This is to certify that the Banns of marriage between</p>
          
          <p style="margin-bottom: 0pt;">Mr. <strong>${groomName}</strong> ${groomStatus} Date of Birth <strong>${groomDob}</strong> Age <strong>${groomAge}</strong> Profession <strong>${groomProfession}</strong> S/o. Mr. <strong>${groomFatherName}</strong> Mrs. <strong>${groomMotherName}</strong> of <strong>${groomChurch}</strong> in <strong>${groomPastorate}</strong> and Miss. <strong>${brideName}</strong> ${brideStatus} Date of Birth <strong>${brideDob}</strong> Age <strong>${brideAge}</strong> Profession <strong>${brideProfession}</strong> D/o. Mr. <strong>${brideFatherName}</strong> Mrs. <strong>${brideMotherName}</strong> of <strong>${brideChurch}</strong> in <strong>${bridePastorate}</strong> were duly published on <strong>${firstBansDate}</strong>, <strong>${secondBansDate}</strong> & <strong>${thirdBansDate}</strong> and that no impediment was alleged.</p>
          
          <!-- Place, Date and Presbyter in same row -->
          <div style="margin-top: 37.5pt; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="flex: 1;">
              <p style="margin-bottom: 4pt;">Place : ${documentPlace}</p>
              <p style="margin-bottom: 0pt;">Date  : ${documentDate}</p>
            </div>
            <div style="flex: 1; text-align: right;">
              <p style="margin-bottom: 0pt;">Presbyter – in charge</p>
            </div>
          </div>
        </div>
      </div>

      ${dioceseLogoBase64 ? `
      <!-- Diocese Logo -->
      <div class="image-frame" style="
        left: 126.39mm;
        top: 5.89mm;
        width: 10.11mm;
        height: 17.11mm;
        overflow: hidden;
      ">
        <img src="${dioceseLogoBase64}" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      ` : ''}

      ${csiLogoBase64 ? `
      <!-- CSI Logo -->
      <div class="image-frame" style="
        left: 11.25mm;
        top: 6.46mm;
        width: 15.96mm;
        height: 15.96mm;
        overflow: hidden;
      ">
        <img src="${csiLogoBase64}" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      ` : ''}
    </body>
    </html>
    `;

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with A5 portrait format (148mm x 210mm)
    await page.pdf({
      path: pdfPath,
      width: '148.00mm',
      height: '210.00mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();
    browser = null;

    console.log('Marriage Certificate PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Marriage Certificate PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`Marriage Certificate PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate Letterhead PDF
 * @param {Object} letterheadData - Letterhead data from database
 * @param {Object} churchData - Church data (optional)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateLetterheadPDF(letterheadData, churchData = null) {
  let browser = null;

  try {
    // Paths
    const templatePath = path.join(__dirname, 'templates/letterpad.ejs');
    const fontPath = path.join(__dirname, 'assets/fonts/Vijaya.ttf');
    const csiLogoPath = path.join(__dirname, 'assets/images/Church_of_South_India.png');
    const dioceseLogoPath = path.join(__dirname, 'assets/images/CSI_Tirunelveli_Diocese_Logo.png');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'letterheads');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `letterhead_${letterheadData.letterhead_number}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Read template
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Read and convert logos to base64
    const csiLogoBuffer = await fs.readFile(csiLogoPath);
    const csiLogoBase64 = `data:image/png;base64,${csiLogoBuffer.toString('base64')}`;

    const dioceseLogoBuffer = await fs.readFile(dioceseLogoPath);
    const dioceseLogoBase64 = `data:image/png;base64,${dioceseLogoBuffer.toString('base64')}`;

    // Prepare template data
    const templateData = {
      letterpad: {
        ...letterheadData,
        letterpad_number: letterheadData.letterhead_number
      },
      pastorate: churchData || { pastorate_name: 'Church' },
      pastorateSettings: {
        diocese_name_english: 'Church of South India - Tirunelveli Diocese'
      },
      fontPath: fontPath,
      csiLogoBase64: csiLogoBase64,
      dioceseLogoBase64: dioceseLogoBase64,
      formatDate: (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    };

    // Render HTML from EJS template
    const html = ejs.render(templateContent, templateData);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with A4 portrait format
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();
    browser = null;

    console.log('Letterhead PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Letterhead PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

/**
 * Generate Birthday List PDF
 * @param {Object} params - Parameters for birthday list
 * @param {Object} churchData - Church data
 * @param {Array} birthdayData - Array of birthday members with family data
 * @param {Object} dateRange - Date range {fromDate, toDate}
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateBirthdayListPDF(params) {
  let browser = null;

  try {
    const { churchData, birthdayData, dateRange } = params;

    // Paths
    const templatePath = path.join(__dirname, 'templates/birthdaylist.ejs');
    const fontPath = path.join(__dirname, 'assets/fonts/Vijaya.ttf');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'birthday_list');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `birthday_list_${dateRange.fromDate}_to_${dateRange.toDate}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Read template
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Prepare template data
    const templateData = {
      church: churchData,
      reportData: birthdayData,
      dateRange: dateRange,
      fontPath: fontPath
    };

    // Render HTML from EJS template
    const html = ejs.render(templateContent, templateData);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with A4 portrait format
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();
    browser = null;

    return pdfPath;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw new Error(`Birthday List PDF generation failed: ${error.message}`);
  }
}

/**
 * Open PDF file with default system viewer
 * @param {string} pdfPath - Path to PDF file
 */
/**
 * Generate Wedding List PDF
 * @param {Object} params - Parameters object
 * @param {Object} churchData - Church data
 * @param {Array} weddingData - Array of wedding members with family data
 * @param {Object} dateRange - Date range {fromDate, toDate}
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateWeddingListPDF(params) {
  let browser = null;

  try {
    const { churchData, weddingData, dateRange } = params;

    // Paths
    const templatePath = path.join(__dirname, 'templates/weddinglist.ejs');
    const fontPath = path.join(__dirname, 'assets/fonts/Vijaya.ttf');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'wedding_list');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `wedding_list_${dateRange.fromDate}_to_${dateRange.toDate}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Read template
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Prepare template data
    const templateData = {
      church: churchData,
      reportData: weddingData,
      dateRange: dateRange,
      fontPath: fontPath
    };

    // Render HTML from EJS template
    const html = ejs.render(templateContent, templateData);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    browser = null;

    return pdfPath;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

async function openPDF(pdfPath) {
  const { shell } = require('electron');
  await shell.openPath(pdfPath);
}

/**
 * Generate Marriage Schedule 4 PDF
 * @param {Object} recordData - Marriage record data from database
 * @param {Object} additionalData - Additional data from modal (surnames, residences, month, church)
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateMarriageSchedule4PDF(recordData, additionalData = {}) {
  let browser = null;

  try {
    // Paths
    const imagePath = path.join(__dirname, 'assets/images/shedule4.png');

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'marriage_schedule4');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `marriage_schedule4_${recordData.serialNumber}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Read and convert background image to base64
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;

    // Helper functions
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const getDayName = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    };

    const getMonthName = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return months[date.getMonth()];
    };

    const calculateAge = (dob) => {
      if (!dob) return '';
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    // Extract date components
    const marriageDate = new Date(recordData.marriageDate);
    const day = marriageDate.getDate();
    const dayName = getDayName(recordData.marriageDate).toUpperCase();
    const month = marriageDate.getMonth() + 1;
    const monthName = getMonthName(recordData.marriageDate).toUpperCase();
    const year = marriageDate.getFullYear();

    // Calculate ages
    const groomAge = calculateAge(recordData.groomDOB);
    const groomDOBFormatted = formatDate(recordData.groomDOB);
    const brideAge = calculateAge(recordData.brideDOB);
    const brideDOBFormatted = formatDate(recordData.brideDOB);

    // Status mapping
    const groomStatus = recordData.isGroomBachelor === 'Yes' ? 'BACHELOR' : 'WIDOWER';
    const brideStatus = recordData.isBrideSpinster === 'Yes' ? 'SPINSTER' : 'WIDOW';

    // Additional data from modal - Convert to UPPERCASE
    const groomSurname = (additionalData.groomSurname || '-').toUpperCase();
    const brideSurname = (additionalData.brideSurname || '-').toUpperCase();
    const groomResidence = (additionalData.groomResidence || '').toUpperCase();
    const brideResidence = (additionalData.brideResidence || '').toUpperCase();
    const monthYearText = additionalData.monthYear || `${monthName} ${year}`;
    const churchName = additionalData.churchName || recordData.weddingPlace || '';

    // Format bans dates
    const firstBansDate = formatDate(recordData.firstBansDate);
    const secondBansDate = formatDate(recordData.secondBansDate);
    const thirdBansDate = formatDate(recordData.thirdBansDate);
    
    // Convert names and professions to UPPERCASE
    const groomNameUpper = (recordData.groomName || '').toUpperCase();
    const brideNameUpper = (recordData.brideName || '').toUpperCase();
    const groomProfessionUpper = (recordData.groomProfession || '').toUpperCase();
    const brideProfessionUpper = (recordData.brideProfession || '').toUpperCase();
    const groomFatherNameUpper = (recordData.groomFatherName || '').toUpperCase();
    const brideFatherNameUpper = (recordData.brideFatherName || '').toUpperCase();
    const solemnizedByUpper = (recordData.solemnizedBy || '').toUpperCase();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
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
          font-family: 'Times New Roman', serif;
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
        .image-frame {
          position: absolute;
        }
      </style>
    </head>
    <body>
      <!-- Background Image -->
      <div class="image-frame" style="
        left: 0.00mm;
        top: 0.00mm;
        width: 297.00mm;
        height: 210.00mm;
        overflow: hidden;
      ">
        <img src="${imageBase64}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>

      <!-- Serial Number (12) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${recordData.serialNumber || ''}</div>
      </div>

      <!-- Date (22 Monday) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${day} (${dayName})</div>
      </div>

      <!-- Month (05 May) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${String(month).padStart(2, '0')} (${monthName})</div>
      </div>

      <!-- Year (2025) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${year}</div>
      </div>

      <!-- Groom Name -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomNameUpper}</div>
      </div>

      <!-- Groom Surname (Previous Status) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomSurname}</div>
      </div>

      <!-- Groom Age (29 13-10-1997) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomAge} (${groomDOBFormatted})</div>
      </div>

      <!-- Groom Status (BACHELOR) -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomStatus}</div>
      </div>

      <!-- Groom Profession -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomProfessionUpper}</div>
      </div>

      <!-- Groom Residence -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomResidence}</div>
      </div>

      <!-- Groom Father Name -->
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
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${groomFatherNameUpper}</div>
      </div>

      <!-- Bride Name -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideNameUpper}</div>
      </div>

      <!-- Bride Surname (Previous Status) -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideSurname}</div>
      </div>

      <!-- Bride Age (22 22-09-2022) -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideAge} (${brideDOBFormatted})</div>
      </div>

      <!-- Bride Status (SPINSTER) -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideStatus}</div>
      </div>

      <!-- Bride Profession -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideProfessionUpper}</div>
      </div>

      <!-- Bride Residence -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideResidence}</div>
      </div>

      <!-- Bride Father Name -->
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
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: center;
        ">${brideFatherNameUpper}</div>
      </div>

      <!-- Church & Month Info (NOT UPPERCASE) -->
      <div class="text-frame" style="
        left: 96.00mm;
        top: 31.95mm;
        width: 191.00mm;
        height: 8.38mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: left;
        ">${churchName} during the month ending of ${monthYearText}</div>
      </div>

      <!-- First Bans Date -->
      <div class="text-frame" style="
        left: 244.10mm;
        top: 10.00mm;
        width: 38.90mm;
        height: 5.30mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: left;
        ">${firstBansDate}</div>
      </div>

      <!-- Second Bans Date -->
      <div class="text-frame" style="
        left: 244.10mm;
        top: 17.10mm;
        width: 38.90mm;
        height: 5.30mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: left;
        ">${secondBansDate}</div>
      </div>

      <!-- Third Bans Date -->
      <div class="text-frame" style="
        left: 244.10mm;
        top: 24.20mm;
        width: 38.90mm;
        height: 5.30mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: left;
        ">${thirdBansDate}</div>
      </div>

      <!-- Presbyter Signature -->
      <div class="text-frame" style="
        left: 68.45mm;
        top: 144.00mm;
        width: 93.87mm;
        height: 7.40mm;
      ">
        <div class="text-content" style="
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: flex-start;
          font-size: 12.0pt;
          font-family: 'Times New Roman', serif;
          color: #000000;
          text-align: left;
        ">${solemnizedByUpper}</div>
      </div>
    </body>
    </html>
    `;

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with landscape A4 format (297mm x 210mm)
    await page.pdf({
      path: pdfPath,
      width: '297.00mm',
      height: '210.00mm',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();
    browser = null;

    console.log('Marriage Schedule 4 PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Marriage Schedule 4 PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`Marriage Schedule 4 PDF generation failed: ${error.message}`);
  }
}

module.exports = {
  generateInfantBaptismPDF,
  generateAdultBaptismPDF,
  generateBurialRegisterPDF,
  generateMarriageBansPDF,
  generateMarriageCertificatePDF,
  generateLetterheadPDF,
  generateBirthdayListPDF,
  generateWeddingListPDF,
  generateSabaiJabithaPDF,
  generateMarriageSchedule4PDF,
  generatePCCashBookPDF,
  openPDF
};

/**
 * Generate PC Cash Book PDF
 * @param {Object} reportData - Report data
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generatePCCashBookPDF(reportData) {
  let browser = null;

  try {
    const templatePath = path.join(__dirname, 'templates/pc_cash_book.ejs');
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'pc_cash_book');
    await fs.mkdir(pdfsDir, { recursive: true });

    const timestamp = new Date().getTime();
    const pdfFilename = `pc_cash_book_${reportData.month}_${reportData.year}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const html = ejs.render(templateContent, { reportData });

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();
    browser = null;

    return pdfPath;
  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`PC Cash Book PDF generation failed: ${error.message}`);
  }
}



/**
 * Generate Sabai Jabitha (Congregation Members Register) PDF
 * @param {number} churchId - Church ID
 * @param {string} year - Year range (e.g., "2025-2026")
 * @param {Object} churchData - Church data
 * @returns {Promise<string>} - Path to generated PDF
 */
async function generateSabaiJabithaPDF(churchId, year, churchData = null) {
  let browser = null;

  try {
    const { getAllAreas, getAreasByChurch } = require('./database');
    const { getFamiliesByArea } = require('./database');
    const { getMembersByFamily } = require('./database');

    // Get all areas for the church
    const areas = await getAreasByChurch(churchId);
    
    if (areas.length === 0) {
      throw new Error('No areas found for this church');
    }

    // Collect all families and members organized by area
    const reportData = [];
    let maleSerialNumber = 1;
    let femaleSerialNumber = 1;
    let childSerialNumber = 1;

    for (const area of areas) {
      const families = await getFamiliesByArea(area.id);
      
      for (const family of families) {
        const members = await getMembersByFamily(family.id);
        
        // Sort members by member number
        members.sort((a, b) => {
          const numA = parseInt(a.memberNumber) || 0;
          const numB = parseInt(b.memberNumber) || 0;
          return numA - numB;
        });

        // Add family data with members and assign serial numbers based on category
        reportData.push({
          area: area, // Pass full area object to access areaId
          family: family,
          members: members.map(member => {
            const age = member.age || 0;
            let serialNumber;
            
            // Assign serial number based on category
            if (age >= 1 && age <= 15) {
              serialNumber = childSerialNumber++;
            } else if (member.sex === 'Male') {
              serialNumber = maleSerialNumber++;
            } else if (member.sex === 'Female') {
              serialNumber = femaleSerialNumber++;
            } else {
              serialNumber = ''; // No category
            }
            
            return {
              ...member,
              serialNumber: serialNumber,
              ageGroup: getAgeGroup(member.age)
            };
          })
        });
      }
    }

    // Create PDFs directory in userData
    const userDataPath = app.getPath('userData');
    const pdfsDir = path.join(userDataPath, 'pdfs', 'sabai_jabitha');
    await fs.mkdir(pdfsDir, { recursive: true });

    // Generate PDF filename
    const timestamp = new Date().getTime();
    const pdfFilename = `sabai_jabitha_${churchId}_${timestamp}.pdf`;
    const pdfPath = path.join(pdfsDir, pdfFilename);

    // Generate HTML
    const html = generateSabaiJabithaHTML(reportData, churchData, year);

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF with A4 portrait format
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    await browser.close();
    browser = null;

    console.log('Sabai Jabitha PDF generated successfully:', pdfPath);
    return pdfPath;

  } catch (error) {
    console.error('Error generating Sabai Jabitha PDF:', error);
    if (browser) {
      await browser.close();
    }
    throw new Error(`Sabai Jabitha PDF generation failed: ${error.message}`);
  }
}

/**
 * Helper function to determine age group
 */
function getAgeGroup(age) {
  if (!age) return '';
  if (age >= 1 && age <= 15) return '1-15';
  if (age >= 16 && age <= 35) return '16-35';
  if (age > 35) return '35+';
  return '';
}

/**
 * Generate HTML for Sabai Jabitha report with pagination
 */
function generateSabaiJabithaHTML(reportData, churchData, year) {
  const churchName = churchData?.churchName || 'Church';
  const pastorateName = churchData?.pastorateName || '';
  const fullChurchName = pastorateName ? `${churchName} - ${pastorateName}` : churchName;
  
  const HEADER_HEIGHT_FIRST = 74.25; // Height of header section on first page
  const HEADER_HEIGHT_OTHER = 44.25; // Height of header section on other pages (30mm less)
  const PAGE_HEIGHT = 284.30; // Total usable height on page
  const ROW_HEIGHT = 9; // Height per member row
  
  // Split families into pages
  const pages = [];
  let currentPage = { families: [], currentTop: HEADER_HEIGHT_FIRST, isFirstPage: true };
  
  for (const familyData of reportData) {
    const { area, family, members } = familyData;
    const familyHeight = members.length * ROW_HEIGHT;
    
    // Check if family fits on current page
    if (currentPage.currentTop + familyHeight > PAGE_HEIGHT) {
      // Start new page
      pages.push(currentPage);
      currentPage = { families: [], currentTop: HEADER_HEIGHT_OTHER, isFirstPage: false };
    }
    
    // Add family to current page
    currentPage.families.push({
      ...familyData,
      startTop: currentPage.currentTop
    });
    currentPage.currentTop += familyHeight;
  }
  
  // Add last page
  if (currentPage.families.length > 0) {
    pages.push(currentPage);
  }
  
  // Generate HTML for all pages
  let pagesHTML = '';
  
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const isFirstPage = page.isFirstPage;
    
    let memberRows = '';
    let horizontalLines = '';
    
    for (const familyData of page.families) {
      const { area, family, members, startTop } = familyData;
      const familyNumber = `${area.areaId}${family.familyNumber}`;
      let currentTop = startTop; // Use the pre-calculated startTop (already accounts for header height)
      const familyStartTop = currentTop;

      // Add members
      for (let i = 0; i < members.length; i++) {
      const member = members[i];
      
      // Determine color based on age and gender
      const memberAge = member.age || 0;
      let textColor = '#000000'; // Default black
      if (memberAge >= 1 && memberAge <= 15) {
        textColor = '#008000'; // Green for children
      } else if (member.sex === 'Male') {
        textColor = '#0000FF'; // Blue for males
      } else if (member.sex === 'Female') {
        textColor = '#FF0000'; // Red for females
      }
      
      // Relation (with color)
      memberRows += `
        <div class="text-frame" style="left: 21.48mm; top: ${currentTop}mm; width: 14.70mm; height: 9.00mm;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 10.0pt; font-family: 'Vijaya'; color: ${textColor}; text-align: center;">
            ${member.relation || ''}
          </div>
        </div>
      `;

      // Name (with color)
      memberRows += `
        <div class="text-frame" style="left: 37.00mm; top: ${currentTop}mm; width: 75.28mm; height: 4.50mm;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-size: 12.0pt; font-family: 'Vijaya'; color: ${textColor}; text-align: left;">
            ${member.respect}. ${member.name}
          </div>
        </div>
      `;

      // Aadhaar Number - show actual number or leave empty
      memberRows += `
        <div class="text-frame" style="left: 36.49mm; top: ${currentTop + 4.5}mm; width: 75.28mm; height: 4.50mm;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: left;">
            ${member.aadharNumber || ''}
          </div>
        </div>
      `;

      // Age (வயது) - positioned in the appropriate age group column based on age
      let ageColumnLeft = '';
      if (memberAge >= 1 && memberAge <= 15) {
        ageColumnLeft = '124.86mm'; // 1-15 column
      } else if (memberAge >= 16 && memberAge <= 35) {
        ageColumnLeft = '133.12mm'; // 16-35 column
      } else if (memberAge > 35) {
        ageColumnLeft = '141.91mm'; // 35+ column
      }
      
      if (ageColumnLeft) {
        memberRows += `
          <div class="text-frame" style="left: ${ageColumnLeft}; top: ${currentTop + 4}mm; margin-left: -8.79mm; margin-top: -4.03mm; width: 17.58mm; height: 8.05mm; transform: rotate(-90.0deg); transform-origin: center center;">
            <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: ${textColor}; text-align: center;">
              ${memberAge}
            </div>
          </div>
        `;
      }

      // Gender (ஆ.பெ.பி) - ஆ for Male, பெ for Female, பி for Child (1-15 years) - with color
      let gender = '';
      if (memberAge >= 1 && memberAge <= 15) {
        gender = 'பி'; // Child
      } else if (member.sex === 'Male') {
        gender = 'ஆ'; // Male
      } else if (member.sex === 'Female') {
        gender = 'பெ'; // Female
      }
      
      memberRows += `
        <div class="text-frame" style="left: 150.47mm; top: ${currentTop + 4}mm; margin-left: -8.79mm; margin-top: -4.03mm; width: 17.58mm; height: 8.05mm; transform: rotate(-90.0deg); transform-origin: center center;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: ${textColor}; text-align: center;">
            ${gender}
          </div>
        </div>
      `;

      // Serial Number (வரிசை எண்)
      memberRows += `
        <div class="text-frame" style="left: 158.99mm; top: ${currentTop + 4}mm; margin-left: -8.79mm; margin-top: -4.03mm; width: 17.58mm; height: 8.05mm; transform: rotate(-90.0deg); transform-origin: center center;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">
            ${member.serialNumber}
          </div>
        </div>
      `;

      // Baptism (ஞானஸ்நானம்) - Show X if baptised (rotated 90 degrees, 75% size)
      const isBaptised = member.isBaptised === true || member.isBaptised === 'true' || member.isBaptised === 'yes';
      const baptismMark = isBaptised ? 'X' : '';
      
      console.log(`Member: ${member.name}, isBaptised:`, member.isBaptised, 'baptismMark:', baptismMark); // Debug log
      
      memberRows += `
        <div class="text-frame" style="left: 167.53mm; top: ${currentTop + 4}mm; margin-left: -8.79mm; margin-top: -4.03mm; width: 17.58mm; height: 8.05mm; transform: rotate(-90.0deg); transform-origin: center center;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 13.5pt; font-family: Arial, sans-serif; font-weight: bold; color: #000000; text-align: center;">
            ${baptismMark}
          </div>
        </div>
      `;

      // Confirmation (இராபோஜனம்) - Show X if confirmed (rotated 90 degrees, 75% size)
      const isConfirmed = member.isConfirmed === true || member.isConfirmed === 'true' || member.isConfirmed === 'yes';
      const confirmationMark = isConfirmed ? 'X' : '';
      
      memberRows += `
        <div class="text-frame" style="left: 176.13mm; top: ${currentTop + 4}mm; margin-left: -8.79mm; margin-top: -4.03mm; width: 17.58mm; height: 8.05mm; transform: rotate(-90.0deg); transform-origin: center center;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 13.5pt; font-family: Arial, sans-serif; font-weight: bold; color: #000000; text-align: center;">
            ${confirmationMark}
          </div>
        </div>
      `;

      // Congregation Participation (அயலிடம்) - Show X if participating (rotated 90 degrees, 75% size)
      const hasCongregationParticipation = member.congregationParticipation === true || member.congregationParticipation === 'true' || member.congregationParticipation === 'yes';
      const congregationMark = hasCongregationParticipation ? 'X' : '';
      
      memberRows += `
        <div class="text-frame" style="left: 184.50mm; top: ${currentTop + 4}mm; margin-left: -8.79mm; margin-top: -4.03mm; width: 17.58mm; height: 8.05mm; transform: rotate(-90.0deg); transform-origin: center center;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 13.5pt; font-family: Arial, sans-serif; font-weight: bold; color: #000000; text-align: center;">
            ${congregationMark}
          </div>
        </div>
      `;

      // Add horizontal line after each member (from relation to notes, NOT including family number)
      const lineTop = currentTop + 9;
      horizontalLines += `<line x1="21.30mm" y1="${lineTop}mm" x2="197.14mm" y2="${lineTop}mm" stroke="#000000" stroke-width="0.35mm" />`;

      currentTop += 9; // Move to next row
    }

      // Add family number centered across all members
      const familyHeight = members.length * ROW_HEIGHT;
      memberRows += `
        <div class="text-frame" style="left: 12.70mm; top: ${familyStartTop}mm; width: 8.60mm; height: ${familyHeight}mm;">
          <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 11.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">
            ${familyNumber}
          </div>
        </div>
      `;

      // Add horizontal line after family (from family number to notes)
      horizontalLines += `<line x1="12.70mm" y1="${currentTop}mm" x2="197.14mm" y2="${currentTop}mm" stroke="#000000" stroke-width="0.35mm" />`;
    }
    
    // Generate page HTML
    pagesHTML += generatePageHTML(memberRows, horizontalLines, fullChurchName, year, isFirstPage);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @font-face {
          font-family: 'Vijaya';
          src: local('Vijaya');
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        @page {
          size: A4;
          margin: 0;
        }
        body {
          width: 210.00mm;
          position: relative;
        }
        .page {
          width: 210.00mm;
          height: 297.00mm;
          position: relative;
          page-break-after: always;
          overflow: hidden;
        }
        .page:last-child {
          page-break-after: auto;
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
      </style>
    </head>
    <body>
      ${pagesHTML}
    </body>
    </html>
  `;
}

/**
 * Generate HTML for a single page
 */
function generatePageHTML(memberRows, horizontalLines, fullChurchName, year, isFirstPage) {
  // Title and note only on first page
  const titleSection = isFirstPage ? `
    <!-- Title -->
    <div class="text-frame" style="left: 12.70mm; top: 16.95mm; width: 184.60mm; height: 8.05mm;">
      <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; font-size: 24.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">
        சபை அங்கத்தினர் ஜாபிதா
      </div>
    </div>

    <!-- Note -->
    <div class="text-frame" style="left: 11.00mm; top: 26.00mm; width: 184.60mm; height: 5.75mm;">
      <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">
        ( ஒவ்வொரு குடும்பத்தினர்க்கும் அடுத்த குடும்பத்திற்கும் இடையில் 4 கோடுகள் விடப்படவும் )
      </div>
    </div>

    <!-- Church Name -->
    <div class="text-frame" style="left: 15.00mm; top: 32.25mm; width: 180mm; height: 4.25mm;">
      <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; align-items: flex-start; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: left;">
        சபை : ${fullChurchName}
      </div>
    </div>

    <!-- Year -->
    <div class="text-frame" style="left: 113.75mm; top: 37.25mm; width: 83.60mm; height: 5.75mm;">
      <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">
        ${year}
      </div>
    </div>
  ` : '';

  // Adjust vertical positions based on whether it's first page or not
  // On non-first pages, move everything up by 30mm to eliminate empty space
  const topOffset = isFirstPage ? 0 : -30;
  
  return `
    <div class="page">
      ${titleSection}

      <!-- Column Headers -->
      <div class="text-frame" style="left: 17.02mm; top: ${58.87 + topOffset}mm; margin-left: -15.21mm; margin-top: -4.11mm; width: 30.41mm; height: 8.21mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">குடும்ப எண்</div>
      </div>
      <div class="text-frame" style="left: 29.01mm; top: ${58.91 + topOffset}mm; margin-left: -15.34mm; margin-top: -7.17mm; width: 30.67mm; height: 14.33mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">இனமுறை</div>
      </div>
      <div class="text-frame" style="left: 36.32mm; top: ${43.68 + topOffset}mm; width: 75.85mm; height: 30.39mm;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">பெயர் மற்றும் ஆதார் எண்<br/>(பெயர் ஆதார் அட்டையில் உள்ளபடி)</div>
      </div>
      <div class="text-frame" style="left: 116.46mm; top: ${59.09 + topOffset}mm; margin-left: -15.34mm; margin-top: -4.11mm; width: 30.67mm; height: 8.21mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">சங்கம் ${year}</div>
      </div>
      <div class="text-frame" style="left: 120.75mm; top: ${43.93 + topOffset}mm; width: 25.57mm; height: 7.20mm;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">வயது</div>
      </div>
      <div class="text-frame" style="left: 124.86mm; top: ${62.77 + topOffset}mm; margin-left: -11.47mm; margin-top: -4.07mm; width: 22.95mm; height: 8.13mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">1-15</div>
      </div>
      <div class="text-frame" style="left: 133.34mm; top: ${62.60 + topOffset}mm; margin-left: -11.47mm; margin-top: -4.07mm; width: 22.95mm; height: 8.13mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">16-35</div>
      </div>
      <div class="text-frame" style="left: 141.91mm; top: ${62.60 + topOffset}mm; margin-left: -11.47mm; margin-top: -4.07mm; width: 22.95mm; height: 8.13mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">35க்கு மேல்</div>
      </div>
      <div class="text-frame" style="left: 150.32mm; top: ${59.00 + topOffset}mm; margin-left: -15.07mm; margin-top: -4.17mm; width: 30.15mm; height: 8.35mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">ஆ.பெ.பி</div>
      </div>
      <div class="text-frame" style="left: 158.93mm; top: ${59.07 + topOffset}mm; margin-left: -15.07mm; margin-top: -4.17mm; width: 30.15mm; height: 8.35mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">வரிசை எண்</div>
      </div>
      <div class="text-frame" style="left: 167.53mm; top: ${59.00 + topOffset}mm; margin-left: -15.07mm; margin-top: -4.17mm; width: 30.15mm; height: 8.35mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">ஞானஸ்நானம்</div>
      </div>
      <div class="text-frame" style="left: 176.13mm; top: ${59.35 + topOffset}mm; margin-left: -15.07mm; margin-top: -4.17mm; width: 30.15mm; height: 8.35mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">இராபோஜனம்</div>
      </div>
      <div class="text-frame" style="left: 184.50mm; top: ${59.00 + topOffset}mm; margin-left: -15.07mm; margin-top: -4.17mm; width: 30.15mm; height: 8.35mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">அயலிடம்</div>
      </div>
      <div class="text-frame" style="left: 192.88mm; top: ${58.82 + topOffset}mm; margin-left: -15.07mm; margin-top: -4.17mm; width: 30.15mm; height: 8.35mm; transform: rotate(-90.0deg); transform-origin: center center;">
        <div class="text-content" style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; font-size: 12.0pt; font-family: 'Vijaya'; color: #000000; text-align: center;">குறிப்புகள்</div>
      </div>

      <!-- Border -->
      <div class="shape" style="left: 12.70mm; top: 12.70mm; width: 184.60mm; height: 271.60mm; border: 0.35mm solid #000000;"></div>

      <!-- Horizontal Lines -->
      <svg class="line" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;">
        <line x1="12.92mm" y1="${36.50 + topOffset}mm" x2="197.06mm" y2="${36.50 + topOffset}mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="12.92mm" y1="${43.75 + topOffset}mm" x2="197.12mm" y2="${43.75 + topOffset}mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="120.40mm" y1="${51.30 + topOffset}mm" x2="145.97mm" y2="${51.30 + topOffset}mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="12.92mm" y1="${74.25 + topOffset}mm" x2="197.14mm" y2="${74.25 + topOffset}mm" stroke="#000000" stroke-width="0.35mm" />
        ${horizontalLines}
      </svg>

      <!-- Vertical Lines -->
      <svg class="line" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none;">
        <line x1="21.30mm" y1="${43.68 + topOffset}mm" x2="21.30mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="36.00mm" y1="${43.75 + topOffset}mm" x2="36.00mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="112.18mm" y1="${36.32 + topOffset}mm" x2="112.18mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="120.58mm" y1="${43.57 + topOffset}mm" x2="120.58mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="129.10mm" y1="${51.12 + topOffset}mm" x2="129.10mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="137.62mm" y1="${51.12 + topOffset}mm" x2="137.62mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="146.15mm" y1="${43.57 + topOffset}mm" x2="146.15mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="154.67mm" y1="${43.57 + topOffset}mm" x2="154.67mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="163.19mm" y1="${43.57 + topOffset}mm" x2="163.19mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="171.72mm" y1="${43.57 + topOffset}mm" x2="171.72mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="180.24mm" y1="${43.57 + topOffset}mm" x2="180.24mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
        <line x1="188.76mm" y1="${43.57 + topOffset}mm" x2="188.76mm" y2="284.30mm" stroke="#000000" stroke-width="0.35mm" />
      </svg>

      <!-- Member Rows -->
      ${memberRows}
    </div>
  `;
}


