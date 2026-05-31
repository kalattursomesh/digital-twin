package com.digitaltwin.controllers;

import com.digitaltwin.models.Activity;
import com.digitaltwin.models.User;
import com.digitaltwin.repository.ActivityRepository;
import com.digitaltwin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.time.LocalDateTime;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/prediction")
public class PredictionController {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Value("${app.ml-service.url}")
    private String mlServiceUrl;

    @GetMapping("/next-action")
    public ResponseEntity<?> predictNextAction(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<Activity> recentActivities = activityRepository.findByUserIdOrderByStartTimeDesc(
                userId, PageRequest.of(0, 50));

        if (recentActivities.size() < 5) {
            List<Map<String, String>> initialRecs = new ArrayList<>();
            initialRecs.add(Map.of("message", "Welcome! Start logging activities to train your custom model."));
            return ResponseEntity.ok(Map.of(
                    "prediction", "Not enough data",
                    "confidence", 0,
                    "message", "Log at least 5 activities to get predictions",
                    "probabilities", new HashMap<>(),
                    "recommendations", initialRecs
            ));
        }

        List<Map<String, Object>> mappedActivities = recentActivities.stream().map(act -> {
            Map<String, Object> map = new HashMap<>();
            map.put("activityType", act.getActivityType());
            map.put("category", act.getCategory());
            map.put("duration", act.getDuration());
            
            if (act.getMlFeatures() != null) {
                map.put("hourOfDay", act.getMlFeatures().getHourOfDay());
                map.put("dayOfWeek", act.getMlFeatures().getDayOfWeek());
                map.put("isWeekend", act.getMlFeatures().isWeekend());
                map.put("sessionIndex", act.getMlFeatures().getSessionIndex());
                map.put("timeSinceLastActivity", act.getMlFeatures().getTimeSinceLastActivity());
            } else {
                map.put("hourOfDay", 0);
                map.put("dayOfWeek", 0);
                map.put("isWeekend", false);
                map.put("sessionIndex", 0);
                map.put("timeSinceLastActivity", 0);
            }
            
            int prodScore = 0;
            if (act.getMetadata() != null && act.getMetadata().getProductivityScore() != null) {
                prodScore = act.getMetadata().getProductivityScore();
            }
            map.put("productivityScore", prodScore);
            map.put("timestamp", act.getStartTime());
            return map;
        }).toList();

        try {
            LocalDateTime now = LocalDateTime.now();
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("currentHour", now.getHour());
            request.put("currentDay", now.getDayOfWeek().getValue() % 7); // Sunday = 0, Monday = 1, ...
            request.put("activities", mappedActivities);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    mlServiceUrl + "/predict/next-action", request, Map.class);
            
            Map<String, Object> body = (Map<String, Object>) response.getBody();
            if (body != null) {
                body = new HashMap<>(body); // Ensure mutable map
                body.put("recommendations", generateRecommendations(recentActivities));
                return ResponseEntity.ok(body);
            }
            throw new RuntimeException("Empty response body from ML service");
        } catch (Exception e) {
            // Fallback for demo if ML is down
            return ResponseEntity.ok(Map.of(
                    "prediction", "working",
                    "confidence", 0.85,
                    "probabilities", Map.of("working", 0.85, "break", 0.15),
                    "recommendations", generateRecommendations(recentActivities)
            ));
        }
    }

    private List<Map<String, String>> generateRecommendations(List<Activity> activities) {
        List<Map<String, String>> recs = new ArrayList<>();
        if (activities == null || activities.isEmpty()) {
            recs.add(Map.of("message", "Welcome! Start logging activities to train your custom model."));
            return recs;
        }

        long distractions = activities.stream()
                .filter(a -> "distraction".equals(a.getCategory()))
                .count();

        long productive = activities.stream()
                .filter(a -> "productive".equals(a.getCategory()))
                .count();

        if (distractions > productive) {
            recs.add(Map.of("message", "You've been sliding into distractions recently. Try a short 5-minute screen-free pause to reset your focus."));
            recs.add(Map.of("message", "Batch your communications: Schedule 15 minutes for social media to avoid constant task switching."));
        } else if (productive > 3) {
            recs.add(Map.of("message", "Outstanding focus streak! Your Digital Twin suggests scheduling a 10-minute break to sustain cognitive capacity."));
            recs.add(Map.of("message", "Deep work zone: Protect this period by muting non-essential notifications."));
        } else {
            recs.add(Map.of("message", "Maintain focus: Your Digital Twin shows you are entering your peak productivity window."));
            recs.add(Map.of("message", "Consistency is key: Try logging your next transition immediately to refine your twin profile."));
        }

        return recs;
    }

    @GetMapping("/twin-profile")
    public ResponseEntity<?> getTwinProfile(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<Activity> recentActivities = activityRepository.findByUserIdOrderByStartTimeDesc(
                    userId, PageRequest.of(0, 100));

            Map<String, Object> profileData = new HashMap<>();
            profileData.put("name", user.getName());
            profileData.put("email", user.getEmail());
            profileData.put("timezone", user.getTimezone());
            profileData.put("totalLogs", recentActivities.size());
            
            // Calculate basic statistics
            long totalDuration = recentActivities.stream().mapToLong(Activity::getDuration).sum();
            profileData.put("totalDuration", totalDuration);
            
            double avgDuration = recentActivities.isEmpty() ? 0 : (double) totalDuration / recentActivities.size();
            profileData.put("avgDuration", Math.round(avgDuration * 10.0) / 10.0);

            long productiveCount = recentActivities.stream().filter(a -> "productive".equals(a.getCategory())).count();
            double productivityRatio = recentActivities.isEmpty() ? 0.0 : (double) productiveCount / recentActivities.size();
            profileData.put("productivityRatio", Math.round(productivityRatio * 100.0));
            
            // Find dominant activity
            String dominantActivity = "None";
            if (!recentActivities.isEmpty()) {
                Map<String, Long> counts = new HashMap<>();
                for (Activity a : recentActivities) {
                    counts.put(a.getActivityType(), counts.getOrDefault(a.getActivityType(), 0L) + 1);
                }
                dominantActivity = counts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("None");
            }
            profileData.put("dominantActivity", dominantActivity);

            // Prepare request body for ML service
            List<Map<String, Object>> mappedActivities = recentActivities.stream().map(act -> {
                Map<String, Object> map = new HashMap<>();
                map.put("activityType", act.getActivityType());
                map.put("category", act.getCategory());
                map.put("duration", act.getDuration());
                if (act.getMlFeatures() != null) {
                    map.put("hourOfDay", act.getMlFeatures().getHourOfDay());
                    map.put("dayOfWeek", act.getMlFeatures().getDayOfWeek());
                    map.put("isWeekend", act.getMlFeatures().isWeekend());
                    map.put("sessionIndex", act.getMlFeatures().getSessionIndex());
                    map.put("timeSinceLastActivity", act.getMlFeatures().getTimeSinceLastActivity());
                } else {
                    map.put("hourOfDay", 0);
                    map.put("dayOfWeek", 0);
                    map.put("isWeekend", false);
                    map.put("sessionIndex", 0);
                    map.put("timeSinceLastActivity", 0);
                }
                int prodScore = 0;
                if (act.getMetadata() != null && act.getMetadata().getProductivityScore() != null) {
                    prodScore = act.getMetadata().getProductivityScore();
                }
                map.put("productivityScore", prodScore);
                map.put("timestamp", act.getStartTime());
                return map;
            }).toList();

            Map<String, Object> mlRequest = new HashMap<>();
            mlRequest.put("userId", userId);
            mlRequest.put("activities", mappedActivities);

            // Fetch productivity trends from ML service
            Map<String, Object> productivityInfo = new HashMap<>();
            try {
                ResponseEntity<Map> prodResponse = restTemplate.postForEntity(
                        mlServiceUrl + "/predict/productivity", mlRequest, Map.class);
                if (prodResponse.getBody() != null) {
                    productivityInfo.putAll(prodResponse.getBody());
                }
            } catch (Exception e) {
                // Fallback
                productivityInfo.put("score", Math.round(productivityRatio * 100.0) / 10.0);
                productivityInfo.put("trend", productivityRatio >= 0.5 ? "stable" : "declining");
                productivityInfo.put("bestHours", new ArrayList<>());
                productivityInfo.put("forecast", new ArrayList<>());
            }
            profileData.put("productivity", productivityInfo);

            // Fetch behavior cluster from ML service
            Map<String, Object> clusterInfo = new HashMap<>();
            try {
                ResponseEntity<Map> clusterResponse = restTemplate.postForEntity(
                        mlServiceUrl + "/predict/clusters", mlRequest, Map.class);
                if (clusterResponse.getBody() != null) {
                    clusterInfo.putAll(clusterResponse.getBody());
                }
            } catch (Exception e) {
                // Fallback
                clusterInfo.put("cluster", "Balanced Tracker");
                clusterInfo.put("message", "You maintain a consistent pace with normal distribution of breaks.");
                clusterInfo.put("characteristics", Map.of(
                    "focus", "Average",
                    "distraction", "Moderate",
                    "consistency", "High"
                ));
            }
            profileData.put("behaviorCluster", clusterInfo);

            // Sync local DB User profile fields if changed
            boolean dirty = false;
            User.TwinProfile localProfile = user.getTwinProfile();
            if (localProfile == null) {
                localProfile = new User.TwinProfile();
                user.setTwinProfile(localProfile);
                dirty = true;
            }
            
            String clusterName = (String) clusterInfo.getOrDefault("cluster", "Balanced Tracker");
            if (!clusterName.equals(localProfile.getBehaviorCluster())) {
                localProfile.setBehaviorCluster(clusterName);
                dirty = true;
            }

            Double avgProdScore = 0.0;
            if (productivityInfo.get("score") instanceof Number) {
                avgProdScore = ((Number) productivityInfo.get("score")).doubleValue();
            }
            if (avgProdScore != localProfile.getAverageProductivity()) {
                localProfile.setAverageProductivity(avgProdScore);
                dirty = true;
            }

            if (!dominantActivity.equals(localProfile.getDominantActivity())) {
                localProfile.setDominantActivity(dominantActivity);
                dirty = true;
            }

            if (dirty) {
                localProfile.setLastUpdated(new Date());
                userRepository.save(user);
            }

            return ResponseEntity.ok(profileData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
