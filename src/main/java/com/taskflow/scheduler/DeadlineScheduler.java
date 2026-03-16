package com.taskflow.scheduler;

import com.taskflow.entity.Task;
import com.taskflow.repository.TaskRepository;
import com.taskflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class DeadlineScheduler {

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    /**
     * Runs daily at 8:00 AM.
     * Finds tasks due within 2 days that haven't sent a reminder yet.
     */
    @Scheduled(cron = "${app.scheduler.deadline-check-cron}")
    @Transactional
    public void checkDeadlines() {
        log.info("Running deadline check scheduler...");

        LocalDate twoDaysFromNow = LocalDate.now().plusDays(2);
        List<Task> upcomingTasks = taskRepository.findTasksWithUpcomingDeadlines(twoDaysFromNow);

        for (Task task : upcomingTasks) {
            try {
                notificationService.sendDeadlineReminderEmail(task);
                task.setReminderSent(true);
                taskRepository.save(task);
                log.info("Reminder sent for task [{}] '{}'", task.getId(), task.getTitle());
            } catch (Exception e) {
                log.error("Failed reminder for task {}: {}", task.getId(), e.getMessage());
            }
        }

        log.info("Deadline check complete. Processed {} tasks.", upcomingTasks.size());
    }

    /**
     * Resets reminder flags on the 1st of each month so reminders can be re-sent next month.
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void resetReminderFlags() {
        log.info("Resetting reminder flags for the new month...");
        List<Task> allIncompleteTasks = taskRepository.findByStatus(Task.Status.TODO);
        allIncompleteTasks.addAll(taskRepository.findByStatus(Task.Status.IN_PROGRESS));
        allIncompleteTasks.forEach(t -> t.setReminderSent(false));
        taskRepository.saveAll(allIncompleteTasks);
    }
}
