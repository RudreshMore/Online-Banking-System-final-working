package com.bank.service.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bank.entity.Account;
import com.bank.entity.Transaction;
import com.bank.entity.User;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.AccountService;

@Service
@Transactional
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public AccountServiceImpl(AccountRepository accountRepository,
                              TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public Account createAccount(User user) {
        Account account = new Account();
        account.setAccountNumber("AC" + System.currentTimeMillis());
        account.setBalance(1000.0);
        account.setUser(user);
        return accountRepository.save(account);
    }

    @Override
    public Account getAccountByUser(User user) {
        return accountRepository.findByUser(user).orElse(null);
    }

    @Override
    public void deleteAccountByUser(User user) {
        accountRepository.deleteByUser(user);
    }

    // ✅ ADMIN DEPOSIT (FINAL & CORRECT)
    @Override
    public void adminDeposit(Long userId, double amount) {

        if (amount <= 0) {
            throw new RuntimeException("Amount must be greater than zero");
        }

        Account account = accountRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // 💰 update balance
        account.setBalance(account.getBalance() + amount);
        accountRepository.save(account);

        // 🧾 transaction entry
        Transaction tx = new Transaction();
        tx.setType("ADMIN_DEPOSIT");
        tx.setFromAccount("BANK");
        tx.setToAccount(account.getAccountNumber());
        tx.setAmount(amount);
        tx.setTransactionDate(LocalDateTime.now());

        transactionRepository.save(tx);
    }
}
