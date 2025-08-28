const logger = require('./logger');

class ValidationUtils {
    static validateIncidentData(data) {
        const errors = [];

        if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 5) {
            errors.push('Title must be at least 5 characters long');
        }

        if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters long');
        }

        if (data.severity && !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(data.severity)) {
            errors.push('Severity must be one of: CRITICAL, HIGH, MEDIUM, LOW');
        }

        if (data.category && !['BOMB_THREAT', 'SUSPICIOUS_ACTIVITY', 'EMERGENCY', 'SECURITY_BREACH', 'OTHER'].includes(data.category)) {
            errors.push('Invalid incident category');
        }

        if (data.location) {
            const locationErrors = this.validateLocation(data.location);
            errors.push(...locationErrors);
        }

        if (data.reporterPhone && !this.validatePhoneNumber(data.reporterPhone)) {
            errors.push('Invalid phone number format');
        }

        if (data.reporterEmail && !this.validateEmail(data.reporterEmail)) {
            errors.push('Invalid email format');
        }

        return errors;
    }

    static validateLocation(location) {
        const errors = [];

        if (typeof location !== 'object') {
            errors.push('Location must be an object');
            return errors;
        }

        if (location.latitude !== undefined) {
            if (typeof location.latitude !== 'number' || Math.abs(location.latitude) > 90) {
                errors.push('Latitude must be a number between -90 and 90');
            }
        }

        if (location.longitude !== undefined) {
            if (typeof location.longitude !== 'number' || Math.abs(location.longitude) > 180) {
                errors.push('Longitude must be a number between -180 and 180');
            }
        }

        if (location.accuracy !== undefined) {
            if (typeof location.accuracy !== 'number' || location.accuracy < 0) {
                errors.push('Accuracy must be a positive number');
            }
        }

        return errors;
    }

    static validateResponderData(data) {
        const errors = [];

        if (!data.responderId || typeof data.responderId !== 'string') {
            errors.push('Responder ID is required');
        }

        if (!data.type || !['POLICE', 'FIRE', 'MEDICAL', 'BOMB_SQUAD', 'SPECIAL_FORCES'].includes(data.type)) {
            errors.push('Invalid responder type');
        }

        if (data.vehicleId && typeof data.vehicleId !== 'string') {
            errors.push('Vehicle ID must be a string');
        }

        if (data.contact) {
            if (data.contact.phone && !this.validatePhoneNumber(data.contact.phone)) {
                errors.push('Invalid contact phone number');
            }
            if (data.contact.email && !this.validateEmail(data.contact.email)) {
                errors.push('Invalid contact email');
            }
        }

        return errors;
    }

    static validateLocationUpdate(data) {
        const errors = [];

        if (typeof data.latitude !== 'number' || Math.abs(data.latitude) > 90) {
            errors.push('Latitude must be a number between -90 and 90');
        }

        if (typeof data.longitude !== 'number' || Math.abs(data.longitude) > 180) {
            errors.push('Longitude must be a number between -180 and 180');
        }

        if (data.accuracy !== undefined && (typeof data.accuracy !== 'number' || data.accuracy < 0)) {
            errors.push('Accuracy must be a positive number');
        }

        if (data.heading !== undefined && (typeof data.heading !== 'number' || data.heading < 0 || data.heading >= 360)) {
            errors.push('Heading must be a number between 0 and 359');
        }

        if (data.speed !== undefined && (typeof data.speed !== 'number' || data.speed < 0)) {
            errors.push('Speed must be a positive number');
        }

        return errors;
    }

    static validateNotificationData(data) {
        const errors = [];

        if (!data.type || !['EMERGENCY_ALERT', 'INCIDENT_UPDATE', 'ASSIGNMENT', 'GENERAL'].includes(data.type)) {
            errors.push('Invalid notification type');
        }

        if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 1) {
            errors.push('Message is required');
        }

        if (data.severity && !['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(data.severity)) {
            errors.push('Invalid severity level');
        }

        if (data.targetAudience && !['ALL', 'RESPONDERS', 'COMMAND_CENTER', 'CITIZENS'].includes(data.targetAudience)) {
            errors.push('Invalid target audience');
        }

        if (data.recipients && !Array.isArray(data.recipients)) {
            errors.push('Recipients must be an array');
        }

        return errors;
    }

    static validatePhoneNumber(phone) {
        // Indian phone number validation
        const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        // Remove potentially dangerous characters
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
    }

    static sanitizeIncidentData(data) {
        const sanitized = { ...data };

        if (sanitized.title) {
            sanitized.title = this.sanitizeInput(sanitized.title);
        }

        if (sanitized.description) {
            sanitized.description = this.sanitizeInput(sanitized.description);
        }

        if (sanitized.reporterName) {
            sanitized.reporterName = this.sanitizeInput(sanitized.reporterName);
        }

        if (sanitized.location && sanitized.location.address) {
            sanitized.location.address = this.sanitizeInput(sanitized.location.address);
        }

        return sanitized;
    }

    static validateSocketEvent(eventName, data) {
        const validEvents = [
            // Incident events
            'incident:subscribe', 'incident:unsubscribe', 'incident:create',
            'incident:update_status', 'incident:get_details', 'incident:get_active',
            'incident:resolve',
            
            // Responder events
            'responder:register', 'responder:update_status', 'responder:acknowledge_assignment',
            'responder:field_update',
            
            // Location events
            'location:update', 'location:get_nearby_responders', 'location:get_all_responders',
            
            // Notification events
            'notification:emergency_alert', 'notification:incident'
        ];

        if (!validEvents.includes(eventName)) {
            logger.security('Invalid socket event attempted', { eventName, data });
            return false;
        }

        return true;
    }

    static validateFileUpload(file) {
        const errors = [];
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,video/mp4').split(',');

        if (!file) {
            errors.push('No file provided');
            return errors;
        }

        if (file.size > maxSize) {
            errors.push(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
        }

        if (!allowedTypes.includes(file.mimetype)) {
            errors.push('File type not allowed');
        }

        // Check for malicious file names
        if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
            errors.push('Invalid file name');
        }

        return errors;
    }

    static validateCoordinates(lat, lng) {
        return (
            typeof lat === 'number' &&
            typeof lng === 'number' &&
            Math.abs(lat) <= 90 &&
            Math.abs(lng) <= 180
        );
    }

    static validateRadius(radius) {
        return (
            typeof radius === 'number' &&
            radius > 0 &&
            radius <= 50000 // Max 50km radius
        );
    }

    static validatePagination(page, limit) {
        const errors = [];

        if (page !== undefined) {
            if (!Number.isInteger(page) || page < 1) {
                errors.push('Page must be a positive integer');
            }
        }

        if (limit !== undefined) {
            if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
                errors.push('Limit must be an integer between 1 and 100');
            }
        }

        return errors;
    }

    static validateDateRange(startDate, endDate) {
        const errors = [];

        if (startDate && !this.isValidDate(startDate)) {
            errors.push('Invalid start date format');
        }

        if (endDate && !this.isValidDate(endDate)) {
            errors.push('Invalid end date format');
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.push('Start date must be before end date');
        }

        return errors;
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static logValidationError(context, errors, data = {}) {
        logger.error('Validation failed', {
            context,
            errors,
            dataPreview: JSON.stringify(data).substring(0, 200)
        });
    }
}

module.exports = ValidationUtils;
