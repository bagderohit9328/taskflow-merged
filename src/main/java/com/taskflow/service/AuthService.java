package com.taskflow.service;

import com.taskflow.dto.AuthDTOs.*;
import com.taskflow.entity.PasswordResetToken;
import com.taskflow.entity.User;
import com.taskflow.repository.PasswordResetTokenRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.security.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.base-url:http://localhost:8080}")
    private String frontendBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${app.password-reset.token-expiration-minutes:30}")
    private int resetTokenExpirationMinutes;

    @org.springframework.beans.factory.annotation.Value("${app.password-reset.debug-return-token:false}")
    private boolean debugReturnResetToken;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtils.generateJwtToken(authentication);

        return LoginResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .email(userDetails.getEmail())
                .role(userDetails.getRole())
                .build();
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(User.Role.VIEWER)
                .active(true)
                .build();

        return UserResponse.from(userRepository.save(user));
    }

    public GenericMessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim();

        final String[] createdToken = new String[] { null };
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString().replace("-", "");
            createdToken[0] = token;
            LocalDateTime now = LocalDateTime.now();
            PasswordResetToken prt = PasswordResetToken.builder()
                    .token(token)
                    .user(user)
                    .expiresAt(now.plusMinutes(resetTokenExpirationMinutes))
                    .build();
            passwordResetTokenRepository.save(prt);

            String link = frontendBaseUrl != null
                    ? frontendBaseUrl.replaceAll("/+$", "") + "/reset-password?token=" + token
                    : null;
            notificationService.sendPasswordResetEmail(user, link, token);
        });

        // Do not reveal whether the email exists.
        if (debugReturnResetToken && createdToken[0] != null) {
            return GenericMessageResponse.builder()
                    .message("DEV MODE: reset token = " + createdToken[0])
                    .build();
        }
        return GenericMessageResponse.builder()
                .message("If that email exists, a password reset link has been sent.")
                .build();
    }

    @Transactional
    public GenericMessageResponse resetPassword(ResetPasswordRequest request) {
        String token = request.getToken().trim();
        PasswordResetToken prt = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token."));

        LocalDateTime now = LocalDateTime.now();
        if (prt.isUsed() || prt.isExpired(now)) {
            throw new IllegalArgumentException("Invalid or expired reset token.");
        }

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        prt.setUsedAt(now);
        passwordResetTokenRepository.save(prt);

        return GenericMessageResponse.builder()
                .message("Password has been reset successfully.")
                .build();
    }
}
