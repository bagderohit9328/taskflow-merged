package com.taskflow.dto;

import com.taskflow.entity.Task;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

public class TaskDTOs {

    @Getter @Setter
    public static class TaskRequest {
        @NotBlank @Size(max = 255)
        private String title;

        private String description;

        private Task.Priority priority = Task.Priority.MEDIUM;

        private Task.Status status = Task.Status.TODO;

        private LocalDate deadline;

        private Long assigneeId;
    }


    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class TaskResponse {
        private Long id;
        private String title;
        private String description;
        private Task.Priority priority;
        private Task.Status status;
        private LocalDate deadline;
        private boolean overdue;
        private AssigneeInfo assignee;
        private AssigneeInfo createdBy;
        private List<CommentDTOs.CommentResponse> comments;
        private long commentCount;
        private long fileCount;
        private String createdAt;
        private String updatedAt;

        public static TaskResponse from(Task t) {
            boolean overdue = t.getDeadline() != null
                    && t.getDeadline().isBefore(LocalDate.now())
                    && t.getStatus() != Task.Status.DONE;

            return TaskResponse.builder()
                    .id(t.getId())
                    .title(t.getTitle())
                    .description(t.getDescription())
                    .priority(t.getPriority())
                    .status(t.getStatus())
                    .deadline(t.getDeadline())
                    .overdue(overdue)
                    .assignee(t.getAssignee() != null ? AssigneeInfo.from(t.getAssignee()) : null)
                    .createdBy(t.getCreatedBy() != null ? AssigneeInfo.from(t.getCreatedBy()) : null)
                    .commentCount(t.getComments().size())
                    .fileCount(t.getFiles().size())
                    .createdAt(t.getCreatedAt() != null ? t.getCreatedAt().toString() : null)
                    .updatedAt(t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null)
                    .build();
        }
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class AssigneeInfo {
        private Long id;
        private String username;
        private String fullName;
        private String email;

        public static AssigneeInfo from(com.taskflow.entity.User u) {
            return AssigneeInfo.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .email(u.getEmail())
                    .build();
        }
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class ReportResponse {
        private long totalTasks;
        private long completedTasks;
        private long inProgressTasks;
        private long overdueTasks;
        private double completionRate;
        private List<StatusCount> byStatus;
        private List<PriorityCount> byPriority;
        private List<UserPerformance> byUser;
    }

    @Getter @Setter @AllArgsConstructor
    public static class StatusCount {
        private Task.Status status;
        private long count;
    }

    @Getter @Setter @AllArgsConstructor
    public static class PriorityCount {
        private Task.Priority priority;
        private long count;
    }

    @Getter @Setter @AllArgsConstructor
    public static class UserPerformance {
        private String username;
        private long total;
        private long completed;
        private double completionRate;
    }
}
