import jsPDF from 'jspdf';

export const testPDF = () => {
  try {
    console.log('Creating test PDF...');
    const doc = new jsPDF();
    doc.text('Hello World!', 20, 20);
    doc.save('test.pdf');
    console.log('Test PDF created successfully');
    return true;
  } catch (error) {
    console.error('Test PDF failed:', error);
    return false;
  }
};