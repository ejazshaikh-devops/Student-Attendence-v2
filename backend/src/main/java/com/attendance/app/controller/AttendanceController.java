package com.attendance.app.controller;

import com.attendance.app.exception.DuplicateAttendanceException;
import com.attendance.app.exception.ResourceNotFoundException;
import com.attendance.app.model.Attendance;
import com.attendance.app.model.Student;
import com.attendance.app.repository.AttendanceRepository;
import com.attendance.app.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private static final Logger log = LoggerFactory.getLogger(AttendanceController.class);

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public AttendanceController(AttendanceRepository attendanceRepository,
                                StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    @PostMapping("/{studentId}")
    public Attendance markAttendance(@PathVariable Long studentId,
                                     @RequestParam boolean present,
                                     @RequestParam String date) {

        LocalDate parsedDate = LocalDate.parse(date);

        // FIX: check for duplicate before saving
        attendanceRepository.findByStudentIdAndDate(studentId, parsedDate).ifPresent(existing -> {
            throw new DuplicateAttendanceException(studentId, date);
        });

        // FIX: proper 404 instead of 500
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setPresent(present);
        attendance.setDate(parsedDate);

        log.info("Marking attendance for student {} on {} — present: {}", studentId, date, present);
        return attendanceRepository.save(attendance);
    }

    @GetMapping
    public List<Attendance> getAll() {
        return attendanceRepository.findAll();
    }

    @GetMapping("/student/{studentId}")
    public List<Attendance> getByStudent(@PathVariable Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student", studentId);
        }
        return attendanceRepository.findByStudentId(studentId);
    }
}