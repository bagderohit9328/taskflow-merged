package com.taskflow.service;

import com.taskflow.dto.AuthDTOs.*;
import com.taskflow.entity.User;
import com.taskflow.repository.UserRepository;
import com.taskflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        return UserResponse.from(userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse updateUserRole(Long userId, User.Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        user.setRole(newRole);
        User saved = userRepository.save(user);
        notificationService.sendRoleChangeEmail(saved, newRole);
        return UserResponse.from(saved);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse toggleUserActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        user.setActive(!user.isActive());
        return UserResponse.from(userRepository.save(user));
    }
}
