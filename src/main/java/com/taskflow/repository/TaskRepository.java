package com.taskflow.repository;

import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignee(User assignee);

    List<Task> findByCreatedBy(User creator);

    List<Task> findByStatus(Task.Status status);

    List<Task> findByPriority(Task.Priority priority);

    List<Task> findByAssigneeAndStatus(User assignee, Task.Status status);

    // Tasks with deadlines approaching (for reminders)
    @Query("SELECT t FROM Task t WHERE t.deadline <= :daysAhead " +
           "AND t.status != 'DONE' AND t.reminderSent = false")
    List<Task> findTasksWithUpcomingDeadlines(@Param("daysAhead") LocalDate daysAhead);

    // Overdue tasks
    @Query("SELECT t FROM Task t WHERE t.deadline < :today AND t.status != 'DONE'")
    List<Task> findOverdueTasks(@Param("today") LocalDate today);

    // Search tasks by title or description
    @Query("SELECT t FROM Task t WHERE LOWER(t.title) LIKE LOWER(CONCAT('%',:q,'%')) " +
           "OR LOWER(t.description) LIKE LOWER(CONCAT('%',:q,'%'))")
    List<Task> searchTasks(@Param("q") String query);

    // Report: count by status
    @Query("SELECT t.status, COUNT(t) FROM Task t GROUP BY t.status")
    List<Object[]> countByStatus();

    // Report: count by priority
    @Query("SELECT t.priority, COUNT(t) FROM Task t GROUP BY t.priority")
    List<Object[]> countByPriority();

    // Report: tasks per user
    @Query("SELECT t.assignee.username, COUNT(t), " +
           "SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) " +
           "FROM Task t WHERE t.assignee IS NOT NULL GROUP BY t.assignee.username")
    List<Object[]> getTasksPerUser();
}
