package com.attendance.app.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateAttendanceException extends RuntimeException {

    public DuplicateAttendanceException(Long studentId, String date) {
        super("Attendance already marked for student " + studentId + " on " + date);
    }
}