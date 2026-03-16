package com.taskflow.controller;

import com.taskflow.entity.TaskFile;
import com.taskflow.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Path;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    @PostMapping("/tasks/{taskId}/files")
    public ResponseEntity<?> uploadFile(@PathVariable Long taskId,
                                         @RequestParam("file") MultipartFile file) {
        try {
            TaskFile saved = fileService.uploadFile(taskId, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    java.util.Map.of(
                        "id", saved.getId(),
                        "originalName", saved.getOriginalName(),
                        "size", saved.getFileSize(),
                        "contentType", saved.getContentType()
                    )
            );
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("File upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        TaskFile meta = fileService.getFileMetadata(fileId);
        Path path = fileService.getFilePath(fileId);
        Resource resource = new FileSystemResource(path);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        meta.getContentType() != null ? meta.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + meta.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) throws IOException {
        fileService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }
}
