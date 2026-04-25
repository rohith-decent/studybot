import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  // Page 1
  const page1 = pdfDoc.addPage();
  const { width, height } = page1.getSize();
  const fontSize = 14;
  page1.drawText('The Solar System: An Overview', {
    x: 50,
    y: height - 4 * fontSize,
    size: 24,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  page1.drawText('The Solar System is the gravitationally bound system of the Sun and the objects that\norbit it. It formed 4.6 billion years ago from the gravitational collapse of a giant\ninterstellar molecular cloud. The vast majority of the system\'s mass is in the Sun,\nwith the majority of the remaining mass contained in Jupiter.', {
    x: 50,
    y: height - 10 * fontSize,
    size: fontSize,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  // Page 2
  const page2 = pdfDoc.addPage();
  page2.drawText('Inner Planets', {
    x: 50,
    y: height - 4 * fontSize,
    size: 20,
    font: timesRomanFont,
  });
  page2.drawText('The inner Solar System includes the four terrestrial planets and the asteroid belt.\nThe four inner planets have dense, rocky compositions, few or no moons, and\nno ring systems. They are composed largely of refractory minerals, such as the\nsilicates, which form their crusts and mantles, and metals, such as iron and\nnickel, which form their cores.', {
    x: 50,
    y: height - 8 * fontSize,
    size: fontSize,
    font: timesRomanFont,
  });
  
  // Page 3
  const page3 = pdfDoc.addPage();
  page3.drawText('Outer Planets', {
    x: 50,
    y: height - 4 * fontSize,
    size: 20,
    font: timesRomanFont,
  });
  page3.drawText('The outer region of the Solar System is home to the giant planets and their\nlarge moons. The four outer planets, also called giant planets or Jovian planets,\ncollectively make up 99% of the mass known to orbit the Sun. Jupiter and Saturn\nare together more than 400 times the mass of Earth and consist overwhelmingly\nof hydrogen and helium.', {
    x: 50,
    y: height - 8 * fontSize,
    size: fontSize,
    font: timesRomanFont,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('dummy.pdf', pdfBytes);
  console.log('dummy.pdf created successfully with 3 pages!');
}

createPdf().catch(console.error);
