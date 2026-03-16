package com.taskflow.config;

import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded — skipping DataInitializer.");
            return;
        }

        log.info("Seeding demo data…");

        // ── Users ──────────────────────────────────────────────────────────
        User admin = userRepository.save(User.builder()
                .username("admin")
                .email("admin@taskflow.com")
                .password(passwordEncoder.encode("admin123"))
                .fullName("Alex Ray")
                .role(User.Role.ADMIN)
                .active(true)
                .build());

        User editor1 = userRepository.save(User.builder()
                .username("sarah")
                .email("sarah@taskflow.com")
                .password(passwordEncoder.encode("sarah123"))
                .fullName("Sarah Kim")
                .role(User.Role.EDITOR)
                .active(true)
                .build());

        User editor2 = userRepository.save(User.builder()
                .username("mike")
                .email("mike@taskflow.com")
                .password(passwordEncoder.encode("mike123"))
                .fullName("Mike Desai")
                .role(User.Role.EDITOR)
                .active(true)
                .build());

        User viewer = userRepository.save(User.builder()
                .username("priya")
                .email("priya@taskflow.com")
                .password(passwordEncoder.encode("priya123"))
                .fullName("Priya Sharma")
                .role(User.Role.VIEWER)
                .active(true)
                .build());

        // ── Tasks ──────────────────────────────────────────────────────────
        taskRepository.save(Task.builder()
                .title("Implement JWT authentication")
                .description("Set up Spring Security with JWT tokens for stateless auth. Include refresh token flow.")
                .priority(Task.Priority.CRITICAL)
                .status(Task.Status.IN_PROGRESS)
                .deadline(LocalDate.now().plusDays(2))
                .assignee(admin)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Design dashboard UI wireframes")
                .description("Create high-fidelity wireframes for the main dashboard, task list, and report pages.")
                .priority(Task.Priority.HIGH)
                .status(Task.Status.IN_REVIEW)
                .deadline(LocalDate.now().plusDays(4))
                .assignee(editor1)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Set up MySQL schema and migrations")
                .description("Create all tables: users, tasks, comments, task_files. Add indexes for performance.")
                .priority(Task.Priority.CRITICAL)
                .status(Task.Status.DONE)
                .deadline(LocalDate.now().minusDays(2))
                .assignee(editor2)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Build REST endpoints for tasks")
                .description("Implement CRUD endpoints for tasks including search, filter by status and priority.")
                .priority(Task.Priority.HIGH)
                .status(Task.Status.IN_PROGRESS)
                .deadline(LocalDate.now().plusDays(6))
                .assignee(admin)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Real-time WebSocket comments")
                .description("Integrate STOMP/SockJS for live comment streaming on task detail view.")
                .priority(Task.Priority.MEDIUM)
                .status(Task.Status.TODO)
                .deadline(LocalDate.now().plusDays(12))
                .assignee(viewer)
                .createdBy(editor1)
                .build());

        taskRepository.save(Task.builder()
                .title("Role-based access control")
                .description("Enforce ADMIN / EDITOR / VIEWER permissions across all API endpoints using @PreAuthorize.")
                .priority(Task.Priority.HIGH)
                .status(Task.Status.IN_PROGRESS)
                .deadline(LocalDate.now().plusDays(5))
                .assignee(editor1)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("File upload for task attachments")
                .description("Allow users to attach files to tasks. Store on server filesystem, expose download URL.")
                .priority(Task.Priority.MEDIUM)
                .status(Task.Status.TODO)
                .deadline(LocalDate.now().plusDays(17))
                .assignee(editor2)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Deadline notification scheduler")
                .description("Run daily cron at 8 AM to send email reminders for tasks due within 2 days.")
                .priority(Task.Priority.HIGH)
                .status(Task.Status.DONE)
                .deadline(LocalDate.now().minusDays(3))
                .assignee(viewer)
                .createdBy(admin)
                .build());

        taskRepository.save(Task.builder()
                .title("Progress and analytics report")
                .description("Build report API endpoint with completion rates, per-user performance, and priority breakdown.")
                .priority(Task.Priority.MEDIUM)
                .status(Task.Status.TODO)
                .deadline(LocalDate.now().plusDays(20))
                .assignee(admin)
                .createdBy(editor1)
                .build());

        taskRepository.save(Task.builder()
                .title("Write API documentation")
                .description("Document all REST endpoints using comments and optionally integrate Swagger/OpenAPI.")
                .priority(Task.Priority.LOW)
                .status(Task.Status.TODO)
                .deadline(LocalDate.now().plusDays(25))
                .assignee(editor2)
                .createdBy(admin)
                .build());

        log.info("Demo data seeded: 4 users, 10 tasks.");
        log.info("Login credentials — admin/admin123  sarah/sarah123  mike/mike123  priya/priya123");
    }
}
