// Test script to create a Word document with actual embedded images
import { Document, Paragraph, TextRun, ImageRun, Packer, AlignmentType, Table, TableRow, TableCell, WidthType } from 'docx';
import fs from 'fs';

async function createDocumentWithEmbeddedImages() {
  try {
    // Read a real image file
    let imageBuffer;
    let imageExists = false;
    
    try {
      imageBuffer = fs.readFileSync('real_test_image.png');
      imageExists = true;
      console.log('Using real test image, size:', imageBuffer.length);
    } catch (e) {
      console.log('Real test image not found, creating minimal PNG');
      // Create a minimal valid PNG buffer
      imageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  // 1x1 pixel
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,  // IHDR data
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,  // IDAT chunk
        0x08, 0x99, 0x01, 0x01, 0x00, 0x03, 0x00, 0xFC, 0xFF, 0x03, 0x00, 0x00, 0x02, 0x00, 0x01,  // IDAT data
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND
      ]);
    }

    // Test 1: Simple document with image outside table
    const simpleDoc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Test Document - Image Outside Table', bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                type: 'png',
                transformation: {
                  width: 100,
                  height: 100,
                }
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Image should appear above', italics: true })],
            alignment: AlignmentType.CENTER
          })
        ]
      }]
    });

    const simpleBuffer = await Packer.toBuffer(simpleDoc);
    fs.writeFileSync('test_simple_image.docx', simpleBuffer);
    console.log('Simple test document created:', simpleBuffer.length, 'bytes');

    // Test 2: Document with image inside table cell
    const tableDoc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Test Document - Image Inside Table', bold: true, size: 24 })],
            alignment: AlignmentType.CENTER
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'Column 1', bold: true })],
                      alignment: AlignmentType.CENTER
                    })]
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'Image Column', bold: true })],
                      alignment: AlignmentType.CENTER
                    })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: 'Test observation content here' })],
                    })]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: imageBuffer,
                            type: 'png',
                            transformation: {
                              width: 80,
                              height: 80,
                            }
                          })
                        ],
                        alignment: AlignmentType.CENTER
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: 'test_image.png', size: 14, italics: true })],
                        alignment: AlignmentType.CENTER
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    const tableBuffer = await Packer.toBuffer(tableDoc);
    fs.writeFileSync('test_table_image.docx', tableBuffer);
    console.log('Table test document created:', tableBuffer.length, 'bytes');

    return { simpleSize: simpleBuffer.length, tableSize: tableBuffer.length };

  } catch (error) {
    console.error('Error creating test documents:', error);
    throw error;
  }
}

// Run the test
createDocumentWithEmbeddedImages()
  .then(result => {
    console.log('Test completed successfully:', result);
  })
  .catch(error => {
    console.error('Test failed:', error);
  });