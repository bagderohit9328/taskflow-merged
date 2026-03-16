package com.taskflow.service;

import com.taskflow.dto.CommentDTOs.*;
import com.taskflow.entity.*;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public CommentResponse addComment(Long taskId, CommentRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));

        User author = taskService.getCurrentUser();

        Comment comment = Comment.builder()
                .content(request.getContent())
                .task(task)
                .author(author)
                .build();

        Comment saved = commentRepository.save(comment);
        CommentResponse response = CommentResponse.from(saved);

        // Real-time broadcast to all users watching this task
        messagingTemplate.convertAndSend(
                "/topic/tasks/" + taskId + "/comments",
                Map.of("type", "NEW_COMMENT", "comment", response)
        );

        return response;
    }

    public List<CommentResponse> getCommentsForTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));
        return commentRepository.findByTaskOrderByCreatedAtDesc(task).stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("Comment not found: " + commentId));
        User currentUser = taskService.getCurrentUser();

        if (!comment.getAuthor().getId().equals(currentUser.getId())
                && currentUser.getRole() != User.Role.ADMIN) {
            throw new SecurityException("Cannot delete another user's comment");
        }
        commentRepository.delete(comment);
    }
}
