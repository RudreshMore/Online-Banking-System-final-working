package com.bank.service;

public interface TransferService {

    void transferMoney(String fromAccNo,
                       String toAccNo,
                       double amount);
}
