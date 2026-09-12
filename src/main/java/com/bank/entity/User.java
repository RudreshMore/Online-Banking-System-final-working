package com.bank.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    // 🔥 REQUIRED FIELD (CAUSE OF YOUR ERROR)
    @Column(name = "mobile_number", nullable = false, length = 10)
    private String mobileNumber;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private boolean active = true;
    
    @OneToOne(mappedBy = "user")
    private Account account;

}
