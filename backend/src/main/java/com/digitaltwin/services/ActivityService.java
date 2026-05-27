package com.digitaltwin.services;

import com.digitaltwin.dto.ActivityDto;
import com.digitaltwin.models.Activity;
import com.digitaltwin.models.User;
import com.digitaltwin.repository.ActivityRepository;
import com.digitaltwin.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Activity logActivity(String userId, ActivityDto.LogRequest request) {
        Activity act = new Activity();
        act.setUserId(userId);
        act.setActivityType(request.getActivityType());
        act.setDuration(request.getDuration());
        if (request.getStartTime() != null) {
            act.setStartTime(request.getStartTime());
        }

        act.calculateFieldsAndFeatures();
        act = activityRepository.save(act);

        // Notify client
        messagingTemplate.convertAndSendToUser(userId, "/topic/activity", act);

        // Check for distraction pattern
        if ("distraction".equals(act.getCategory())) {
            // Check if Focus Mode is active — this is a breach!
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                User.FocusSession focus = user.getFocusSession();
                if (focus != null && focus.isActive()) {
                    // Verify focus hasn't expired
                    if (focus.getEndTime() != null && new Date().before(focus.getEndTime())) {
                        messagingTemplate.convertAndSendToUser(userId, "/topic/alerts", Map.of(
                                "type", "focus_breach",
                                "title", "⚠️ Focus Session Breached!",
                                "message", "You logged " + act.getDuration() + " min of " + act.getActivityType().replace("_", " ") + " while in Focus Mode (\"" + focus.getLabel() + "\"). Your Twin is disappointed!",
                                "severity", "critical"
                        ));
                    }
                }
            }

            // Standard distraction detection
            Date oneHourAgo = new Date(System.currentTimeMillis() - 3600000L);
            long recentDistractions = activityRepository.countByUserIdAndCategoryAndStartTimeGreaterThanEqual(
                    userId, "distraction", oneHourAgo);

            if (recentDistractions > 1 || act.getDuration() > 20) {
                messagingTemplate.convertAndSendToUser(userId, "/topic/alerts", Map.of(
                        "type", "warning",
                        "title", "Distraction Detected",
                        "message", "You just logged " + act.getDuration() + " minutes of " + act.getActivityType().replace("_", " ") + ". Your Digital Twin predicts your productivity is dropping!"
                ));
            }
        }

        return act;
    }

    // ==================== Focus Session Management ====================

    public User.FocusSession startFocusSession(String userId, int durationMinutes, String label) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User.FocusSession session = new User.FocusSession();
        session.setActive(true);
        session.setStartTime(new Date());
        session.setDurationMinutes(durationMinutes);
        session.setEndTime(new Date(System.currentTimeMillis() + (long) durationMinutes * 60 * 1000));
        session.setLabel(label != null ? label : "Focus");

        user.setFocusSession(session);
        userRepository.save(user);

        // Notify client that focus mode started
        messagingTemplate.convertAndSendToUser(userId, "/topic/alerts", Map.of(
                "type", "info",
                "title", "🎯 Focus Mode Activated",
                "message", "Focus session \"" + session.getLabel() + "\" started for " + durationMinutes + " minutes. Stay strong!"
        ));

        return session;
    }

    public void stopFocusSession(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User.FocusSession session = new User.FocusSession();
        session.setActive(false);
        user.setFocusSession(session);
        userRepository.save(user);

        messagingTemplate.convertAndSendToUser(userId, "/topic/alerts", Map.of(
                "type", "info",
                "title", "Focus Mode Ended",
                "message", "Focus session stopped. Review your productivity on the dashboard."
        ));
    }

    public User.FocusSession getFocusSession(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User.FocusSession session = user.getFocusSession();

        // Auto-expire if past endTime
        if (session != null && session.isActive() && session.getEndTime() != null) {
            if (new Date().after(session.getEndTime())) {
                session.setActive(false);
                user.setFocusSession(session);
                userRepository.save(user);
            }
        }

        return session != null ? session : new User.FocusSession();
    }

    // ==================== Today Summary ====================

    public ActivityDto.TodaySummary getTodaySummary(String userId) {
        Date today = new Date();
        today.setHours(0); today.setMinutes(0); today.setSeconds(0);
        
        Date tomorrow = new Date(today.getTime() + 86400000L);

        List<Activity> activities = activityRepository.findByUserIdAndStartTimeBetweenOrderByStartTimeAsc(
                userId, today, tomorrow);

        long totalDuration = activities.stream().mapToLong(Activity::getDuration).sum();
        long prodDuration = activities.stream()
                .filter(a -> "productive".equals(a.getCategory()))
                .mapToLong(Activity::getDuration).sum();

        double score = totalDuration > 0 ? ((double) prodDuration / totalDuration) * 10.0 : 0.0;
        score = Math.round(score * 10.0) / 10.0;

        ActivityDto.TodaySummary summary = new ActivityDto.TodaySummary();
        summary.setTotalActivities(activities.size());
        summary.setTotalMinutes(totalDuration);
        summary.setProductivityScore(score);
        summary.setTimeline(activities);

        return summary;
    }

    public List<Activity> getActivityHistory(String userId) {
        return activityRepository.findByUserIdOrderByStartTimeDesc(userId);
    }
}
