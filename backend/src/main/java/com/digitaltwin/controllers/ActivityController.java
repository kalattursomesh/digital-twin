package com.digitaltwin.controllers;

import com.digitaltwin.dto.ActivityDto;
import com.digitaltwin.models.User;
import com.digitaltwin.services.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @PostMapping("/log")
    public ResponseEntity<?> logActivity(@RequestBody ActivityDto.LogRequest request, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(activityService.logActivity(userId, request));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/today")
    public ResponseEntity<?> getTodaySummary(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(activityService.getTodaySummary(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== Focus Session Endpoints ====================

    @PostMapping("/focus/start")
    public ResponseEntity<?> startFocusSession(@RequestBody ActivityDto.FocusRequest request, Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            User.FocusSession session = activityService.startFocusSession(userId, request.getDuration(), request.getLabel());
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/focus/stop")
    public ResponseEntity<?> stopFocusSession(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            activityService.stopFocusSession(userId);
            return ResponseEntity.ok(Map.of("message", "Focus session stopped"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/focus/status")
    public ResponseEntity<?> getFocusStatus(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(activityService.getFocusSession(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getActivityHistory(Authentication authentication) {
        try {
            String userId = (String) authentication.getPrincipal();
            return ResponseEntity.ok(activityService.getActivityHistory(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
