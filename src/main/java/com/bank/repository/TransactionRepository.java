package com.bank.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bank.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // USER + ADMIN (account-specific)
    List<Transaction> findByFromAccountOrToAccount(String fromAccount, String toAccount);

    // ADMIN (all)
    List<Transaction> findAllByOrderByTransactionDateDesc();

    // DELETE USER TRANSACTIONS
    void deleteByFromAccountOrToAccount(String fromAccount, String toAccount);
}
