package Pill_Distribution_Project;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class Main { 
    public static void main(String[] args) {
        // Inputs
        Patient patient = new Patient("Aarti Singh", 2.5, 4, "2025-07-22", "06:00", "2025-07-24");

        System.out.println("PATIENT DETAILS:");
        System.out.println("Name         : " + patient.getPatient_name());
        System.out.println("Dose Amount  : " + patient.getDosePerSlotMg() + " mg");
        System.out.println("Start Date   : " + patient.getStartDate());
        System.out.println("Start Time   : " + patient.getStartTime());
        System.out.println("Interval     : " + patient.getIntervalHrs() + " hrs");
        System.out.println("End Date     : " + patient.getEndDate());
        

        // Call method
        DoseScheduler.scheduleDoses(patient, patient.getDosePerSlotMg(), 10);
    }
}
