package Pill_Distribution_Project;

// class for string basic patient details
public class Patient {
    private String Patient_name;
    private double dosePerSlotMg;
    private int intervalHrs;
    private String startDate;
    private String startTime;
    private String endDate;
    

    

    public Patient(String patient_name, double dosePerSlotMg, int intervalHrs, String startDate, String startTime,
            String endDate) {
        Patient_name = patient_name;
        this.dosePerSlotMg = dosePerSlotMg;
        this.intervalHrs = intervalHrs;
        this.startDate = startDate;
        this.startTime = startTime;
        this.endDate = endDate;
    }
    
    public double getDosePerSlotMg() {
        return dosePerSlotMg;
    }

    public String getPatient_name() {
        return Patient_name;
    }
    
    public int getIntervalHrs() {
        return intervalHrs;
    }
    public String getStartDate() {
        return startDate;
    }
    public String getStartTime() {
        return startTime;
    }
    public String getEndDate() {
        return endDate;
    }
    

   

  

        
}
