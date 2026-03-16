package com.taskflow.dto;

import com.taskflow.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;

// ── Login ──────────────────────────────────────────────
public class AuthDTOs {

    @Getter @Setter
    public static class LoginRequest {
        @NotBlank private String username;
        @NotBlank private String password;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class LoginResponse {
        private String token;
        private String type = "Bearer";
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private User.Role role;
    }

    @Getter @Setter
    public static class RegisterRequest {
        @NotBlank @Size(min = 3, max = 50) private String username;
        @NotBlank @Email private String email;
        @NotBlank @Size(min = 6, max = 100) private String password;
        private String fullName;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class UserResponse {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private User.Role role;
        private boolean active;
        private String createdAt;

        public static UserResponse from(User u) {
            return UserResponse.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .email(u.getEmail())
                    .fullName(u.getFullName())
                    .role(u.getRole())
                    .active(u.isActive())
                    .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                    .build();
        }
    }
}
