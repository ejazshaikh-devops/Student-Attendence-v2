package com.attendance.app.repository;

import com.attendance.app.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate start, LocalDate end);

    // FIX: check duplicate before saving
    Optional<Attendance> findByStudentIdAndDate(Long studentId, LocalDate date);

    // FIX: count in DB instead of loading all records into memory
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.present = true")
    long countPresent();

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date BETWEEN :start AND :end")
    long countByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.present = true AND a.date BETWEEN :start AND :end")
    long countPresentByDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}