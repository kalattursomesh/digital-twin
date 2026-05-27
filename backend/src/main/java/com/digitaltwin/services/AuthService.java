package com.digitaltwin.services;

import com.digitaltwin.dto.AuthDto;
import com.digitaltwin.models.User;
import com.digitaltwin.repository.UserRepository;
import com.digitaltwin.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthDto.AuthResponse signup(AuthDto.SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        user = userRepository.save(user);

        return buildResponse(user);
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        return buildResponse(user);
    }
    
    public User getCurrentUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private AuthDto.AuthResponse buildResponse(User user) {
        String token = tokenProvider.generateToken(user.getId());
        AuthDto.AuthResponse res = new AuthDto.AuthResponse();
        res.set_id(user.getId());
        res.setName(user.getName());
        res.setEmail(user.getEmail());
        res.setToken(token);
        res.setTwinProfile(user.getTwinProfile());
        res.setPreferences(user.getPreferences());
        return res;
    }
}
