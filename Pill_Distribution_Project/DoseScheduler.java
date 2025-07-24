package Pill_Distribution_Project;

import java.util.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.text.DecimalFormat;

public class DoseScheduler {

    public static void scheduleDoses(Patient patient, double tabletStrength) {
        LocalDateTime startDateTime = LocalDateTime.parse(patient.getStartDate() + "T" + patient.getStartTime());
        int intervalHours = patient.getIntervalHrs();
        // int totalDays = patient.getNoOfdays();
        double dosePerDay = patient.getDosePerDay();
        double totalAvailableMg = patient.getTotalAmt();

        LocalDate startDate = LocalDate.parse(patient.getStartDate()); // Format: yyyy-MM-dd
        LocalDate endDate = LocalDate.parse(patient.getEndDate());     // You must add getEndDate() in Patient class
        int totalDays = (int) ChronoUnit.DAYS.between(startDate, endDate) ;

        int dosesPerDay = 24 / intervalHours;
        double dosePerSlotMg = dosePerDay / dosesPerDay;

        double sumDoseMg = 0;
        double balance = totalAvailableMg;

        LocalDateTime currentDoseTime = startDateTime;
        LocalDateTime endDateTime = startDateTime.plusDays(totalDays).minusSeconds(1);

        Map<LocalDate, Map<LocalTime, Integer>> doseSchedule = new LinkedHashMap<>();
        LocalDateTime actualLastDoseTime = null;

        while (!currentDoseTime.isAfter(endDateTime)) {
            LocalDate doseDate = currentDoseTime.toLocalDate();
            LocalTime doseTime = currentDoseTime.toLocalTime();

            boolean isNight = (doseTime.isAfter(LocalTime.of(22, 0)) || doseTime.isBefore(LocalTime.of(6, 0)));

            if (isNight) {
                LocalDate assignDate = doseDate.minusDays(doseTime.isBefore(LocalTime.of(6, 0)) ? 1 : 0);
                LocalTime assignTime = LocalTime.of(22, 0);

                doseSchedule.putIfAbsent(assignDate, new TreeMap<>());
                Map<LocalTime, Integer> times = doseSchedule.get(assignDate);
                times.put(assignTime, times.getOrDefault(assignTime, 0) + 1);

                actualLastDoseTime = LocalDateTime.of(assignDate, assignTime);
            } else {
                doseSchedule.putIfAbsent(doseDate, new TreeMap<>());
                Map<LocalTime, Integer> times = doseSchedule.get(doseDate);
                times.put(doseTime, times.getOrDefault(doseTime, 0) + 1);

                actualLastDoseTime = LocalDateTime.of(doseDate, doseTime);
            }

            currentDoseTime = currentDoseTime.plusHours(intervalHours);
        }

        DecimalFormat df = new DecimalFormat("#.00");
        System.out.println("Splitting Pattern (per day):");

        for (Map.Entry<LocalDate, Map<LocalTime, Integer>> entry : doseSchedule.entrySet()) {
            System.out.println(entry.getKey() + " ->");
            for (Map.Entry<LocalTime, Integer> timeEntry : entry.getValue().entrySet()) {
                int count = timeEntry.getValue();
                double totalDoseMg = count * dosePerSlotMg;
                sumDoseMg += totalDoseMg;
                balance = totalAvailableMg - sumDoseMg;
                if (balance < 0) balance = 0;

                System.out.println("  " + timeEntry.getKey()
                        + " - " + count + " dose(s)"
                        + " - " + df.format(totalDoseMg) + " mg"
                        + " - used: " + df.format(sumDoseMg) + " mg");
            }
        }

        if (actualLastDoseTime != null) {
            DateTimeFormatter outputFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");
            System.out.println("\nLast Dose Date & Time: " + actualLastDoseTime.format(outputFormat));
            System.out.println("Balance: " + df.format(balance) + " mg");
        }
    }
}
