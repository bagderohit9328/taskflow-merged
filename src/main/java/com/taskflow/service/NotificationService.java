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
            message.setSubject("[Amdox Task Flow] New task assigned: " + task.getTitle());
            message.setText(
                "Hello " + task.getAssignee().getFullName() + ",\n\n" +
                "You have been assigned a new task:\n\n" +
                "Title    : " + task.getTitle() + "\n" +
                "Priority : " + task.getPriority() + "\n" +
                "Deadline : " + (task.getDeadline() != null ? task.getDeadline() : "No deadline") + "\n\n" +
                (task.getDescription() != null ? "Description:\n" + task.getDescription() + "\n\n" : "") +
                "Log in to Amdox Task Flow to view details.\n\n" +
                "— The Amdox Task Flow Team"
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
            message.setSubject("[Amdox Task Flow] Deadline reminder: " + task.getTitle());
            message.setText(
                "Hello " + task.getAssignee().getFullName() + ",\n\n" +
                "This is a reminder that the following task is due soon:\n\n" +
                "Title    : " + task.getTitle() + "\n" +
                "Priority : " + task.getPriority() + "\n" +
                "Deadline : " + task.getDeadline() + "\n" +
                "Status   : " + task.getStatus() + "\n\n" +
                "Please update your progress in Amdox Task Flow.\n\n" +
                "— The Amdox Task Flow Team"
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
            message.setSubject("[Amdox Task Flow] Your role has been updated");
            message.setText(
                "Hello " + user.getFullName() + ",\n\n" +
                "Your role in Amdox Task Flow has been updated to: " + newRole + "\n\n" +
                "If you believe this is a mistake, please contact your administrator.\n\n" +
                "— The Amdox Task Flow Team"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send role change email: {}", e.getMessage());
        }
    }

    public void sendPasswordResetEmail(User user, String resetLink, String token) {
        if (user == null || user.getEmail() == null) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("[Amdox Task Flow] Reset your password");
            String body =
                    "Hello " + (user.getFullName() != null ? user.getFullName() : user.getUsername()) + ",\n\n" +
                    "We received a request to reset your Amdox Task Flow password.\n\n" +
                    (resetLink != null
                            ? ("Open this link to reset your password:\n" + resetLink + "\n\n")
                            : "") +
                    "If you don't have a reset page, you can use this token with the API:\n\n" +
                    "Token: " + token + "\n\n" +
                    "If you did not request this, you can ignore this email.\n\n" +
                    "— The Amdox Task Flow Team";
            message.setText(body);
            mailSender.send(message);
            log.info("Password reset email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Failed to send password reset email: {}", e.getMessage());
        }
    }
}
