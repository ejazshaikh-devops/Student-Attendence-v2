package com.attendance.app.model;

import jakarta.persistence.*;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String batch;
    private String email;  // used as student login password

    public Long getId()           { return id; }
    public void setId(Long id)    { this.id = id; }

    public String getName()             { return name; }
    public void setName(String name)    { this.name = name; }

    public String getBatch()              { return batch; }
    public void setBatch(String batch)    { this.batch = batch; }

    public String getEmail()              { return email; }
    public void setEmail(String email)    { this.email = email; }
}