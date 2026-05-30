package com.attendance.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.attendance.app.model.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {
}
