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

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks() {
        return ResponseEntity.ok(taskService.getMyTasks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<TaskResponse>> searchTasks(@RequestParam String q) {
        return ResponseEntity.ok(taskService.searchTasks(q));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER','TESTER','DEVOPS','PRODUCTION')")
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER','TESTER','DEVOPS','PRODUCTION')")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id,
                                                    @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER','TESTER','DEVOPS','PRODUCTION')")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id,
                                                      @RequestParam Task.Status status) {
        return ResponseEntity.ok(taskService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reports")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','DEVELOPER','TESTER','DEVOPS','PRODUCTION','VIEWER')")
    public ResponseEntity<ReportResponse> getReport() {
        return ResponseEntity.ok(taskService.generateReport());
    }
}
