package com.taskflow.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class UserRoleConverter implements AttributeConverter<User.Role, String> {

    @Override
    public String convertToDatabaseColumn(User.Role attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public User.Role convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        String v = dbData.trim().toUpperCase();

        // Backward compatibility with older databases:
        if ("EDITOR".equals(v)) return User.Role.DEVELOPER;

        return User.Role.valueOf(v);
    }
}

