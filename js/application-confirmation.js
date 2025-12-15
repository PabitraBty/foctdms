// ../js/application-confirmation.js
document.addEventListener("DOMContentLoaded", () => {
  const raw = sessionStorage.getItem("applicationData");
  const username = sessionStorage.getItem("applicationUsername") || "Faculty Member";

  const applicantEl = document.getElementById("previewApplicant");
  const typeEl = document.getElementById("previewType");
  const titleEl = document.getElementById("previewTitle");
  const detailsEl = document.getElementById("previewDetails");
  const startEl = document.getElementById("previewStartDate");
  const endEl = document.getElementById("previewEndDate");
  const classCountEl = document.getElementById("previewClassCount");
  const scheduleEl = document.getElementById("previewSchedule");

  const rowStart = document.getElementById("rowStartDate");
  const rowEnd = document.getElementById("rowEndDate");
  const rowClassCount = document.getElementById("rowClassCount");
  const classScheduleSection = document.getElementById("classScheduleSection");

  const backBtn = document.getElementById("backToDashboardBtn");
  const pdfBtn = document.getElementById("downloadPdfBtn");
  const cardEl = document.getElementById("confirmationCard");

  // No data in sessionStorage (user opened page directly)
  if (!raw) {
    applicantEl.textContent = username;
    typeEl.textContent = "Application";
    titleEl.textContent = "—";
    detailsEl.textContent = "—";

    // Hide leave-only rows & schedule by default
    if (rowStart) rowStart.style.display = "none";
    if (rowEnd) rowEnd.style.display = "none";
    if (rowClassCount) rowClassCount.style.display = "none";
    if (classScheduleSection) classScheduleSection.style.display = "none";

    if (pdfBtn) pdfBtn.disabled = true;
    return;
  }

  const data = JSON.parse(raw);

  applicantEl.textContent = username;

  const typeText = data.application_type || "Application";
  typeEl.textContent = typeText;

  // ✅ Decide if this is a Leave application
  const isLeave =
    typeText.toLowerCase() === "leave" ||
    typeText.toLowerCase() === "leave application";

  titleEl.textContent = data.application_title || "—";
  detailsEl.textContent = data.application_details || "—";

  if (isLeave) {
    // Show and fill Start/End/Classes
    if (rowStart) rowStart.style.display = "";
    if (rowEnd) rowEnd.style.display = "";
    if (rowClassCount) rowClassCount.style.display = "";

    startEl.textContent = data.start_date || "—";
    endEl.textContent = data.end_date || "—";
    classCountEl.textContent =
      data.class_count && Number(data.class_count) > 0
        ? data.class_count
        : "—";

    // Handle class schedule
    const schedule = Array.isArray(data.class_schedule)
      ? data.class_schedule
      : [];

    if (schedule.length && classScheduleSection) {
      classScheduleSection.style.display = "";

      const table = document.createElement("table");
      table.classList.add("schedule-table-inner");
      table.innerHTML = `
        <thead>
          <tr>
            <th>#</th>
            <th>Class Name</th>
            <th>Section</th>
            <th>Subject</th>
            <th>Time</th>
            <th>Date</th>
            <th>Assigned Teacher</th>
          </tr>
        </thead>
        <tbody>
          ${schedule
            .map(
              (cls, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${cls.className || ""}</td>
              <td>${cls.section || ""}</td>
              <td>${cls.subject || ""}</td>
              <td>${cls.time || ""}</td>
              <td>${cls.date || ""}</td>
              <td>${cls.teacher || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      `;
      scheduleEl.innerHTML = "";
      scheduleEl.appendChild(table);
    } else if (classScheduleSection) {
      classScheduleSection.style.display = "";
      scheduleEl.innerHTML = "<p>No class schedule provided.</p>";
    }
  } else {
    // ✅ Not a leave application: hide leave-only fields
    if (rowStart) rowStart.style.display = "none";
    if (rowEnd) rowEnd.style.display = "none";
    if (rowClassCount) rowClassCount.style.display = "none";
    if (classScheduleSection) classScheduleSection.style.display = "none";
  }

  // Back to dashboard
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "dashboard.html";
    });
  }

  // Download as PDF
  if (pdfBtn) {
    pdfBtn.addEventListener("click", async () => {
      const { jsPDF } = window.jspdf;
      const element = cardEl || document.body;

      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "pt", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("application.pdf");
    });
  }
});
