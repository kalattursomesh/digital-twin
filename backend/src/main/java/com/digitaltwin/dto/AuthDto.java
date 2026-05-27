package com.digitaltwin.dto;

import lombok.Data;
import com.digitaltwin.models.User.TwinProfile;
import com.digitaltwin.models.User.Preferences;

public class AuthDto {
    
    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class SignupRequest {
        private String name;
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String _id;
        private String name;
        private String email;
        private String token;
        private TwinProfile twinProfile;
        private Preferences preferences;
    }
}
