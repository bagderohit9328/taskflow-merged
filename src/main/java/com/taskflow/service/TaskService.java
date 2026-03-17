package com.taskflow.service;

import com.taskflow.dto.TaskDTOs.*;
import com.taskflow.entity.*;
import com.taskflow.repository.*;
import com.taskflow.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // ── CRUD ────────────────────────────────────────────

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        User currentUser = getCurrentUser();

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus())
                .deadline(request.getDeadline())
                .createdBy(currentUser)
                .build();

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new NoSuchElementException("Assignee not found"));
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);

        // Notify assignee via WebSocket
        if (saved.getAssignee() != null) {
            messagingTemplate.convertAndSendToUser(
                    saved.getAssignee().getUsername(),
                    "/queue/notifications",
                    Map.of("type", "TASK_ASSIGNED", "taskId", saved.getId(), "title", saved.getTitle())
            );
        }

        return TaskResponse.from(saved);
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));
        return TaskResponse.from(task);
    }

    public List<TaskResponse> getMyTasks() {
        User currentUser = getCurrentUser();
        return taskRepository.findByAssignee(currentUser).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> searchTasks(String query) {
        return taskRepository.searchTasks(query).stream()
                .map(TaskResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));

        User currentUser = getCurrentUser();
        checkEditPermission(task, currentUser);

        Task.Status oldStatus = task.getStatus();

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDeadline(request.getDeadline());

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new NoSuchElementException("Assignee not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        // Notify on status change
        if (request.getStatus() != null && request.getStatus() != oldStatus) {
            task.setStatus(request.getStatus());
            broadcastTaskUpdate(task, "STATUS_CHANGED");
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateStatus(Long id, Task.Status status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));

        task.setStatus(status);
        Task saved = taskRepository.save(task);
        broadcastTaskUpdate(saved, "STATUS_CHANGED");
        return TaskResponse.from(saved);
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));

        User currentUser = getCurrentUser();
        // Only ADMIN or task creator can delete
        if (currentUser.getRole() != User.Role.ADMIN
                && !task.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You don't have permission to delete this task");
        }

        taskRepository.delete(task);
    }

    // ── Analytics / Reports ─────────────────────────────

    public ReportResponse generateReport() {
        List<Task> allTasks = taskRepository.findAll();
        long total = allTasks.size();
        long done = allTasks.stream().filter(t -> t.getStatus() == Task.Status.DONE).count();
        long inProgress = allTasks.stream().filter(t -> t.getStatus() == Task.Status.IN_PROGRESS).count();
        long overdue = taskRepository.findOverdueTasks(LocalDate.now()).size();

        // By status
        List<StatusCount> byStatus = Arrays.stream(Task.Status.values())
                .map(s -> new StatusCount(s, allTasks.stream().filter(t -> t.getStatus() == s).count()))
                .collect(Collectors.toList());

        // By priority
        List<PriorityCount> byPriority = Arrays.stream(Task.Priority.values())
                .map(p -> new PriorityCount(p, allTasks.stream().filter(t -> t.getPriority() == p).count()))
                .collect(Collectors.toList());

        // Per user
        List<Object[]> userRows = taskRepository.getTasksPerUser();
        List<UserPerformance> byUser = userRows.stream().map(row -> {
            String username = (String) row[0];
            long userTotal = ((Number) row[1]).longValue();
            long userDone = ((Number) row[2]).longValue();
            double rate = userTotal > 0 ? (double) userDone / userTotal * 100 : 0;
            return new UserPerformance(username, userTotal, userDone, Math.round(rate * 10.0) / 10.0);
        }).collect(Collectors.toList());

        return ReportResponse.builder()
                .totalTasks(total)
                .completedTasks(done)
                .inProgressTasks(inProgress)
                .overdueTasks(overdue)
                .completionRate(total > 0 ? Math.round((double) done / total * 1000) / 10.0 : 0)
                .byStatus(byStatus)
                .byPriority(byPriority)
                .byUser(byUser)
                .build();
    }

    // ── Helpers ─────────────────────────────────────────

    private void checkEditPermission(Task task, User user) {
        if (user.getRole() == User.Role.VIEWER) {
            throw new AccessDeniedException("Viewers cannot edit tasks");
        }
        // Non-admins can only edit tasks they created or are assigned to
        if (user.getRole() != User.Role.ADMIN
                && user.getRole() != User.Role.MANAGER
                && !task.getCreatedBy().getId().equals(user.getId())
                && (task.getAssignee() == null || !task.getAssignee().getId().equals(user.getId()))) {
            throw new AccessDeniedException("You can only edit tasks you created or are assigned to");
        }
    }

    private void broadcastTaskUpdate(Task task, String type) {
        messagingTemplate.convertAndSend("/topic/tasks",
                Map.of("type", type, "taskId", task.getId(),
                       "status", task.getStatus(), "title", task.getTitle()));
    }

    public User getCurrentUser() {
        UserDetailsImpl principal = (UserDetailsImpl)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new NoSuchElementException("Current user not found"));
    }
}
