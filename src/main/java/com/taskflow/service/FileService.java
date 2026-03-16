package com.taskflow.service;

import com.taskflow.entity.*;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final TaskFileRepository fileRepository;
    private final TaskRepository taskRepository;
    private final TaskService taskService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Transactional
    public TaskFile uploadFile(Long taskId, MultipartFile file) throws IOException {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));

        User uploader = taskService.getCurrentUser();

        // Build safe file path
        String extension = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            extension = original.substring(original.lastIndexOf("."));
        }
        String storedName = UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir).resolve("tasks").resolve(String.valueOf(taskId));
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        TaskFile taskFile = TaskFile.builder()
                .originalName(original)
                .storedName(storedName)
                .filePath(filePath.toString())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .task(task)
                .uploadedBy(uploader)
                .build();

        return fileRepository.save(taskFile);
    }

    public Path getFilePath(Long fileId) {
        TaskFile taskFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new NoSuchElementException("File not found: " + fileId));
        return Paths.get(taskFile.getFilePath());
    }

    public TaskFile getFileMetadata(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new NoSuchElementException("File not found: " + fileId));
    }

    @Transactional
    public void deleteFile(Long fileId) throws IOException {
        TaskFile taskFile = fileRepository.findById(fileId)
                .orElseThrow(() -> new NoSuchElementException("File not found: " + fileId));

        Files.deleteIfExists(Paths.get(taskFile.getFilePath()));
        fileRepository.delete(taskFile);
    }
}
