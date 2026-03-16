package com.taskflow.repository;

import com.taskflow.entity.Task;
import com.taskflow.entity.TaskFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskFileRepository extends JpaRepository<TaskFile, Long> {
    List<TaskFile> findByTask(Task task);
}
