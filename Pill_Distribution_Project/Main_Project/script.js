document.getElementById("doseForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const patientName = document.getElementById("patientName").value.trim();
  const patientPin = document.getElementById("patientPin").value.trim();
  const wardName = document.getElementById("wardName").value.trim();
  const startTime = new Date(document.getElementById("start").value);
  const noOfDays = parseInt(document.getElementById("days").value) || 0;
  const dosageRatio = parseFloat(document.getElementById("dosage").value);
  const interval = parseInt(document.getElementById("interval").value);

  const tabletStrengthMg = 10;
  const doseMgPerSlot = tabletStrengthMg * dosageRatio;

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
      dailyDoseHours = [6, 10, 14, 18, 22]; // 6am, 10am, 2pm, 6pm, 10pm
      break;
    case 6:
      dailyDoseHours = [6, 12, 18, 22]; // 6am, 12pm, 6pm, 10pm
      break;
    case 8:
      dailyDoseHours = [6, 14, 22]; // 6am, 2pm, 10pm
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

  // --- 1. Generate schedule for the specified days ---
  for (let i = 0; i < noOfDays; i++) {
    const currentDay = new Date(startDay);
    currentDay.setDate(startDay.getDate() + i);

    for (const hour of dailyDoseHours) {
      const doseTime = new Date(currentDay);
      doseTime.setHours(hour, 0, 0, 0);

      // Add dose only if it's on or after the start time
      if (doseTime >= startTime) {
        let actualDoseMg = doseMgPerSlot;

        // Check for the double-dose condition for 4-hour interval
        if (
          interval === 4 &&
          hour === 22 &&
          doseTime < new Date(doseTime.getTime() + interval * 60 * 60 * 1000) &&
          new Date(doseTime.getTime() + interval * 60 * 60 * 1000).getHours() <
            6
        ) {
          actualDoseMg *= 2;
        }

        schedule.push({ time: doseTime, doseMg: actualDoseMg });
      }
    }
  }

  // --- 2. Calculate and add spillover doses ---
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
      schedule.push({ time: spilloverTime, doseMg: doseMgPerSlot });
    }
  }

  // Sort the final schedule by time
  schedule.sort((a, b) => a.time - b.time);

  // --- 3. Compute totals and generate output ---
  const totalDoses = schedule.length;
  let totalRequiredMg = 0;
  schedule.forEach((d) => (totalRequiredMg += d.doseMg));
  const tabletsRequired = Math.ceil(totalRequiredMg / tabletStrengthMg);

  // Helper function to format the date as DD/MM/YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to format the time as HH:MM
  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  let output = `
    <h2>Patient: ${patientName}</h2>
    <p><strong>Patient Pin:</strong> ${patientPin}</p>
    <p><strong>Ward Name:</strong> ${wardName}</p>
    <p><strong>Dose Amount:</strong> ${doseMgPerSlot.toFixed(2)} mg</p>
    <p><strong>Interval:</strong> ${interval} hours</p>
    <p><strong>Start:</strong> ${formatDate(startTime)}, ${formatTime(
    startTime
  )}</p>
    <p><strong>End (last dose day):</strong> ${formatDate(
      schedule[schedule.length - 1].time
    )}, ${formatTime(schedule[schedule.length - 1].time)}</p>
    <p><strong>Total Doses:</strong> ${totalDoses}</p>
    <p><strong>Total Required (mg):</strong> ${totalRequiredMg.toFixed(2)}</p>
    <p><strong>Total Tablets Required (10mg each):</strong> ${tabletsRequired}</p>
    <table>
      <tr>
        <th>Date</th><th>Time</th><th>Dose(s)</th>
        <th>Total Dose (mg)</th><th>Balance (mg)</th><th>Balance (Tabs)</th>
      </tr>
  `;

  let sumDoseMg = 0;

  schedule.forEach((slot) => {
    sumDoseMg += slot.doseMg;
    const doseCount = slot.doseMg / doseMgPerSlot;
    const balanceMg = Math.max(0, totalRequiredMg - sumDoseMg).toFixed(2);
    const balanceTab = Math.max(
      0,
      tabletsRequired - sumDoseMg / tabletStrengthMg
    ).toFixed(2);

    output += `<tr>
      <td>${formatDate(slot.time)}</td>
      <td>${formatTime(slot.time)}</td>
      <td>${doseCount}</td>
      <td>${slot.doseMg.toFixed(2)}</td>
      <td>${balanceMg}</td>
      <td>${balanceTab}</td>
    </tr>`;
  });

  output += `</table>`;
  output += `<p><strong>Last Dose Date & Time:</strong> ${formatDate(
    schedule[schedule.length - 1].time
  )}, ${formatTime(schedule[schedule.length - 1].time)}</p>`;

  document.getElementById("output").innerHTML = output;
});

function confirmPrint() {
  if (confirm("Would you like to print the schedule?")) {
    window.print();
  }
}
