package com.digitaltwin.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String timezone = "UTC";

    private Preferences preferences = new Preferences();

    private TwinProfile twinProfile = new TwinProfile();

    private FocusSession focusSession = new FocusSession();

    @Data
    @NoArgsConstructor
    public static class Preferences {
        private boolean notifications = true;
        private boolean darkMode = true;
    }

    @Data
    @NoArgsConstructor
    public static class TwinProfile {
        private List<Integer> peakProductivityHours;
        private double averageProductivity = 0.0;
        private String dominantActivity = "unknown";
        private String behaviorCluster = "unclassified";
        private Date lastUpdated = new Date();
    }

    @Data
    @NoArgsConstructor
    public static class FocusSession {
        private boolean active = false;
        private Date startTime;
        private int durationMinutes;
        private Date endTime;
        private String label = "";
    }
}
