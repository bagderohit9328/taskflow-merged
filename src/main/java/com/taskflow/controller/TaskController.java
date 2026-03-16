package com.taskflow.controller;

import com.taskflow.dto.TaskDTOs.*;
import com.taskflow.entity.Task;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // GET /api/tasks — all tasks (ADMIN + EDITOR see all, VIEWER sees only assigned)
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    // GET /api/tasks/my — current user's tasks
    @GetMapping("/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        return ResponseEntity.ok(taskService.getMyTasks());
    }

    // GET /api/tasks/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    // GET /api/tasks/search?q=keyword
    @GetMapping("/search")
    public ResponseEntity<List<TaskResponse>> searchTasks(@RequestParam String q) {
        return ResponseEntity.ok(taskService.searchTasks(q));
    }

    // POST /api/tasks — ADMIN or EDITOR only
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request));
    }

    // PUT /api/tasks/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id,
                                                    @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    // PATCH /api/tasks/{id}/status — quick status update
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id,
                                                      @RequestParam Task.Status status) {
        return ResponseEntity.ok(taskService.updateStatus(id, status));
    }

    // DELETE /api/tasks/{id} — ADMIN only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/tasks/reports
    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN','EDITOR')")
    public ResponseEntity<ReportResponse> getReport() {
        return ResponseEntity.ok(taskService.generateReport());
    }
}
