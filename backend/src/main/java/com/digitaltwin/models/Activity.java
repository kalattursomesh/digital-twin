package com.digitaltwin.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "activities")
@CompoundIndexes({
    @CompoundIndex(name = "user_time_idx", def = "{'userId': 1, 'startTime': -1}"),
    @CompoundIndex(name = "user_cat_time_idx", def = "{'userId': 1, 'category': 1, 'startTime': -1}")
})
public class Activity {

    @Id
    private String id;

    private String userId;

    private String activityType;

    private String category; // productive, neutral, distraction

    private int duration; // minutes

    private Date startTime = new Date();

    private Date endTime;

    private Metadata metadata = new Metadata();

    private MlFeatures mlFeatures = new MlFeatures();

    public void calculateFieldsAndFeatures() {
        if (endTime == null && duration > 0) {
            this.endTime = new Date(this.startTime.getTime() + (duration * 60000L));
        }

        // Auto-categorization
        List<String> prod = List.of("study", "work", "coding", "reading", "exercise");
        List<String> dist = List.of("social_media", "entertainment", "gaming");
        if (prod.contains(this.activityType)) this.category = "productive";
        else if (dist.contains(this.activityType)) this.category = "distraction";
        else this.category = "neutral";

        // ML Features
        this.mlFeatures.setHourOfDay(this.startTime.getHours());
        this.mlFeatures.setDayOfWeek(this.startTime.getDay());
        this.mlFeatures.setWeekend(this.startTime.getDay() == 0 || this.startTime.getDay() == 6);
    }

    @Data
    @NoArgsConstructor
    public static class Metadata {
        private String application;
        private String description;
        private Integer productivityScore;
    }

    @Data
    @NoArgsConstructor
    public static class MlFeatures {
        private int hourOfDay;
        private int dayOfWeek;
        private boolean isWeekend;
        private int sessionIndex;
        private int timeSinceLastActivity;
    }
}
