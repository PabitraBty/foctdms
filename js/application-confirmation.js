// application-confirmation.js

document.addEventListener('DOMContentLoaded', () => {
  // Get application data from sessionStorage (set after form submit)
  const appData = sessionStorage.getItem('applicationData');

  if (!appData) {
    alert('No application data found. Redirecting to dashboard.');
    window.location.href = 'dashboard.html';
    return;
  }

  // Parse data
  const data = JSON.parse(appData);

  // Applicant name: from sessionStorage (set in dashboard.js), fallback to CURRENT_USER, then default
  const applicantName =
    sessionStorage.getItem('applicationUsername') ||
    (typeof window.CURRENT_USER !== 'undefined' && window.CURRENT_USER) ||
    'Faculty Member';

    // Determine application type and whether it's a Leave application
const applicationType = data.application_type || 'Leave Application';
const isLeave =
  applicationType.toLowerCase().includes('leave'); // true for "Leave", "Leave Application", "Health Leave", etc.


  // ----------------- PREVIEW FILL -----------------
  document.getElementById('previewApplicant').textContent = applicantName;
  document.getElementById('previewType').textContent = applicationType;
  document.getElementById('previewTitle').textContent = data.application_title || '—';
  document.getElementById('previewDetails').textContent = data.application_details || '—';
  document.getElementById('previewStartDate').textContent = data.start_date || '—';
  document.getElementById('previewEndDate').textContent = data.end_date || '—';
  document.getElementById('previewClassCount').textContent = data.class_count || '—';

  // Hide Leave-only fields for non-leave applications (Job, Internship, Other)
if (!isLeave) {
  const sdRow = document.getElementById('previewStartDate')?.closest('.detail-row');
  const edRow = document.getElementById('previewEndDate')?.closest('.detail-row');
  const ccRow = document.getElementById('previewClassCount')?.closest('.detail-row');

  if (sdRow) sdRow.style.display = 'none';
  if (edRow) edRow.style.display = 'none';
  if (ccRow) ccRow.style.display = 'none';
}


  // --------- CLASS SCHEDULE PREVIEW (TABLE) ----------
    const scheduleDiv = document.getElementById('previewSchedule');
    if (isLeave && data.class_schedule && Array.isArray(data.class_schedule) && data.class_schedule.length > 0) {
    const rowsHtml = data.class_schedule
      .map((cls, idx) => {
        const className = cls.className || cls.class_name || '—';
        const section = cls.section || '—';
        const date = cls.date || '—';
        const time = cls.time || '—';
        const subject = cls.subject || '—';
        const teacher = cls.teacher || '—';

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${className}</td>
            <td>${section}</td>
            <td>${date}</td>
            <td>${time}</td>
            <td>${subject}</td>
            <td>${teacher}</td>
          </tr>
        `;
      })
      .join('');

    scheduleDiv.innerHTML = `
      <table class="schedule-table-preview">
        <thead>
          <tr>
            <th>No.</th>
            <th>Class Name</th>
            <th>Section</th>
            <th>Date</th>
            <th>Time</th>
            <th>Subject</th>
            <th>Assigned Teacher</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
} else {
  // For non-leave apps, hide the whole right section
  if (!isLeave) {
    const scheduleSection = scheduleDiv?.closest('.preview-section');
    if (scheduleSection) scheduleSection.style.display = 'none';
  } else {
    scheduleDiv.innerHTML = '<p style="color:#6b7280; margin:0;">No classes scheduled.</p>';
  }
}

  // Download as PDF
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    generatePDF(data, applicantName);
  });

  // Download as Word
  document.getElementById('downloadWordBtn').addEventListener('click', () => {
    generateWord(data, applicantName);
  });

  // Back to Dashboard
  document.getElementById('backToDashboardBtn').addEventListener('click', () => {
    sessionStorage.removeItem('applicationData');
    sessionStorage.removeItem('applicationUsername');
    window.location.href = 'dashboard.html';
  });

  // -------------------- PDF GENERATION --------------------
    function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const applicationType = data.application_type || 'Leave Application';
    const isLeave = applicationType.toLowerCase().includes('leave');


  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // ---------- HEADER WITH BIGGER LOGO ----------
const logoPath = "../assets/adtu_logo_NAAC.png"; // update the path if needed

// Load logo image dynamically
const logoImg = new Image();
logoImg.src = logoPath;

logoImg.onload = () => {
  const logoWidth = 65;  // increased from 40 → 65 mm
  const logoHeight = 37; // increased from 18 → 28 mm
  const logoY = margin;  // same vertical position

  // Draw logo at top-left
  doc.addImage(logoImg, "PNG", margin, logoY, logoWidth, logoHeight);

  // Move text slightly right to balance with bigger logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Faculty of Computer Technology", pageWidth / 2 + 25, logoY + 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Assam down town University", pageWidth / 2 + 25, logoY + 18, { align: "center" });

  yPosition = logoY + 35; // Push everything below header down a bit

  // Line separator
  doc.setLineWidth(0.8);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

    // ---------- APPLICATION DETAILS ----------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Application Details", margin, yPosition);
    yPosition += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const username = sessionStorage.getItem("applicationUsername") || "Faculty Member";

    const details = [
  ['Applicant Name:', applicantName],
  ['Application Type:', applicationType],
  ['Title/Subject:', data.application_title || '—'],
  ['Details:', data.application_details || '—'],
];

// Only show these fields for Leave applications
if (isLeave) {
  details.push(
    ['Start Date:', data.start_date || '—'],
    ['End Date:', data.end_date || '—'],
    ['Number of Classes:', data.class_count || '—'],
  );
}

// Always show submission date
details.push(['Submission Date:', new Date().toLocaleDateString()]);

    details.forEach(([label, value]) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 50, yPosition);
      yPosition += 6;
    });

    yPosition += 6;

    // ---------- CLASS DETAILS TABLE ----------
    if (isLeave && data.class_schedule && Array.isArray(data.class_schedule) && data.class_schedule.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Class Details", margin, yPosition);
      yPosition += 7;

      // Smaller font for table
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      const headers = ["No.", "Class Name", "Section", "Date", "Time", "Subject", "Teacher"];
      const tableTopY = yPosition;
      const tableWidth = pageWidth - margin * 2 - 5;
      const colPercents = [6, 18, 10, 16, 10, 20, 20];
      const colWidths = colPercents.map((p) => (tableWidth * p) / 100);
      const rowHeight = 6;

      let rowY = tableTopY;

      function colX(index) {
        let x = margin;
        for (let i = 0; i < index; i++) x += colWidths[i];
        return x;
      }

      // ---- Header Row ----
      doc.setFont("helvetica", "bold");
      headers.forEach((header, i) => {
        const x = colX(i);
        doc.rect(x, rowY, colWidths[i], rowHeight);
        doc.text(header, x + 1.5, rowY + 4);
      });
      rowY += rowHeight;
      doc.setFont("helvetica", "normal");

      // ---- Data Rows ----
      data.class_schedule.forEach((cls, idx) => {
        if (rowY > pageHeight - margin - rowHeight) {
          doc.addPage();
          rowY = margin;

          doc.setFont("helvetica", "bold");
          headers.forEach((header, i) => {
            const x = colX(i);
            doc.rect(x, rowY, colWidths[i], rowHeight);
            doc.text(header, x + 1.5, rowY + 4);
          });
          rowY += rowHeight;
          doc.setFont("helvetica", "normal");
        }

        const rowData = [
          String(idx + 1),
          cls.className || cls.class_name || "—",
          cls.section || "—",
          cls.date || "—",
          cls.time || "—",
          cls.subject || "—",
          cls.teacher || "—",
        ];

        rowData.forEach((cellVal, i) => {
          const x = colX(i);
          let cellText = String(cellVal || "");
          if ((i === 5 || i === 6) && cellText.length > 18) cellText = cellText.slice(0, 18) + "…";
          doc.rect(x, rowY, colWidths[i], rowHeight);
          doc.text(cellText, x + 1.5, rowY + 4);
        });

        rowY += rowHeight;
      });

      yPosition = rowY + 5;
    }

    // ---------- FOOTER ----------
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 8, {
      align: "center",
    });

    doc.save("Leave_Application.pdf");
  };
}

  // -------------------- WORD GENERATION --------------------
  function generateWord(data, applicantName) {
    const applicationType = data.application_type || 'Leave Application';
    const isLeave = applicationType.toLowerCase().includes('leave');

    const {
      Document,
      Packer,
      Paragraph,
      Table,
      TableCell,
      TableRow,
      HeadingLevel,
      AlignmentType,
    } = window.docx;

    // APPLICATION DETAILS TABLE ROWS
    const detailsTableRows = [
  new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('Applicant Name:')], shading: { fill: 'E5E7EB' } }),
      new TableCell({ children: [new Paragraph(applicantName)] }),
    ],
  }),
  new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('Application Type:')], shading: { fill: 'E5E7EB' } }),
      new TableCell({ children: [new Paragraph(applicationType)] }),
    ],
  }),
  new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('Title/Subject:')], shading: { fill: 'E5E7EB' } }),
      new TableCell({ children: [new Paragraph(data.application_title || '—')] }),
    ],
  }),
  new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('Details:')], shading: { fill: 'E5E7EB' } }),
      new TableCell({ children: [new Paragraph(data.application_details || '—')] }),
    ],
  }),
];

// Extra rows only for Leave applications
if (isLeave) {
  detailsTableRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Start Date:')], shading: { fill: 'E5E7EB' } }),
        new TableCell({ children: [new Paragraph(data.start_date || '—')] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('End Date:')], shading: { fill: 'E5E7EB' } }),
        new TableCell({ children: [new Paragraph(data.end_date || '—')] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph('Number of Classes:')], shading: { fill: 'E5E7EB' } }),
        new TableCell({ children: [new Paragraph(data.class_count || '—')] }),
      ],
    }),
  );
}

// Submission date (always)
detailsTableRows.push(
  new TableRow({
    children: [
      new TableCell({ children: [new Paragraph('Submission Date:')], shading: { fill: 'E5E7EB' } }),
      new TableCell({ children: [new Paragraph(new Date().toLocaleDateString())] }),
    ],
  }),
);


    // CLASS DETAILS TABLE (LIKE IN THE IMAGE)
    const scheduleRows = [];

    if (isLeave && data.class_schedule && Array.isArray(data.class_schedule) && data.class_schedule.length > 0) {
      // Header row
      scheduleRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph('No.')], shading: { fill: 'E5E7EB' } }),
            new TableCell({ children: [new Paragraph('Class Name')], shading: { fill: 'E5E7EB' } }),
            new TableCell({ children: [new Paragraph('Section')], shading: { fill: 'E5E7EB' } }),
            new TableCell({ children: [new Paragraph('Date')], shading: { fill: 'E5E7EB' } }),
            new TableCell({ children: [new Paragraph('Time')], shading: { fill: 'E5E7EB' } }),
            new TableCell({ children: [new Paragraph('Subject')], shading: { fill: 'E5E7EB' } }),
            new TableCell({ children: [new Paragraph('Assigned Teacher')], shading: { fill: 'E5E7EB' } }),
          ],
        })
      );

      // Data rows
      data.class_schedule.forEach((cls, idx) => {
        const className = cls.className || cls.class_name || '—';
        const section = cls.section || '—';
        const date = cls.date || '—';
        const time = cls.time || '—';
        const subject = cls.subject || '—';
        const teacher = cls.teacher || '—';

        scheduleRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(idx + 1))] }),
              new TableCell({ children: [new Paragraph(className)] }),
              new TableCell({ children: [new Paragraph(section)] }),
              new TableCell({ children: [new Paragraph(date)] }),
              new TableCell({ children: [new Paragraph(time)] }),
              new TableCell({ children: [new Paragraph(subject)] }),
              new TableCell({ children: [new Paragraph(teacher)] }),
            ],
          })
        );
      });
    }

    const children = [
      new Paragraph({
        text: 'Faculty of Computer Technology',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: 'Assam down town University',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: 'LEAVE APPLICATION FORM',
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: 'Application Details',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),
      new Table({
        rows: detailsTableRows,
        width: { size: 100, type: 'pct' },
      }),
    ];

    if (scheduleRows.length > 0) {
      children.push(
        new Paragraph({
          text: 'Class Details',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
        new Table({
          rows: scheduleRows,
          width: { size: 100, type: 'pct' },
        })
      );
    }

    children.push(
      new Paragraph({
        text: `Generated on ${new Date().toLocaleString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      })
    );

    const doc = new Document({
      sections: [{ children }],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Leave_Application.docx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
});
