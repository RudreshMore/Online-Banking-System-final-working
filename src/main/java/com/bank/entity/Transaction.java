package com.bank.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sender account (null for admin deposit)
    private String fromAccount;

    // Receiver account
    private String toAccount;

    private double amount;

    // DEBIT / CREDIT / ADMIN_DEPOSIT
    private String type;

    @Column(nullable = false)
    private LocalDateTime transactionDate;
}
