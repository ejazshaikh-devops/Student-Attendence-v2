package com.attendance.app.controller;

import com.attendance.app.repository.AttendanceRepository;
import com.attendance.app.repository.StudentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;

    public DashboardController(StudentRepository studentRepository,
                               AttendanceRepository attendanceRepository) {
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return Map.of(
                "classStrength", studentRepository.count(),
                "totalAttendanceRecords", attendanceRepository.count()
        );
    }
}