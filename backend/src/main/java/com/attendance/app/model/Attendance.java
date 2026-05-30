package com.attendance.app.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
  @JoinColumn(name="student_id", nullable=false)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties("attendance")
private Student student;

    private LocalDate date;

    private boolean present;

    public Attendance() {}

    public Attendance(Student student, LocalDate date, boolean present) {
        this.student = student;
        this.date = date;
        this.present = present;
    }

    public Long getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public LocalDate getDate() {
        return date;
    }

    public boolean isPresent() {
        return present;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public void setPresent(boolean present) {
        this.present = present;
    }
}
