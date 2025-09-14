// --- Global variables to hold schedule data ---
let fullSchedule = [];
let patientInfo = {};
const tabletStrengthMg = 10;
const outputDiv = document.getElementById("output");

// --- Main function to render the entire output ---
function renderSchedule() {
  if (!patientInfo.name) return; // Don't render if there's no data

  // --- 1. Recalculate totals based on the current state of fullSchedule ---
  let activeDoses = fullSchedule.filter((slot) => !slot.skipped);
  const totalDoses = activeDoses.length;
  let totalRequiredMg = 0;
  activeDoses.forEach((d) => (totalRequiredMg += d.doseMg));
  const tabletsRequired = Math.ceil(totalRequiredMg / tabletStrengthMg);
  const lastDose =
    activeDoses.length > 0
      ? activeDoses[activeDoses.length - 1].time
      : patientInfo.startTime;

  // Helper functions
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // --- 2. Build the HTML output string ---
  let output = `
    <h2>Patient: ${patientInfo.name}</h2>
    <p><strong>Patient Pin:</strong> ${patientInfo.pin}</p>
    <p><strong>Ward Name:</strong> ${patientInfo.ward}</p>
    <p><strong>Dose Amount:</strong> ${patientInfo.doseMgPerSlot.toFixed(
      2
    )} mg</p>
    <p><strong>Interval:</strong> ${patientInfo.interval} hours</p>
    <p><strong>Start:</strong> ${formatDate(
      patientInfo.startTime
    )}, ${formatTime(patientInfo.startTime)}</p>
    <p><strong>End (last dose day):</strong> ${formatDate(
      lastDose
    )}, ${formatTime(lastDose)}</p>
    <p><strong>Total Doses:</strong> ${totalDoses}</p>
    <p><strong>Total Required (mg):</strong> ${totalRequiredMg.toFixed(2)}</p>
    <p><strong>Total Tablets Required (10mg each):</strong> ${tabletsRequired}</p>
    <table>
      <tr>
        <th>Date</th><th>Time</th><th>Dose(s)</th>
        <th>Total Dose (mg)</th><th>Balance (mg)</th><th>Balance (Tabs)</th>
        <th>Action</th>
      </tr>
  `;

  let sumDoseMg = 0;
  fullSchedule.forEach((slot, index) => {
    // Determine class and button text based on skipped status
    const isSkipped = slot.skipped;
    const rowClass = isSkipped ? 'class="skipped-row"' : "";
    const btnClass = isSkipped ? "re-add" : "";
    const btnText = isSkipped ? "+" : "-";

    if (!isSkipped) {
      sumDoseMg += slot.doseMg;
    }

    const doseCount = slot.doseMg / patientInfo.doseMgPerSlot;
    const balanceMg = Math.max(0, totalRequiredMg - sumDoseMg).toFixed(2);
    const balanceTab = Math.max(
      0,
      tabletsRequired - sumDoseMg / tabletStrengthMg
    ).toFixed(2);

    output += `<tr ${rowClass}>
      <td>${formatDate(slot.time)}</td>
      <td>${formatTime(slot.time)}</td>
      <td>${doseCount}</td>
      <td>${slot.doseMg.toFixed(2)}</td>
      <td>${balanceMg}</td>
      <td>${balanceTab}</td>
      <td>
        <button class="skip-btn ${btnClass}" data-index="${index}">${btnText}</button>
      </td>
    </tr>`;
  });

  output += `</table>`;
  output += `<p><strong>Last Dose Date & Time:</strong> ${formatDate(
    lastDose
  )}, ${formatTime(lastDose)}</p>`;

  // --- 3. Update the DOM ---
  outputDiv.innerHTML = output;
}

// --- Event Listener for form submission ---
document.getElementById("doseForm").addEventListener("submit", function (e) {
  e.preventDefault();

  // Reset previous schedule
  fullSchedule = [];

  const patientName = document.getElementById("patientName").value.trim();
  const patientPin = document.getElementById("patientPin").value.trim();
  const wardName = document.getElementById("wardName").value.trim();
  const startTime = new Date(document.getElementById("start").value);
  const noOfDays = parseInt(document.getElementById("days").value) || 0;
  const dosageRatio = parseFloat(document.getElementById("dosage").value);
  const interval = parseInt(document.getElementById("interval").value);
  const doseMgPerSlot = tabletStrengthMg * dosageRatio;

  // Store patient info globally for re-rendering
  patientInfo = {
    name: patientName,
    pin: patientPin,
    ward: wardName,
    startTime: startTime,
    doseMgPerSlot: doseMgPerSlot,
    interval: interval,
  };

  if (
    !patientName ||
    !patientPin ||
    !wardName ||
    isNaN(startTime.getTime()) ||
    isNaN(noOfDays) ||
    noOfDays <= 0 ||
    isNaN(dosageRatio) ||
    isNaN(interval)
  ) {
    alert("Fill all fields correctly.");
    return;
  }

  // Define the fixed daily dose times based on the interval
  let dailyDoseHours;
  switch (interval) {
    case 4:
      dailyDoseHours = [6, 10, 14, 18, 22];
      break;
    case 6:
      dailyDoseHours = [6, 12, 18, 22];
      break;
    case 8:
      dailyDoseHours = [6, 14, 22];
      break;
    default:
      alert("Invalid interval selected.");
      return;
  }

  let schedule = [];
  const startDay = new Date(startTime);
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(startDay);
  endDay.setDate(startDay.getDate() + noOfDays - 1);

  // --- 1. Generate schedule for the specified days (Original Logic) ---
  for (let i = 0; i < noOfDays; i++) {
    const currentDay = new Date(startDay);
    currentDay.setDate(startDay.getDate() + i);

    for (const hour of dailyDoseHours) {
      const doseTime = new Date(currentDay);
      doseTime.setHours(hour, 0, 0, 0);

      if (doseTime >= startTime) {
        let actualDoseMg = doseMgPerSlot;
        if (
          interval === 4 &&
          hour === 22 &&
          new Date(doseTime.getTime() + interval * 60 * 60 * 1000).getHours() <
            6
        ) {
          actualDoseMg *= 2;
        }
        schedule.push({ time: doseTime, doseMg: actualDoseMg, skipped: false });
      }
    }
  }

  // --- 2. Calculate and add spillover doses (Original Logic) ---
  const firstDayDoses = dailyDoseHours.filter(
    (hour) =>
      new Date(
        startDay.getFullYear(),
        startDay.getMonth(),
        startDay.getDate(),
        hour,
        0,
        0,
        0
      ) < startTime
  ).length;

  if (firstDayDoses > 0) {
    let spilloverDay = new Date(endDay);
    spilloverDay.setDate(endDay.getDate() + 1);
    const spilloverHours = dailyDoseHours
      .slice(0, firstDayDoses)
      .sort((a, b) => a - b);
    for (const hour of spilloverHours) {
      const spilloverTime = new Date(spilloverDay);
      spilloverTime.setHours(hour, 0, 0, 0);
      schedule.push({
        time: spilloverTime,
        doseMg: doseMgPerSlot,
        skipped: false,
      });
    }
  }

  // Sort and store the final schedule globally
  schedule.sort((a, b) => a.time - b.time);
  fullSchedule = schedule;

  // --- 3. Initial Render ---
  renderSchedule();
});

// --- Event delegation for skip buttons ---
outputDiv.addEventListener("click", function (e) {
  if (e.target && e.target.matches("button.skip-btn")) {
    const index = parseInt(e.target.dataset.index, 10);
    if (!isNaN(index) && fullSchedule[index]) {
      // Toggle the 'skipped' state
      fullSchedule[index].skipped = !fullSchedule[index].skipped;
      // Re-render the entire schedule with updated data
      renderSchedule();
    }
  }
});

function confirmPrint() {
  if (document.getElementById("output").innerHTML.trim() === "") {
    alert("Please generate a schedule first.");
    return;
  }
  if (confirm("Would you like to print the schedule?")) {
    window.print();
  }
}
