package com.taskflow.dto;

import com.taskflow.entity.Comment;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class CommentDTOs {

    @Getter @Setter
    public static class CommentRequest {
        @NotBlank
        private String content;
    }

    @Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
    public static class CommentResponse {
        private Long id;
        private String content;
        private Long taskId;
        private TaskDTOs.AssigneeInfo author;
        private String createdAt;
        private String updatedAt;

        public static CommentResponse from(Comment c) {
            return CommentResponse.builder()
                    .id(c.getId())
                    .content(c.getContent())
                    .taskId(c.getTask().getId())
                    .author(TaskDTOs.AssigneeInfo.from(c.getAuthor()))
                    .createdAt(c.getCreatedAt() != null ? c.getCreatedAt().toString() : null)
                    .updatedAt(c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null)
                    .build();
        }
    }
}
