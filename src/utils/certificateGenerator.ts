import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  courseCategory?: string;
  duration?: string;
  issuedAt?: string;
  certificateId?: string;
  instructorName?: string;
  directorName?: string;
}

export async function generateCertificatePDF(data: CertificateData): Promise<Uint8Array> {
  const width = 842; // A4 Landscape
  const height = 595;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const navyDark = rgb(11 / 255, 15 / 255, 25 / 255);
  const deepBlue = rgb(16 / 255, 37 / 255, 114 / 255);
  const primaryCyan = rgb(0 / 255, 217 / 255, 255 / 255);
  const darkGray = rgb(51 / 255, 65 / 255, 85 / 255);
  const lightBg = rgb(252 / 255, 253 / 255, 255 / 255);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: lightBg,
  });

  // Top-Left Corner Geometric Triangles
  page.drawSvgPath(`M 0 0 L 260 0 L 0 260 Z`, {
    x: 0,
    y: height,
    scale: 1,
    color: deepBlue,
  });

  page.drawSvgPath(`M 0 40 L 200 0 L 0 160 Z`, {
    x: 0,
    y: height,
    scale: 1,
    color: primaryCyan,
  });

  // Bottom-Right Corner Geometric Triangles
  page.drawSvgPath(`M 0 0 L 0 260 L -260 260 Z`, {
    x: width,
    y: height - 260,
    scale: 1,
    color: deepBlue,
  });

  page.drawSvgPath(`M 0 100 L 0 260 L -160 260 Z`, {
    x: width,
    y: height - 260,
    scale: 1,
    color: primaryCyan,
  });

  // Inner Frame Border
  page.drawRectangle({
    x: 35,
    y: 35,
    width: width - 70,
    height: height - 70,
    borderColor: rgb(0.85, 0.9, 0.95),
    borderWidth: 1.5,
  });

  const drawCenteredText = (text: string, y: number, size: number, font: any, color: any) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  };

  // 1. Header Title
  drawCenteredText('CERTIFICATE', height - 115, 40, timesBold, deepBlue);
  drawCenteredText('O F   C O M P L E T I O N', height - 145, 15, helveticaBold, deepBlue);
  drawCenteredText('THIS CERTIFICATE IS PROUDLY PRESENTED TO', height - 180, 11, helveticaBold, darkGray);

  // 2. Student Full Name
  const student = data.studentName || 'Verified Scholar';
  drawCenteredText(student, height - 228, 28, helveticaBold, navyDark);

  const nameWidth = helveticaBold.widthOfTextAtSize(student, 28);
  page.drawLine({
    start: { x: (width - Math.max(nameWidth + 80, 320)) / 2, y: height - 238 },
    end: { x: (width + Math.max(nameWidth + 80, 320)) / 2, y: height - 238 },
    thickness: 1.5,
    color: primaryCyan,
  });

  // 3. Sub-heading
  drawCenteredText('IN RECOGNITION OF SUCCESSFULLY COMPLETING THE COURSE', height - 268, 10, helveticaBold, darkGray);

  // 4. Course Title
  const course = data.courseTitle || 'Mastery Certification Curriculum';
  drawCenteredText(course, height - 300, 18, helveticaBold, deepBlue);

  const courseWidth = helveticaBold.widthOfTextAtSize(course, 18);
  page.drawLine({
    start: { x: (width - Math.max(courseWidth + 40, 420)) / 2, y: height - 308 },
    end: { x: (width + Math.max(courseWidth + 40, 420)) / 2, y: height - 308 },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9),
  });

  // 5. Completion Description Paragraph
  drawCenteredText(
    'This certificate is awarded in recognition of the successful completion of the prescribed',
    height - 336,
    10,
    helvetica,
    darkGray
  );
  drawCenteredText(
    'learning program, including the required lessons, practical activities, assessments, and course requirements.',
    height - 350,
    10,
    helvetica,
    darkGray
  );

  const categoryTopic = data.courseCategory || 'Modern Software Engineering';
  drawCenteredText(
    `The recipient has demonstrated commitment to learning and has acquired foundational knowledge`,
    height - 376,
    10,
    helvetica,
    darkGray
  );
  drawCenteredText(
    `and practical skills in ${categoryTopic} through the GlasSea Tech Learning Platform.`,
    height - 390,
    10,
    helvetica,
    darkGray
  );

  // 6. Meta Line
  const duration = data.duration || '8 Weeks';
  const issueDate = data.issuedAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const certId = data.certificateId || `GT-2026-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const metaText = `Course Duration: ${duration}   ||   Date of Completion: ${issueDate}   ||   Certificate ID: ${certId}`;
  drawCenteredText(metaText, height - 428, 9, helveticaBold, deepBlue);

  // 7. Signatures
  const instructorX = 140;
  const instructorY = 110;
  page.drawLine({
    start: { x: instructorX, y: instructorY },
    end: { x: instructorX + 160, y: instructorY },
    thickness: 1,
    color: darkGray,
  });
  const instructor = data.instructorName || 'Dr. Elena Vance';
  page.drawText(instructor, { x: instructorX + 25, y: instructorY + 8, size: 12, font: helveticaBold, color: navyDark });
  page.drawText('Course Instructor', { x: instructorX + 28, y: instructorY - 14, size: 9, font: helvetica, color: darkGray });

  const adminX = width - 300;
  const adminY = 110;
  page.drawLine({
    start: { x: adminX, y: adminY },
    end: { x: adminX + 160, y: adminY },
    thickness: 1,
    color: darkGray,
  });
  const director = data.directorName || 'Engr. Michael Mercer';
  page.drawText(director, { x: adminX + 15, y: adminY + 8, size: 12, font: helveticaBold, color: navyDark });
  page.drawText('Director / Authorized Signatory', { x: adminX + 8, y: adminY - 14, size: 9, font: helvetica, color: darkGray });

  // 8. Footer Brand
  drawCenteredText('GLASSEA TECH', 95, 11, helveticaBold, deepBlue);
  drawCenteredText('Learn. Build. Become.', 82, 9, helvetica, darkGray);

  return await pdfDoc.save();
}

export async function downloadCertificatePDF(data: CertificateData): Promise<void> {
  const pdfBytes = await generateCertificatePDF(data);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (data.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `GLASSEA_Certificate_${safeName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function openCertificatePDFInNewTab(data: CertificateData): Promise<void> {
  const pdfBytes = await generateCertificatePDF(data);
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
