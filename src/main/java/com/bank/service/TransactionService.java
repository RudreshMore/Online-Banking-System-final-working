package com.bank.service;

import java.util.List;
import com.bank.entity.Transaction;

public interface TransactionService {

    List<Transaction> getTransactions(String accountNumber);

    List<Transaction> getAllTransactions();

    void deleteTransactions(String accNo);
}
