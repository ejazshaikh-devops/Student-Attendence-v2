package com.attendance.app.controller;

import com.attendance.app.repository.AttendanceRepository;
import com.attendance.app.repository.StudentRepository;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;

@RestController
@RequestMapping("/class")
public class ClassStatsController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public ClassStatsController(AttendanceRepository attendanceRepository,
                                StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/strength")
    public long classStrength() {
        return studentRepository.count();
    }

    // FIX: use SQL COUNT instead of loading all records into memory
    @GetMapping("/average")
    public double classAverage() {
        long total = attendanceRepository.count();
        if (total == 0) return 0.0;
        long present = attendanceRepository.countPresent();
        return (present * 100.0) / total;
    }

    // FIX: divide by actual record count, not hardcoded 6
    @GetMapping("/weekly-average")
    public double weeklyAverage() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.with(DayOfWeek.MONDAY);
        LocalDate end = today.with(DayOfWeek.SATURDAY);

        long total = attendanceRepository.countByDateBetween(start, end);
        if (total == 0) return 0.0;

        long present = attendanceRepository.countPresentByDateBetween(start, end);
        return (present * 100.0) / total;
    }

    // FIX: same issue — divide by actual records not hardcoded 6
    @GetMapping("/performance/{studentId}")
    public double performance(@PathVariable Long studentId) {
        LocalDate today = LocalDate.now();
        LocalDate start = today.with(DayOfWeek.MONDAY);
        LocalDate end = today.with(DayOfWeek.SATURDAY);

        var records = attendanceRepository.findByStudentIdAndDateBetween(studentId, start, end);
        if (records.isEmpty()) return 0.0;

        long present = records.stream().filter(a -> a.isPresent()).count();
        return (present * 10.0) / records.size();
    }
}