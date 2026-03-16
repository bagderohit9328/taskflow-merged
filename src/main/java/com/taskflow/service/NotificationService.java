package com.taskflow.service;

import com.taskflow.entity.Task;
import com.taskflow.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    public void sendTaskAssignmentEmail(Task task) {
        if (task.getAssignee() == null || task.getAssignee().getEmail() == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(task.getAssignee().getEmail());
            message.setSubject("[TaskFlow] New task assigned: " + task.getTitle());
            message.setText(
                "Hello " + task.getAssignee().getFullName() + ",\n\n" +
                "You have been assigned a new task:\n\n" +
                "Title    : " + task.getTitle() + "\n" +
                "Priority : " + task.getPriority() + "\n" +
                "Deadline : " + (task.getDeadline() != null ? task.getDeadline() : "No deadline") + "\n\n" +
                (task.getDescription() != null ? "Description:\n" + task.getDescription() + "\n\n" : "") +
                "Log in to TaskFlow to view details.\n\n" +
                "— The TaskFlow Team"
            );
            mailSender.send(message);
            log.info("Assignment email sent to {}", task.getAssignee().getEmail());
        } catch (Exception e) {
            log.error("Failed to send assignment email: {}", e.getMessage());
        }
    }

    public void sendDeadlineReminderEmail(Task task) {
        if (task.getAssignee() == null || task.getAssignee().getEmail() == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(task.getAssignee().getEmail());
            message.setSubject("[TaskFlow] Deadline reminder: " + task.getTitle());
            message.setText(
                "Hello " + task.getAssignee().getFullName() + ",\n\n" +
                "This is a reminder that the following task is due soon:\n\n" +
                "Title    : " + task.getTitle() + "\n" +
                "Priority : " + task.getPriority() + "\n" +
                "Deadline : " + task.getDeadline() + "\n" +
                "Status   : " + task.getStatus() + "\n\n" +
                "Please update your progress in TaskFlow.\n\n" +
                "— The TaskFlow Team"
            );
            mailSender.send(message);
            log.info("Deadline reminder sent to {}", task.getAssignee().getEmail());
        } catch (Exception e) {
            log.error("Failed to send deadline reminder: {}", e.getMessage());
        }
    }

    public void sendRoleChangeEmail(User user, User.Role newRole) {
        if (user.getEmail() == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("[TaskFlow] Your role has been updated");
            message.setText(
                "Hello " + user.getFullName() + ",\n\n" +
                "Your role in TaskFlow has been updated to: " + newRole + "\n\n" +
                "If you believe this is a mistake, please contact your administrator.\n\n" +
                "— The TaskFlow Team"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send role change email: {}", e.getMessage());
        }
    }
}
