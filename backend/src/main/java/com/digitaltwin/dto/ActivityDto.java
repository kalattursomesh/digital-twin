package com.digitaltwin.dto;

import lombok.Data;
import java.util.Date;

public class ActivityDto {

    @Data
    public static class LogRequest {
        private String activityType;
        private int duration;
        private Date startTime;
    }

    @Data
    public static class TodaySummary {
        private long totalActivities;
        private long totalMinutes;
        private double productivityScore;
        private Object timeline; // Send raw list for simplicity in prototype
    }

    @Data
    public static class FocusRequest {
        private int duration; // in minutes
        private String label; // e.g. "Coding", "Studying"
    }
}
