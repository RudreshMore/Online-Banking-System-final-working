package com.bank.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bank.entity.Account;
import com.bank.entity.User;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByUser(User user);

    Optional<Account> findByUserId(Long userId); // ✅ REQUIRED FOR ADMIN DEPOSIT

    Optional<Account> findByAccountNumber(String accountNumber);

    void deleteByUser(User user);
}
