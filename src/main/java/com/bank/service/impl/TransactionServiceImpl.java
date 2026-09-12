package com.bank.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bank.entity.Transaction;
import com.bank.repository.TransactionRepository;
import com.bank.service.TransactionService;

@Service
@Transactional
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    // ✅ USER / ADMIN VIEW TRANSACTIONS (ACCOUNT WISE)
    @Override
    public List<Transaction> getTransactions(String accountNumber) {
        return transactionRepository
                .findByFromAccountOrToAccount(accountNumber, accountNumber);
    }

    // ✅ ADMIN VIEW ALL TRANSACTIONS
    @Override
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByTransactionDateDesc();
    }

    // ✅ DELETE USER TRANSACTIONS
    @Override
    public void deleteTransactions(String accNo) {
        transactionRepository.deleteByFromAccountOrToAccount(accNo, accNo);
    }
}
