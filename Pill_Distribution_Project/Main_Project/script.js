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

  // Calculate total days (including start and end days)
  const totalDays =
    Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1;
  const dosesPerDay = 24 / interval;
  const totalDoses = Math.min(
    Math.ceil(dosesPerDay * totalDays),
    Math.floor((endTime - startTime) / (interval * 60 * 60 * 1000)) + 1
  ); // Ensure accurate total
  const totalRequiredMg = totalDoses * dosage;
  const tabletsRequired = totalRequiredMg / tabletStrengthMg;

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
    const hour = parseInt(doseTime.split(":")[0]);

    // Adjust night doses to 22:00 if between 22:00 and 06:00
    let assignTime = doseTime;
    let assignDate = new Date(doseDate);
    if (hour >= 22 || hour < 6) {
      assignTime = "22:00";
    }

    const dateKey = assignDate.toISOString().split("T")[0];

    if (!schedule.has(dateKey)) {
      schedule.set(dateKey, new Map());
    }
    const times = schedule.get(dateKey);
    times.set(assignTime, (times.get(assignTime) || 0) + 1);

    actualLastDoseTime = new Date(`${dateKey}T${assignTime}`);

    // Check if the next increment would exceed endTime, and add the last dose if needed
    const nextDoseTime = new Date(currentDoseTime);
    nextDoseTime.setHours(nextDoseTime.getHours() + interval);
    if (nextDoseTime > endTime && currentDoseTime <= endTime) {
      break; // Exit after the last valid dose
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

  let totalDosesTaken = 0;
  for (const [date, times] of schedule.entries()) {
    for (const [time, count] of times.entries()) {
      const totalDoseMg = count * dosage;
      sumDoseMg += totalDoseMg;
      balanceMg = Math.max(0, totalRequiredMg - sumDoseMg); // Ensure non-negative balance
      totalDosesTaken += count;
      const usedTabs = sumDoseMg / tabletStrengthMg; // Calculate whole tablets used
      balanceTab = Math.max(0, tabletsRequired - usedTabs); // Ensure non-negative tablet balance

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
    // Adjust final balance based on total doses taken
    const finalUsedTabs = Math.ceil((totalDoses * dosage) / tabletStrengthMg);
    const finalBalanceMg = Math.max(0, totalRequiredMg - totalDoses * dosage);
    const finalBalanceTab = Math.max(0, tabletsRequired - finalUsedTabs);
    output += `<p><strong>Final Balance:</strong> ${finalBalanceMg.toFixed(
      2
    )} mg and ${finalBalanceTab.toFixed(2)} Tablets</p>`;
  }

  document.getElementById("output").innerHTML = output;
});

function confirmPrint() {
  if (confirm("Would you like to print the schedule?")) {
    window.print();
  }
}
