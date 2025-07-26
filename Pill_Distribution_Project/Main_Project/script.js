document.getElementById("doseForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const patientName = document.getElementById("patientName").value;
  const startTime = new Date(document.getElementById("start").value);
  const endDateOnly = new Date(document.getElementById("end").value);
  const dosage = parseFloat(document.getElementById("dosage").value);
  const interval = parseInt(document.getElementById("interval").value);
  const tabletStrengthMg = 10;

  // Set end date to 23:59:59 of that day
  const endTime = new Date(endDateOnly);
  endTime.setHours(23, 59, 59, 999);

  if (isNaN(startTime) || isNaN(endTime) || isNaN(dosage) || !patientName) {
    alert("Please fill in all fields correctly.");
    return;
  }

  // Calculate total days
  const totalDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
  const dosesPerDay = 24 / interval;
  const totalDoses = dosesPerDay * totalDays;
  const totalRequiredMg = totalDoses * dosage;
  const tabletsRequired = Math.ceil(totalRequiredMg / tabletStrengthMg);

  let sumDoseMg = 0;
  let balanceMg = totalRequiredMg;
  let balanceTab = tabletsRequired;

  // Create schedule
  let schedule = new Map();
  let currentDoseTime = new Date(startTime);
  let actualLastDoseTime = null;

  while (currentDoseTime <= endTime) {
    const doseDate = new Date(currentDoseTime);
    const doseTime = new Date(currentDoseTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const isNight =
      parseInt(doseTime.split(":")[0]) >= 22 ||
      parseInt(doseTime.split(":")[0]) < 6;

    if (isNight) {
      const assignDate = new Date(doseDate);
      if (parseInt(doseTime.split(":")[0]) < 6) {
        assignDate.setDate(assignDate.getDate() - 1);
      }
      const assignTime = "22:00";
      const dateKey = assignDate.toISOString().split("T")[0];

      if (!schedule.has(dateKey)) {
        schedule.set(dateKey, new Map());
      }
      const times = schedule.get(dateKey);
      times.set(assignTime, (times.get(assignTime) || 0) + 1);

      actualLastDoseTime = new Date(`${dateKey}T${assignTime}`);
    } else {
      const dateKey = doseDate.toISOString().split("T")[0];
      if (!schedule.has(dateKey)) {
        schedule.set(dateKey, new Map());
      }
      const times = schedule.get(dateKey);
      times.set(doseTime, (times.get(doseTime) || 0) + 1);

      actualLastDoseTime = new Date(currentDoseTime);
    }

    currentDoseTime.setHours(currentDoseTime.getHours() + interval);
  }

  // Generate output HTML
  let output = `
    <h2>Patient: ${patientName}</h2>
    <p><strong>Dose Amount:</strong> ${dosage} mg</p>
    <p><strong>Interval:</strong> ${interval} hours</p>
    <p><strong>Start Date & Time:</strong> ${startTime.toLocaleString()}</p>
    <p><strong>End Date:</strong> ${endDateOnly.toLocaleDateString()}</p>
    <p><strong>Total Doses:</strong> ${totalDoses}</p>
    <p><strong>Total Required (mg):</strong> ${totalRequiredMg}</p>
    <p><strong>Total Tablets Required (10mg each):</strong> ${tabletsRequired}</p>
    <table>
      <tr>
        <th>Date</th>
        <th>Time</th>
        <th>Dose(s)</th>
        <th>Total Dose (mg)</th>
        <th>Balance (mg)</th>
        <th>Balance (Tablets)</th>
      </tr>
  `;

  for (const [date, times] of schedule.entries()) {
    for (const [time, count] of times.entries()) {
      const totalDoseMg = count * dosage;
      sumDoseMg += totalDoseMg;
      balanceMg = totalRequiredMg - sumDoseMg;
      const usedTabs = sumDoseMg / tabletStrengthMg;
      balanceTab = tabletsRequired - usedTabs;
      if (balanceMg < 0) balanceMg = 0;
      if (balanceTab < 0) balanceTab = 0;

      output += `<tr>
        <td>${new Date(date).toLocaleDateString()}</td>
        <td>${time}</td>
        <td>${count}</td>
        <td>${totalDoseMg.toFixed(2)}</td>
        <td>${balanceMg.toFixed(2)}</td>
        <td>${balanceTab.toFixed(2)}</td>
      </tr>`;
    }
  }

  output += "</table>";

  if (actualLastDoseTime) {
    output += `<p><strong>Last Dose Date & Time:</strong> ${actualLastDoseTime.toLocaleString()}</p>`;
    output += `<p><strong>Final Balance:</strong> ${balanceMg.toFixed(
      2
    )} mg and ${balanceTab.toFixed(2)} Tablets</p>`;
  }

  document.getElementById("output").innerHTML = output;
});

function confirmPrint() {
  if (confirm("Would you like to print the schedule?")) {
    window.print();
  }
}
