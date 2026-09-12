package com.bank.service.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bank.entity.Account;
import com.bank.entity.Transaction;
import com.bank.exception.InsufficientBalanceException;
import com.bank.repository.AccountRepository;
import com.bank.repository.TransactionRepository;
import com.bank.service.TransferService;

@Service
@Transactional
public class TransferServiceImpl implements TransferService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public TransferServiceImpl(AccountRepository accountRepository,
                               TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    public void transferMoney(String fromAccNo,
                              String toAccNo,
                              double amount) {

        if (amount <= 0) {
            throw new RuntimeException("Invalid transfer amount");
        }

        if (fromAccNo.equals(toAccNo)) {
            throw new RuntimeException("Sender and receiver cannot be same");
        }

        Account sender = accountRepository.findByAccountNumber(fromAccNo)
                .orElseThrow(() -> new RuntimeException("Sender account not found"));

        Account receiver = accountRepository.findByAccountNumber(toAccNo)
                .orElseThrow(() -> new RuntimeException("Receiver account not found"));

        if (sender.getBalance() < amount) {
            throw new InsufficientBalanceException("Insufficient balance");
        }

        // 🔥 UPDATE BALANCES
        sender.setBalance(sender.getBalance() - amount);
        receiver.setBalance(receiver.getBalance() + amount);

        accountRepository.save(sender);
        accountRepository.save(receiver);

        // 🔴 DEBIT TRANSACTION
        Transaction debit = new Transaction();
        debit.setType("DEBIT");
        debit.setFromAccount(fromAccNo);
        debit.setToAccount(toAccNo);
        debit.setAmount(amount);
        debit.setTransactionDate(LocalDateTime.now());
        transactionRepository.save(debit);

        // 🟢 CREDIT TRANSACTION
        Transaction credit = new Transaction();
        credit.setType("CREDIT");
        credit.setFromAccount(fromAccNo);
        credit.setToAccount(toAccNo);
        credit.setAmount(amount);
        credit.setTransactionDate(LocalDateTime.now());
        transactionRepository.save(credit);
    }
}
