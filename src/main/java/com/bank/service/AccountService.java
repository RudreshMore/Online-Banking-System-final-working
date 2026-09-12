package com.bank.service;

import com.bank.entity.Account;
import com.bank.entity.User;

public interface AccountService {

    Account createAccount(User user);

    Account getAccountByUser(User user);

    void deleteAccountByUser(User user);

    void adminDeposit(Long userId, double amount);
}
